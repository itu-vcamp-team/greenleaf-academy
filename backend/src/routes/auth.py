import uuid
import json
from datetime import datetime, timezone, timedelta
from typing import Dict, Any

from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import redis.asyncio as aioredis

from src.datalayer.database import get_db_session
from src.datalayer.model.db.user import User, UserRole
from src.datalayer.model.db.tenant import Tenant
from src.datalayer.model.db.reference_code import ReferenceCode
from src.datalayer.model.dto.auth_dto import (
    RegisterStep1Schema, RegisterStep2Schema, RegisterStep3Schema,
    LoginSchema, LoginResponseSchema, TokenResponseSchema,
    VerifyEmailSchema, Verify2FASchema, RefreshTokenSchema,
    ForgotPasswordSchema, ResetPasswordSchema
)
from src.services import (
    PasswordService, TokenService, CaptchaService, 
    OTPService, GreenleafGlobalService, SessionService,
    MailingService
)
from src.config import get_settings
from src.logger import logger

from src.utils.auth_deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])
settings = get_settings()

@router.get("/verify-global")
async def verify_token_and_get_user(current_user: User = Depends(get_current_user)):
    """
    Returns the current user's profile and role.
    Used by frontend to sync state on load.
    """
    return {
        "id": str(current_user.id),
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role.value,
        "partner_id": current_user.partner_id,
        "profile_image_path": current_user.profile_image_path
    }

# --- CAPTCHA ---

@router.get("/captcha")
async def get_captcha():
    """
    Returns 4 random numbers and a session_key for login captcha.
    """
    session_key = str(uuid.uuid4())
    numbers = await CaptchaService.generate_login_captcha(session_key)
    return {"session_key": session_key, "numbers": numbers}


# --- REGISTRATION (3 STEPS) ---

@router.post("/register/step1")
async def register_step1(data: RegisterStep1Schema):
    """
    Step 1: Basic user info.
    Stores data in Redis temporarily.
    """
    session_id = str(uuid.uuid4())
    temp_data = data.model_dump()
    temp_data["password_hash"] = PasswordService.hash_password(data.password)
    del temp_data["password"]

    r = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    await r.setex(f"reg_temp:{session_id}", 1800, json.dumps(temp_data))
    await r.aclose()

    return {"session_id": session_id}


@router.post("/register/step2")
async def register_step2(data: RegisterStep2Schema):
    """
    Step 2: External Greenleaf Global verification.
    """
    verified = await GreenleafGlobalService.verify_greenleaf_global_credentials(
        data.gl_username, data.gl_password
    )
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Greenleaf Global credentials could not be verified."
        )
    
    r = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    stored = await r.get(f"reg_temp:{data.session_id}")
    if not stored:
        await r.aclose()
        raise HTTPException(status_code=404, detail="Registration session expired.")
    
    temp_data = json.loads(stored)
    temp_data["gl_verified"] = True
    temp_data["gl_username"] = data.gl_username
    
    await r.setex(f"reg_temp:{data.session_id}", 1800, json.dumps(temp_data))
    await r.aclose()

    return {"status": "verified"}


@router.post("/register/step3")
async def register_step3(
    data: RegisterStep3Schema, 
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db_session)
):
    """
    Step 3: Reference code and DB write.
    """
    r = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    stored = await r.get(f"reg_temp:{data.session_id}")
    if not stored:
        await r.aclose()
        raise HTTPException(status_code=404, detail="Registration session expired.")
    
    temp_data = json.loads(stored)
    if not temp_data.get("gl_verified"):
        await r.aclose()
        raise HTTPException(status_code=400, detail="Greenleaf Global verification missing.")

    tenant_id = getattr(request.state, "tenant_id", None)
    if not tenant_id:
         raise HTTPException(status_code=400, detail="Tenant context missing.")

    is_active = False
    inviter_id = None
    
    if data.has_partner_id:
        if not data.reference_code:
            raise HTTPException(status_code=400, detail="Reference code required.")
        
        stmt = select(ReferenceCode).where(ReferenceCode.code == data.reference_code, ReferenceCode.is_used == False)
        res = await db.execute(stmt)
        ref = res.scalar_one_or_none()
        
        if not ref:
            raise HTTPException(status_code=400, detail="Invalid or used reference code.")
        
        inviter_id = ref.created_by
        ref.is_used = True
        ref.used_at = datetime.now(timezone.utc)
        
        if settings.APP_ENV == "development":
            is_active = True
    else:
        # User chose "No Partner ID" -> goes to waitlist
        # Notify Admins via Background Tasks
        stmt_admins = select(User.email).where(User.role.in_([UserRole.ADMIN, UserRole.SUPERADMIN]))
        res_admins = await db.execute(stmt_admins)
        admin_emails = [row[0] for row in res_admins.all()]
        
        if admin_emails:
            background_tasks.add_task(
                MailingService.send_waitlist_notification_to_admin,
                admin_emails=admin_emails,
                applicant_name=temp_data["full_name"],
                applicant_email=temp_data["email"],
                supervisor_name=data.supervisor_name
            )

    new_user = User(
        id=uuid.uuid4(),
        tenant_id=tenant_id,
        username=temp_data["username"],
        email=temp_data["email"],
        full_name=temp_data["full_name"],
        phone=temp_data.get("phone"),
        password_hash=temp_data["password_hash"],
        role=UserRole.PARTNER,
        is_active=is_active,
        is_verified=False,
        inviter_id=inviter_id,
        consent_given_at=datetime.now(timezone.utc),
        consent_ip=request.client.host if request.client else None,
        supervisor_note=data.supervisor_name
    )
    
    db.add(new_user)
    await db.commit()
    await r.delete(f"reg_temp:{data.session_id}")
    await r.aclose()

    otp = await OTPService.generate_otp(str(new_user.id))
    background_tasks.add_task(
        MailingService.send_activation_email,
        to_email=new_user.email,
        code=otp,
        full_name=new_user.full_name
    )
    
    logger.info(f"OTP generated and background task added for user {new_user.username}")

    return {"user_id": new_user.id, "status": "pending_email_verification"}


# --- LOGIN & 2FA ---

@router.post("/login", response_model=LoginResponseSchema)
async def login(
    data: LoginSchema,
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db_session)
):
    try:
        # 1. Verify CAPTCHA
        if not await CaptchaService.verify_login_captcha(data.session_key, data.captcha_answer):
            raise HTTPException(status_code=400, detail="Invalid CAPTCHA answer.")

        # 2. Find User
        stmt = select(User).where(User.username == data.username)
        res = await db.execute(stmt)
        user = res.scalar_one_or_none()

        if not user or not PasswordService.verify_password(data.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid username or password.")

        if not user.is_active:
            raise HTTPException(status_code=403, detail="Account is not active. Please contact admin.")

        # 3. Check for 30-day 2FA
        now = datetime.now(timezone.utc)
        requires_2fa = False
        
        if not user.last_2fa_at:
            requires_2fa = True
        else:
            # Ensure last_2fa_at is treated as UTC for comparison
            # SQLAlchemy DateTime(timezone=True) handles this, but we force for safety
            last_dt = user.last_2fa_at.replace(tzinfo=timezone.utc) if user.last_2fa_at.tzinfo is None else user.last_2fa_at
            if now - last_dt > timedelta(days=30):
                requires_2fa = True

        if requires_2fa:
            logger.info(f"Triggering 2FA for user {user.username}")
            otp = await OTPService.generate_otp(str(user.id))
            
            background_tasks.add_task(
                MailingService.send_monthly_2fa_email,
                to_email=user.email,
                code=otp,
                full_name=user.full_name
            )
            
            temp_token = str(uuid.uuid4())
            r = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
            await r.setex(f"login_2fa:{temp_token}", 300, str(user.id))
            await r.aclose()
            
            return LoginResponseSchema(requires_2fa=True, temp_token=temp_token, user_id=user.id)

        # 4. Success -> Create Session (Kick-out happens here)
        jti = await SessionService.create_session(
            db, user.id, 
            ip_address=request.client.host if request.client else None,
            device_info=request.headers.get("user-agent")
        )
        await db.commit()

        access_token = TokenService.create_access_token(str(user.id), user.role.value, str(user.tenant_id), jti)
        refresh_token = TokenService.create_refresh_token(str(user.id), jti)

        return LoginResponseSchema(
            tokens=TokenResponseSchema(access_token=access_token, refresh_token=refresh_token)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"CRITICAL LOGIN ERROR: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, 
            detail="An internal server error occurred during login. Please try again later."
        )


@router.post("/login/verify-2fa", response_model=TokenResponseSchema)
async def verify_2fa(
    data: Verify2FASchema,
    request: Request,
    db: AsyncSession = Depends(get_db_session)
):
    r = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    stored_user_id = await r.get(f"login_2fa:{data.temp_token}")
    
    if not stored_user_id or stored_user_id != str(data.user_id):
        await r.aclose()
        raise HTTPException(status_code=400, detail="Invalid or expired 2FA session.")

    if not await OTPService.verify_otp(str(data.user_id), data.code):
        await r.aclose()
        raise HTTPException(status_code=400, detail="Invalid OTP code.")

    await r.delete(f"login_2fa:{data.temp_token}")
    await r.aclose()

    stmt = select(User).where(User.id == data.user_id)
    res = await db.execute(stmt)
    user = res.scalar_one()
    user.last_2fa_at = datetime.now(timezone.utc)

    jti = await SessionService.create_session(
        db, user.id, 
        ip_address=request.client.host if request.client else None,
        device_info=request.headers.get("user-agent")
    )
    await db.commit()

    access_token = TokenService.create_access_token(str(user.id), user.role.value, str(user.tenant_id), jti)
    refresh_token = TokenService.create_refresh_token(str(user.id), jti)

    return TokenResponseSchema(access_token=access_token, refresh_token=refresh_token)


# --- PASSWORD RESET FLOW ---

@router.post("/forgot-password")
async def forgot_password(
    email: str, # Usually from a simple schema, but doing it directly for now
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db_session)
):
    """Triggers password reset OTP via email."""
    stmt = select(User).where(User.email == email)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()
    
    if not user:
        # Don't reveal if user exists for security, just return success
        return {"message": "If this email is registered, you will receive a reset code."}
    
    otp = await OTPService.generate_otp(str(user.id), purpose="password_reset")
    background_tasks.add_task(
        MailingService.send_password_reset_email,
        to_email=user.email,
        code=otp,
        full_name=user.full_name
    )
    
    return {"message": "Reset code sent to your email."}


@router.post("/reset-password")
async def reset_password(
    data: ResetPasswordSchema,
    db: AsyncSession = Depends(get_db_session)
):
    """Verifies OTP and resets password."""
    if not await OTPService.verify_otp(str(data.user_id), data.code, purpose="password_reset"):
        raise HTTPException(status_code=400, detail="Invalid or expired reset code.")
    
    stmt = select(User).where(User.id == data.user_id)
    res = await db.execute(stmt)
    user = res.scalar_one()
    
    user.password_hash = PasswordService.hash_password(data.new_password)
    await db.commit()
    
    return {"message": "Password reset successfully."}

import uuid
import json
from datetime import datetime, timezone, timedelta
from typing import Dict, Any

from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
import redis.asyncio as aioredis

from src.datalayer.database import get_db_session
from src.datalayer.model.db.user import User, UserRole
from src.datalayer.model.db.reference_code import ReferenceCode
from src.datalayer.repository import WaitlistRepository
from src.datalayer.model.dto.auth_dto import (
    RegisterStep1Schema, RegisterStep2Schema, RegisterStep3Schema, RegisterVerifyOTPSchema,
    LoginSchema, LoginResponseSchema, TokenResponseSchema,
    Verify2FASchema, ResetPasswordSchema, ProfileUpdateSchema,
    RefreshTokenSchema, PasswordChangeRequestSchema, PasswordChangeVerifySchema
)
from src.services import (
    PasswordService, TokenService, CaptchaService,
    OTPService, GreenleafGlobalService, SessionService,
    MailingService, WaitlistService
)
from src.config import get_settings
from src.logger import logger

from src.utils.auth_deps import get_current_user, oauth2_scheme_strict
from src.utils.hash_utils import hash_gl_username
from src.utils.image_utils import process_and_save_avatar


def mask_email(email: str) -> str:
    """Masks an email address for privacy: gaffar@gmail.com -> g***r@gmail.com"""
    try:
        user_part, domain = email.split("@")
        if len(user_part) <= 2:
            return f"{user_part[0]}***@{domain}"
        return f"{user_part[0]}{'*' * (len(user_part) - 2)}{user_part[-1]}@{domain}"
    except Exception:
        return email

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
        "phone": current_user.phone,
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
async def register_step1(
    data: RegisterStep1Schema,
    db: AsyncSession = Depends(get_db_session)
):
    """
    Step 1: External Greenleaf Global verification.
    """
    # 1. Check if this Global account is already registered (using hash)
    gl_hash = hash_gl_username(data.gl_username)
    stmt = select(User).where(User.gl_username == gl_hash)
    res = await db.execute(stmt)
    if res.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu Greenleaf Global hesabı ile zaten bir üyelik oluşturulmuş."
        )

    # 2. Verify with External Service
    verified = await GreenleafGlobalService.verify_greenleaf_global_credentials(
        data.gl_username, data.gl_password
    )
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Greenleaf Global credentials could not be verified."
        )

    session_id = str(uuid.uuid4())
    temp_data = {
        "gl_verified": True,
        "gl_username_hash": gl_hash
    }

    r = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    await r.setex(f"reg_temp:{session_id}", 1800, json.dumps(temp_data))
    await r.aclose()

    return {"session_id": session_id}


@router.post("/register/step2")
async def register_step2(data: RegisterStep2Schema):
    """
    Step 2: Partner / Reference Info.
    """
    r = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    stored = await r.get(f"reg_temp:{data.session_id}")
    if not stored:
        await r.aclose()
        raise HTTPException(status_code=404, detail="Registration session expired.")

    temp_data = json.loads(stored)
    temp_data["has_partner_id"] = data.has_partner_id
    temp_data["reference_code"] = data.reference_code
    temp_data["supervisor_name"] = data.supervisor_name

    await r.setex(f"reg_temp:{data.session_id}", 1800, json.dumps(temp_data))
    await r.aclose()

    return {"status": "ok"}


@router.post("/register/step3")
async def register_step3(
    data: RegisterStep3Schema,
    db: AsyncSession = Depends(get_db_session)
):
    """
    Step 3: Account Details + Send OTP.
    """
    r = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    stored = await r.get(f"reg_temp:{data.session_id}")
    if not stored:
        await r.aclose()
        raise HTTPException(status_code=404, detail="Registration session expired.")

    # Check uniqueness
    stmt = select(User).where((User.username == data.username) | (User.email == data.email))
    res = await db.execute(stmt)
    if res.scalar_one_or_none():
        await r.aclose()
        raise HTTPException(status_code=400, detail="Username or email already exists.")

    temp_data = json.loads(stored)
    temp_data.update({
        "username": data.username,
        "email": data.email,
        "full_name": data.full_name,
        "phone": data.phone,
        "password_hash": PasswordService.hash_password(data.password),
        "legal_accepted": True # DTO validates this
    })

    # Generate OTP
    otp = await OTPService.generate_otp(f"reg_otp:{data.session_id}", purpose="registration")
    
    # Send email (immediate for now, or background)
    await MailingService.send_activation_email(
        to_email=data.email,
        code=otp,
        full_name=data.full_name
    )

    await r.setex(f"reg_temp:{data.session_id}", 1800, json.dumps(temp_data))
    await r.aclose()

    return {"status": "otp_sent"}


@router.post("/register/verify-otp")
async def register_verify_otp(
    data: RegisterVerifyOTPSchema,
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db_session)
):
    """
    Step 4: Final Email Verification & Entry Creation (Waitlist or User).
    """
    # 1. Verify OTP
    if not await OTPService.verify_otp(f"reg_otp:{data.session_id}", data.code, purpose="registration"):
        raise HTTPException(status_code=400, detail="Invalid or expired verification code.")

    # 2. Get Stored Data
    r = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    stored = await r.get(f"reg_temp:{data.session_id}")
    if not stored:
        await r.aclose()
        raise HTTPException(status_code=404, detail="Registration session expired.")

    temp_data = json.loads(stored)
    
    # 3. Decision Logic: Waitlist or User?
    if not temp_data.get("has_partner_id"):
        # CASE: NO PARTNER ID -> WAITLIST
        repo = WaitlistRepository(db)
        service = WaitlistService(repo)
        
        await service.apply(
            full_name=temp_data["full_name"],
            email=temp_data["email"],
            phone=temp_data.get("phone"),
            supervisor_name=temp_data.get("supervisor_name"),
            message="Self-registration via Waitlist flow."
        )

        # Notify Admins
        stmt_admins = select(User.email).where(User.role.in_([UserRole.ADMIN]))
        res_admins = await db.execute(stmt_admins)
        admin_emails = [row[0] for row in res_admins.all()]
        if admin_emails:
            background_tasks.add_task(
                MailingService.send_waitlist_notification_to_admin,
                admin_emails=admin_emails,
                applicant_name=temp_data["full_name"],
                applicant_email=temp_data["email"],
                supervisor_name=temp_data.get("supervisor_name")
            )

        await db.commit()
        await r.delete(f"reg_temp:{data.session_id}")
        await r.aclose()
        return {"status": "waitlisted"}

    # CASE: HAS PARTNER ID -> PENDING USER
    ref_code = temp_data.get("reference_code")
    if not ref_code:
        await r.aclose()
        raise HTTPException(status_code=400, detail="Reference code required.")

    stmt = select(ReferenceCode).where(ReferenceCode.code == ref_code, ReferenceCode.is_used == False)
    res = await db.execute(stmt)
    ref = res.scalar_one_or_none()

    if not ref:
        await r.aclose()
        raise HTTPException(status_code=400, detail="Invalid or used reference code.")

    inviter_id = ref.created_by
    ref.is_used = True
    ref.used_at = datetime.now(timezone.utc)

    # Create User (always inactive pending admin approval)
    new_user = User(
        id=uuid.uuid4(),
        username=temp_data["username"],
        email=temp_data["email"],
        full_name=temp_data["full_name"],
        phone=temp_data.get("phone"),
        password_hash=temp_data["password_hash"],
        gl_username=temp_data.get("gl_username_hash"),
        role=UserRole.PARTNER,
        is_active=False, # Always False, needs admin/inviter approval
        is_verified=True,
        inviter_id=inviter_id,
        consent_given_at=datetime.now(timezone.utc),
        consent_ip=request.client.host if request.client else None,
        supervisor_note=temp_data.get("supervisor_name")
    )

    db.add(new_user)
    await db.commit()
    
    await r.delete(f"reg_temp:{data.session_id}")
    await r.aclose()

    return {"user_id": str(new_user.id), "status": "pending_approval"}


# --- TOKEN REFRESH ---

@router.post("/refresh", response_model=TokenResponseSchema)
async def refresh_token_endpoint(
    data: RefreshTokenSchema,
    db: AsyncSession = Depends(get_db_session),
):
    """
    Validates the refresh token and issues a new access token.
    The refresh token and session JTI remain unchanged (no rotation).
    """
    payload = TokenService.decode_token(data.refresh_token)

    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token.",
        )

    user_id: str | None = payload.get("sub")
    jti: str | None = payload.get("jti")

    if not user_id or not jti:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed refresh token.",
        )

    # Verify the session is still active
    if not await SessionService.is_session_active(db, jti):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or revoked. Please log in again.",
        )

    # Get fresh user data
    stmt = select(User).where(User.id == user_id)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or account deactivated.",
        )

    new_access_token = TokenService.create_access_token(
        str(user.id), user.role.value, jti
    )

    return TokenResponseSchema(
        access_token=new_access_token,
        refresh_token=data.refresh_token,   # same refresh token — no rotation
    )


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

            return LoginResponseSchema(
                requires_2fa=True,
                temp_token=temp_token,
                user_id=user.id,
                masked_email=mask_email(user.email)
            )

        # 4. Success -> Create Session
        jti = await SessionService.create_session(
            db, user.id,
            ip_address=request.client.host if request.client else None,
            device_info=request.headers.get("user-agent")
        )
        await db.commit()

        access_token = TokenService.create_access_token(str(user.id), user.role.value, jti)
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
    try:
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

        access_token = TokenService.create_access_token(str(user.id), user.role.value, jti)
        refresh_token = TokenService.create_refresh_token(str(user.id), jti)

        return TokenResponseSchema(access_token=access_token, refresh_token=refresh_token)
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        logger.error(f"CRITICAL 2FA ERROR: {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Backend Error (2FA): {error_msg}"
        )


# --- PASSWORD RESET FLOW ---

@router.post("/forgot-password")
async def forgot_password(
    email: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db_session)
):
    """Triggers password reset OTP via email."""
    stmt = select(User).where(User.email == email)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user:
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
    """Verifies OTP and resets password using email."""
    # 1. Find User
    stmt = select(User).where(User.email == data.email)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    # 2. Verify OTP
    if not await OTPService.verify_otp(str(user.id), data.code, purpose="password_reset"):
        raise HTTPException(status_code=400, detail="Geçersiz veya süresi dolmuş doğrulama kodu.")

    # 3. Update Password
    user.password_hash = PasswordService.hash_password(data.new_password)
    
    # 4. Global Logout for security
    await SessionService.deactivate_all_user_sessions(db, user.id)
    
    await db.commit()
    return {"message": "Şifreniz başarıyla sıfırlandı. Yeni şifrenizle giriş yapabilirsiniz."}


# --- PROFILE ---

@router.get("/profile")
async def get_profile(current_user: User = Depends(get_current_user)):
    """Returns the current user's full profile."""
    return {
        "id": str(current_user.id),
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "phone": current_user.phone,
        "role": current_user.role.value,
        "partner_id": current_user.partner_id,
        "profile_image_path": current_user.profile_image_path,
        "is_verified": current_user.is_verified,
        "consent_given_at": current_user.consent_given_at.isoformat() if current_user.consent_given_at else None,
    }


@router.patch("/profile")
async def update_profile(
    data: ProfileUpdateSchema,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    """
    Updates the current user's profile (name, phone).
    Password change is now handled via a separate secure OTP flow.
    """
    if data.full_name is not None:
        current_user.full_name = data.full_name

    if data.phone is not None:
        current_user.phone = data.phone

    await db.commit()
    return {"message": "Profil bilgileri güncellendi."}


@router.post("/profile/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    """
    Uploads and optimizes a profile picture.
    Converts to WebP and resizes to 400x400.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Sadece görsel dosyaları yüklenebilir.")
    
    try:
        path = await process_and_save_avatar(file, current_user.id)
        current_user.profile_image_path = path
        await db.commit()
        return {"profile_image_path": path}
    except Exception as e:
        logger.error(f"Avatar upload error: {str(e)}")
        raise HTTPException(status_code=500, detail="Görsel işlenirken bir hata oluştu.")


@router.post("/profile/password-reset/request")
async def request_password_change(
    data: PasswordChangeRequestSchema,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
):
    """
    Triggers a secure password change by sending an OTP to the user's email.
    Current password must be verified first.
    """
    if not PasswordService.verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Mevcut şifreniz hatalı.")

    otp = await OTPService.generate_otp(f"pwd_change:{current_user.id}", purpose="password_change")
    
    background_tasks.add_task(
        MailingService.send_password_reset_email,
        to_email=current_user.email,
        code=otp,
        full_name=current_user.full_name
    )

    return {"message": "Doğrulama kodu e-postanıza gönderildi."}


@router.post("/profile/password-reset/verify")
async def verify_password_change(
    data: PasswordChangeVerifySchema,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    """
    Verifies OTP and updates the password.
    Logs out the user from ALL devices for security.
    """
    if not await OTPService.verify_otp(f"pwd_change:{current_user.id}", data.otp_code, purpose="password_change"):
        raise HTTPException(status_code=400, detail="Geçersiz veya süresi dolmuş doğrulama kodu.")

    # 1. Update Password
    current_user.password_hash = PasswordService.hash_password(data.new_password)
    
    # 2. Deactivate ALL sessions for this user (Global Logout)
    await SessionService.deactivate_all_user_sessions(db, current_user.id)
    
    await db.commit()
    return {"message": "Şifreniz başarıyla güncellendi. Güvenliğiniz için tüm oturumlar sonlandırıldı. Lütfen tekrar giriş yapın."}


# --- LOGOUT ---

@router.post("/logout")
async def logout(
    token: str = Depends(oauth2_scheme_strict),
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    """Invalidates the current session (single-device logout)."""
    payload = TokenService.decode_token(token)
    jti = payload.get("jti") if payload else None
    if jti:
        await SessionService.deactivate_session(db, jti)
        await db.commit()
    return {"message": "Logged out successfully."}


@router.post("/logout-all")
async def logout_all(
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    """Invalidates all active sessions for the current user."""
    await SessionService.deactivate_all_user_sessions(db, current_user.id)
    await db.commit()
    return {"message": "Tüm oturumlar başarıyla sonlandırıldı."}

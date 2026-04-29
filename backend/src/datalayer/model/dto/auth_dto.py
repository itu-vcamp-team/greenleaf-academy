import re
import uuid
from typing import Optional, Literal
from pydantic import BaseModel, EmailStr, field_validator


class RegisterStep1Schema(BaseModel):
    """Step 1: Global Office Verification"""
    gl_username: str
    gl_password: str
    captcha_token: str  # Cloudflare Turnstile token


class RegisterStep2Schema(BaseModel):
    """Step 2: Partner / Reference Info"""
    session_id: str
    has_partner_id: bool
    reference_code: Optional[str] = None
    supervisor_name: Optional[str] = None


class RegisterStep3Schema(BaseModel):
    """Step 3: Account Details"""
    session_id: str
    full_name: str
    username: str
    email: EmailStr
    phone: Optional[str] = None
    password: str
    confirm_password: str
    kvkk_accepted: bool = False
    aydinlatma_accepted: bool = False

    @field_validator("phone", mode="before")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v == "":
            return None
        # Strip all whitespace
        cleaned = "".join(str(v).split())
        if not re.match(r'^\+90[0-9]{10}$', cleaned):
            raise ValueError(
                "Telefon numarası +90XXXXXXXXXX formatında olmalıdır. Örnek: +905551234567"
            )
        return cleaned

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one digit.")
        return v

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("Passwords do not match.")
        return v
    
    @field_validator("kvkk_accepted", "aydinlatma_accepted")
    @classmethod
    def validate_legal(cls, v: bool) -> bool:
        if not v:
            raise ValueError("Devam etmek için yasal metinleri onaylamanız gerekmektedir.")
        return v


class RegisterVerifyOTPSchema(BaseModel):
    """Step 4: Final Email OTP Verification"""
    session_id: str
    code: str


class LoginSchema(BaseModel):
    username: str
    password: str
    captcha_token: str # Cloudflare Turnstile Token


class VerifyEmailSchema(BaseModel):
    user_id: uuid.UUID
    code: str


class Verify2FASchema(BaseModel):
    user_id: uuid.UUID
    temp_token: str
    code: str


class RefreshTokenSchema(BaseModel):
    refresh_token: str


class TokenResponseSchema(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class LoginResponseSchema(BaseModel):
    requires_2fa: bool = False
    temp_token: Optional[str] = None
    tokens: Optional[TokenResponseSchema] = None
    user_id: Optional[uuid.UUID] = None
    masked_email: Optional[str] = None


# --- PASSWORD RESET SCHEMAS ---

class ForgotPasswordSchema(BaseModel):
    email: EmailStr
    captcha_token: str  # Cloudflare Turnstile token


# --- PROFILE UPDATE & SECURE PASSWORD CHANGE ---

class ProfileUpdateSchema(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None

    @field_validator("phone", mode="before")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v == "":
            return None
        # Strip all whitespace
        cleaned = "".join(str(v).split())
        if not re.match(r'^\+90[0-9]{10}$', cleaned):
            raise ValueError(
                "Telefon numarası +90XXXXXXXXXX formatında olmalıdır. Örnek: +905551234567"
            )
        return cleaned


class PasswordChangeRequestSchema(BaseModel):
    """
    Initial request to change password.
    Accepts current + new passwords upfront; OTP is sent after validation.
    """
    current_password: str
    new_password: str
    confirm_new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Şifre en az 8 karakter olmalıdır.")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Şifre en az bir büyük harf içermelidir.")
        if not re.search(r"[0-9]", v):
            raise ValueError("Şifre en az bir rakam içermelidir.")
        return v

    @field_validator("confirm_new_password")
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        if "new_password" in info.data and v != info.data["new_password"]:
            raise ValueError("Yeni şifreler birbiriyle eşleşmiyor.")
        return v


class PasswordChangeVerifySchema(BaseModel):
    """Finalizing password change — only the OTP code is needed here."""
    otp_code: str


class EmailChangeRequestSchema(BaseModel):
    """Request to change the account e-mail address; triggers OTP to the new address."""
    new_email: EmailStr


class EmailChangeVerifySchema(BaseModel):
    """Verify OTP sent to new e-mail to confirm address change."""
    otp_code: str


class ResetPasswordSchema(BaseModel):
    email: EmailStr
    code: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        return v




class AdminCreateUserSchema(BaseModel):
    """Used by ADMIN to create PARTNER users directly."""
    full_name: str
    username: str
    email: EmailStr
    phone: Optional[str] = None
    password: str
    role: Literal["ADMIN", "PARTNER"] = "PARTNER"

    @field_validator("phone", mode="before")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v == "":
            return None
        cleaned = str(v).strip()
        if not re.match(r'^\+[0-9]{7,15}$', cleaned):
            raise ValueError("Telefon numarası uluslararası formatta olmalıdır. Örnek: +905551234567")
        return cleaned

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Şifre en az 8 karakter olmalıdır.")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Şifre en az bir büyük harf içermelidir.")
        if not re.search(r"[0-9]", v):
            raise ValueError("Şifre en az bir rakam içermelidir.")
        return v

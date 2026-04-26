import re
import uuid
from typing import Optional, Literal
from pydantic import BaseModel, EmailStr, field_validator


class RegisterStep1Schema(BaseModel):
    full_name: str
    username: str
    email: EmailStr
    phone: Optional[str] = None
    password: str

    @field_validator("phone", mode="before")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v == "":
            return None
        cleaned = str(v).strip()
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


class RegisterStep2Schema(BaseModel):
    session_id: str  # Redis key for temp registration data
    gl_username: str
    gl_password: str


class RegisterStep3Schema(BaseModel):
    session_id: str
    has_partner_id: bool
    reference_code: Optional[str] = None
    supervisor_name: Optional[str] = None


class LoginSchema(BaseModel):
    username: str
    password: str
    session_key: str    # CAPTCHA session key
    captcha_answer: int # Sum of numbers displayed


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


# --- PROFILE UPDATE SCHEMA ---

class ProfileUpdateSchema(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None

    @field_validator("phone", mode="before")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v == "":
            return None
        cleaned = str(v).strip()
        if not re.match(r'^\+90[0-9]{10}$', cleaned):
            raise ValueError(
                "Telefon numarası +90XXXXXXXXXX formatında olmalıdır. Örnek: +905551234567"
            )
        return cleaned


class ResetPasswordSchema(BaseModel):
    user_id: uuid.UUID
    code: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        return v


# NOTE: SuperadminCreateUserSchema moved to superadmin service.
# Kept for backward compatibility — tenant_id removed.

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

"""
Data Transfer Objects (DTO) and Pydantic schemas module.
Contains all request/response models for the API.
"""

from .user_dto import UserBase, UserCreate, UserUpdate, UserResponse
from .academy_content_dto import (
    AcademyContentBase,
    AcademyContentCreate,
    AcademyContentUpdate,
    AcademyContentResponse
)
from .auth_dto import (
    RegisterStep1Schema,
    RegisterStep2Schema,
    RegisterStep3Schema,
    LoginSchema,
    VerifyEmailSchema,
    Verify2FASchema,
    RefreshTokenSchema,
    TokenResponseSchema,
    LoginResponseSchema,
    ForgotPasswordSchema,
    ResetPasswordSchema,
    AdminCreateUserSchema
)
from .academy_schemas import (
    ContentBase,
    ContentCreate,
    ContentUpdate,
    UserProgressSchema,
    ContentResponse,
    GuestContentResponse
)

__all__ = [
    # User
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    # Academy Content DTO
    "AcademyContentBase",
    "AcademyContentCreate",
    "AcademyContentUpdate",
    "AcademyContentResponse",
    # Auth
    "RegisterStep1Schema",
    "RegisterStep2Schema",
    "RegisterStep3Schema",
    "LoginSchema",
    "VerifyEmailSchema",
    "Verify2FASchema",
    "RefreshTokenSchema",
    "TokenResponseSchema",
    "LoginResponseSchema",
    "ForgotPasswordSchema",
    "ResetPasswordSchema",
    "AdminCreateUserSchema",
    # Academy Schemas
    "ContentBase",
    "ContentCreate",
    "ContentUpdate",
    "UserProgressSchema",
    "ContentResponse",
    "GuestContentResponse",
]

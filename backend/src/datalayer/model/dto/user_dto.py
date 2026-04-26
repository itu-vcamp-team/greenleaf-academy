from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, EmailStr
from src.datalayer.model.db.user import UserRole


class UserBase(BaseModel):
    role: UserRole = UserRole.GUEST
    username: str = Field(..., max_length=50)
    email: EmailStr
    full_name: str = Field(..., max_length=150)
    phone: Optional[str] = Field(None, max_length=20)
    partner_id: Optional[str] = Field(None, max_length=50)
    inviter_id: Optional[UUID] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    is_verified: Optional[bool] = None
    is_active: Optional[bool] = None
    profile_image_path: Optional[str] = None


class UserResponse(UserBase):
    id: UUID
    is_verified: bool
    is_active: bool
    profile_image_path: Optional[str]
    created_at: datetime
    updated_at: datetime
    last_login_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)

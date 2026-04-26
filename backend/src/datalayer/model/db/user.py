import uuid
from typing import Optional
from enum import Enum
from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, ForeignKey, Enum as SQLEnum, DateTime
from src.datalayer.model.db.base import BaseModel


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    EDITOR = "EDITOR"
    PARTNER = "PARTNER"
    GUEST = "GUEST"


class User(BaseModel):
    __tablename__ = "users"

    role: Mapped[UserRole] = mapped_column(SQLEnum(UserRole), default=UserRole.GUEST)

    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(150))

    phone: Mapped[Optional[str]] = mapped_column(String(20), default=None)
    partner_id: Mapped[Optional[str]] = mapped_column(String(50), index=True, default=None)
    inviter_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id"), default=None)

    is_verified: Mapped[bool] = mapped_column(default=False)
    is_active: Mapped[bool] = mapped_column(default=False)

    profile_image_path: Mapped[Optional[str]] = mapped_column(String(500), default=None)
    last_2fa_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), default=None)
    supervisor_note: Mapped[Optional[str]] = mapped_column(String(500), default=None)

    consent_given_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), default=None)
    consent_ip: Mapped[Optional[str]] = mapped_column(String(45), default=None)

    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), default=None)
    last_active_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), default=None)

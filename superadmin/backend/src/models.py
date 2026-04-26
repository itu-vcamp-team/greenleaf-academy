"""
Superadmin database models.
Tracks registered Greenleaf Academy deployments and superadmin accounts.
"""
import uuid
from typing import Optional
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, DeclarativeBase


class Base(DeclarativeBase):
    pass


class Deployment(Base):
    """
    Represents a registered Greenleaf Academy deployment (e.g. Turkey, Germany).
    Each deployment is an independent instance with its own backend + frontend.
    """
    __tablename__ = "deployments"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(100))
    # e.g. "Greenleaf Türkiye", "Greenleaf Deutschland"

    country_code: Mapped[str] = mapped_column(String(5), index=True)
    # ISO 3166-1 alpha-2: "TR", "DE", "FR"

    api_base_url: Mapped[str] = mapped_column(String(500))
    # e.g. "https://api.greenleaf-tr.com" — main app backend URL

    api_key: Mapped[str] = mapped_column(String(500))
    # JWT or API key to authenticate with deployment's admin endpoints

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    notes: Mapped[Optional[str]] = mapped_column(Text, default=None)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )


class SuperadminUser(Base):
    """
    Superadmin accounts — completely separate from main app users.
    """
    __tablename__ = "superadmin_users"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(150))

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )
    last_login_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), default=None
    )

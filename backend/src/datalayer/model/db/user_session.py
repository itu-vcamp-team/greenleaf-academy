import uuid
from typing import Optional
from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, ForeignKey, DateTime
from src.datalayer.model.db.base import BaseModel


class UserSession(BaseModel):
    __tablename__ = "user_sessions"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)

    token_jti: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    # JWT ID (jti) claim.

    is_active: Mapped[bool] = mapped_column(default=True)
    # Set to False when a new session is created (kick-out).

    device_info: Mapped[Optional[str]] = mapped_column(String(300), default=None)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), default=None)

    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    last_used_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), default=None)

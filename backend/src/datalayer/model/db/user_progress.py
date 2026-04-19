import uuid
from typing import Optional
from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, ForeignKey, DateTime, UniqueConstraint
from src.datalayer.model.db.base import BaseModel


class UserProgress(BaseModel):
    __tablename__ = "user_progress"
    __table_args__ = (
        UniqueConstraint("user_id", "content_id", name="uq_user_content"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    content_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("academy_contents.id"), index=True)

    status: Mapped[str] = mapped_column(String(20), default="not_started")
    # "not_started" | "in_progress" | "completed"

    completion_percentage: Mapped[float] = mapped_column(default=0.0)
    last_watched_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), default=None)
    last_position_seconds: Mapped[Optional[float]] = mapped_column(default=None)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), default=None)

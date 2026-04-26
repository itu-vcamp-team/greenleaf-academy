import uuid
from typing import Optional
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, ForeignKey, Text
from src.datalayer.model.db.base import BaseModel


class Waitlist(BaseModel):
    __tablename__ = "waitlist"

    full_name: Mapped[str] = mapped_column(String(150))
    email: Mapped[str] = mapped_column(String(255), index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), default=None)

    supervisor_name: Mapped[Optional[str]] = mapped_column(String(150), default=None)
    message: Mapped[Optional[str]] = mapped_column(Text, default=None)

    is_processed: Mapped[bool] = mapped_column(default=False)
    processed_by: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id"), default=None)

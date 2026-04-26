import uuid
from typing import Optional
from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, ForeignKey, DateTime
from src.datalayer.model.db.base import BaseModel


class ReferenceCode(BaseModel):
    __tablename__ = "reference_codes"

    code: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    # Admin created one-time invitation code. e.g. "GL-A7X2B3"

    created_by: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    # user.id of the partner who created the code

    is_used: Mapped[bool] = mapped_column(default=False)

    used_by: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id"), default=None)
    used_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), default=None)

    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), default=None)

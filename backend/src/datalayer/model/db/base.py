import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import DateTime, text
from src.datalayer.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class BaseModel(Base):
    """Abstract base model for all tables to inherit from"""
    __abstract__ = True

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, 
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()")
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=utcnow,
        server_default=text("now()")
    )
    
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=utcnow,
        server_default=text("now()"),
        onupdate=utcnow
    )

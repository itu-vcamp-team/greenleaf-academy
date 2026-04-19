import uuid
from typing import Optional
from datetime import datetime
from enum import Enum
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, ForeignKey, Enum as SQLEnum, DateTime
from src.datalayer.model.db.base import BaseModel


class EventCategory(str, Enum):
    WEBINAR = "WEBINAR"
    TRAINING = "TRAINING"
    CORPORATE = "CORPORATE"
    MEETUP = "MEETUP"


class EventVisibility(str, Enum):
    ALL = "ALL"
    PARTNER_ONLY = "PARTNER_ONLY"


class Event(BaseModel):
    __tablename__ = "events"

    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenants.id"), index=True)

    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[Optional[str]] = mapped_column(String(3000), default=None)

    category: Mapped[EventCategory] = mapped_column(SQLEnum(EventCategory))

    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    end_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), default=None)

    meeting_link: Mapped[Optional[str]] = mapped_column(String(500), default=None)
    location: Mapped[Optional[str]] = mapped_column(String(300), default=None)

    cover_image_path: Mapped[Optional[str]] = mapped_column(String(500), default=None)
    contact_info: Mapped[Optional[str]] = mapped_column(String(500), default=None)

    visibility: Mapped[EventVisibility] = mapped_column(SQLEnum(EventVisibility), default=EventVisibility.PARTNER_ONLY)
    is_published: Mapped[bool] = mapped_column(default=False)

import uuid
from typing import Optional

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from src.datalayer.model.db.base import BaseModel


class EventCalendarRsvp(BaseModel):
    """
    Tracks every calendar-invite request for an event.
    Both unauthenticated guests (is_member=False) and authenticated
    members (is_member=True) are recorded so admins can see demand.
    """

    __tablename__ = "event_calendar_rsvps"

    event_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("events.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    email: Mapped[str] = mapped_column(String(255), index=True, nullable=False)

    full_name: Mapped[Optional[str]] = mapped_column(String(200), default=None)

    is_member: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    """True when the request was made by an authenticated (PARTNER/ADMIN) user."""

    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        default=None,
        nullable=True,
    )
    """Populated when the requester is an authenticated member."""

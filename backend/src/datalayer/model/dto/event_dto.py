from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class GuestCalendarRequest(BaseModel):
    """Body for 'add to calendar' requests — guest or unauthenticated path."""
    email: str
    full_name: Optional[str] = None


class EventResponse(BaseModel):
    """Full event response for partners and admins."""
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: uuid.UUID
    title: str
    description: Optional[str] = None
    category: str
    start_time: datetime
    end_time: Optional[datetime] = None
    meeting_link: Optional[str] = None
    location: Optional[str] = None
    cover_image_url: Optional[str] = Field(None, alias="cover_image_path")
    contact_info: Optional[str] = None
    visibility: str
    is_published: bool = False
    is_rsvped: bool = False


class GuestEventResponse(BaseModel):
    """Stripped event response for guests — meeting_link is always stripped to None."""
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: uuid.UUID
    title: str
    description: Optional[str] = None
    category: str
    start_time: datetime
    end_time: Optional[datetime] = None
    meeting_link: Optional[str] = None  # Always forced to None via validator
    location: Optional[str] = None
    cover_image_url: Optional[str] = Field(None, alias="cover_image_path")
    contact_info: Optional[str] = None
    visibility: str

    @field_validator("meeting_link", mode="before")
    @classmethod
    def hide_meeting_link(cls, v: Any) -> None:  # noqa: ARG002
        """Guests never receive a meeting link regardless of DB value."""
        return None


class RsvpResponse(BaseModel):
    """Single calendar-RSVP record shown in the admin panel."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    event_id: uuid.UUID
    email: str
    full_name: Optional[str] = None
    is_member: bool
    created_at: datetime

import uuid
from typing import Optional
from pydantic import BaseModel, ConfigDict
from src.datalayer.model.db import ContentType, ContentStatus


class ContentBase(BaseModel):
    type: ContentType
    locale: str = "tr-TR"
    title: str
    description: Optional[str] = None
    video_url: str
    resource_link: Optional[str] = None
    resource_link_label: Optional[str] = None
    order: str = "000000"
    prerequisite_id: Optional[uuid.UUID] = None
    status: ContentStatus = ContentStatus.PUBLISHED
    is_public: bool = True


class ContentCreate(ContentBase):
    pass


class ContentUpdate(BaseModel):
    type: Optional[ContentType] = None
    locale: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    video_url: Optional[str] = None
    resource_link: Optional[str] = None
    resource_link_label: Optional[str] = None
    order: Optional[str] = None
    prerequisite_id: Optional[uuid.UUID] = None
    status: Optional[ContentStatus] = None
    is_new: Optional[bool] = None
    is_public: Optional[bool] = None


class UserProgressSchema(BaseModel):
    status: str
    completion_percentage: float = 0.0
    last_position_seconds: Optional[float] = None  # DB stores float; int would reject fractional values

    model_config = ConfigDict(from_attributes=True)


class ContentResponse(BaseModel):
    """Base response for partners, includes locks and progress."""
    id: uuid.UUID
    type: ContentType
    locale: str
    title: str
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    video_url: Optional[str] = None
    resource_link: Optional[str] = None
    resource_link_label: Optional[str] = None
    order: str
    status: ContentStatus = ContentStatus.PUBLISHED  # Added for admin view
    is_new: bool
    is_public: bool = True
    is_locked: bool = False
    progress: Optional[UserProgressSchema] = None
    next_id: Optional[uuid.UUID] = None
    prev_id: Optional[uuid.UUID] = None

    model_config = ConfigDict(from_attributes=True)


class GuestContentResponse(BaseModel):
    """
    Response for unauthenticated / GUEST users.
    - is_public=True  → is_locked=False, video_url is populated (they can watch)
    - is_public=False → is_locked=True,  video_url=None (listed but locked)
    """
    id: uuid.UUID
    type: ContentType
    locale: str
    title: str
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    video_url: Optional[str] = None          # present only when is_public=True
    order: str
    is_new: bool
    is_public: bool = True
    is_locked: bool = False                  # set dynamically in the route
    next_id: Optional[uuid.UUID] = None
    prev_id: Optional[uuid.UUID] = None

    model_config = ConfigDict(from_attributes=True)

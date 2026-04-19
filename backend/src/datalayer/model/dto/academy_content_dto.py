from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from src.datalayer.model.db.academy_content import ContentType, ContentStatus


class AcademyContentBase(BaseModel):
    tenant_id: UUID
    type: ContentType
    locale: str = Field(..., max_length=5)
    title: str = Field(..., max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    video_url: str = Field(..., max_length=500)
    resource_link: Optional[str] = Field(None, max_length=500)
    resource_link_label: Optional[str] = Field(None, max_length=100)
    order: int = 0
    status: ContentStatus = ContentStatus.DRAFT
    prerequisite_id: Optional[UUID] = None
    is_new: bool = True
    thumbnail_url: Optional[str] = None


class AcademyContentCreate(AcademyContentBase):
    pass


class AcademyContentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    video_url: Optional[str] = None
    resource_link: Optional[str] = None
    resource_link_label: Optional[str] = None
    order: Optional[int] = None
    status: Optional[ContentStatus] = None
    prerequisite_id: Optional[UUID] = None
    is_new: Optional[bool] = None


class AcademyContentResponse(AcademyContentBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

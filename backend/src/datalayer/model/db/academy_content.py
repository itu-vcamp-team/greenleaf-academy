import uuid
from typing import Optional
from enum import Enum
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, ForeignKey, Enum as SQLEnum
from src.datalayer.model.db.base import BaseModel


class ContentType(str, Enum):
    SHORT = "SHORT"
    MASTERCLASS = "MASTERCLASS"


class ContentStatus(str, Enum):
    PUBLISHED = "PUBLISHED"
    DRAFT = "DRAFT"


class AcademyContent(BaseModel):
    __tablename__ = "academy_contents"

    type: Mapped[ContentType] = mapped_column(SQLEnum(ContentType))
    locale: Mapped[str] = mapped_column(String(5), index=True)
    # e.g. "tr", "en", "de"

    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[Optional[str]] = mapped_column(String(2000), default=None)

    video_url: Mapped[str] = mapped_column(String(500))
    resource_link: Mapped[Optional[str]] = mapped_column(String(500), default=None)
    resource_link_label: Mapped[Optional[str]] = mapped_column(String(100), default=None)

    order: Mapped[int] = mapped_column(default=0, index=True)
    status: Mapped[ContentStatus] = mapped_column(SQLEnum(ContentStatus), default=ContentStatus.DRAFT)

    prerequisite_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("academy_contents.id"), default=None)
    is_new: Mapped[bool] = mapped_column(default=True)

    thumbnail_url: Mapped[Optional[str]] = mapped_column(String(500), default=None)

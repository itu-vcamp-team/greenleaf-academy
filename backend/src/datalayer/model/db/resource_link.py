import uuid
from typing import Optional
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, ForeignKey
from src.datalayer.model.db.base import BaseModel


class ResourceLink(BaseModel):
    __tablename__ = "resource_links"

    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[Optional[str]] = mapped_column(String(1000), default=None)

    url: Mapped[str] = mapped_column(String(500))
    category: Mapped[Optional[str]] = mapped_column(String(100), default=None)

    order: Mapped[int] = mapped_column(default=0)
    is_active: Mapped[bool] = mapped_column(default=True)

    created_by: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))

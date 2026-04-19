from typing import Optional
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, JSON
from src.datalayer.model.db.base import BaseModel


class Tenant(BaseModel):
    __tablename__ = "tenants"

    slug: Mapped[str] = mapped_column(String(10), unique=True, index=True)
    # Example slugs: "tr", "de", "fr"

    name: Mapped[str] = mapped_column(String(100))
    # Example: "Greenleaf Türkiye"

    is_active: Mapped[bool] = mapped_column(default=True)

    config: Mapped[Optional[dict]] = mapped_column(JSON, default={})
    # config content: logo_url, colors, support_links, social_media, etc.

import uuid
import enum
from typing import Optional
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, ForeignKey, Enum as SAEnum, Integer, Boolean
from src.datalayer.model.db.base import BaseModel


class ContactType(str, enum.Enum):
    EMAIL = "EMAIL"
    PHONE = "PHONE"
    WHATSAPP = "WHATSAPP"
    INSTAGRAM = "INSTAGRAM"
    YOUTUBE = "YOUTUBE"
    WEBSITE = "WEBSITE"
    OTHER = "OTHER"


class ContactInfo(BaseModel):
    """
    Generic contact info entries manageable by admins.
    Displayed publicly in navbar for guest and partner views when active entries exist.
    """
    __tablename__ = "contact_infos"

    owner_name: Mapped[str] = mapped_column(String(200))
    """Display name of the person or entity (e.g. 'Satış Ekibi', 'Ahmet Bey')."""

    label: Mapped[Optional[str]] = mapped_column(String(200), default=None)
    """Optional custom label shown to users (e.g. 'WhatsApp Destek Hattı')."""

    type: Mapped[ContactType] = mapped_column(
        SAEnum(ContactType, name="contacttype", create_type=False),
        # create_type=False: migrations own type creation; SQLAlchemy must not auto-create
        nullable=False,
    )

    value: Mapped[str] = mapped_column(String(500))
    """Raw contact value: email address, phone number, social handle, or URL."""

    order: Mapped[int] = mapped_column(Integer, default=0)
    """Display ordering (ascending). Lower = shown first."""

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    created_by: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)

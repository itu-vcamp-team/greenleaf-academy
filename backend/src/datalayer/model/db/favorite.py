import uuid
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import ForeignKey, UniqueConstraint
from src.datalayer.model.db.base import BaseModel


class Favorite(BaseModel):
    __tablename__ = "favorites"
    __table_args__ = (
        UniqueConstraint("user_id", "content_id", name="uq_user_favorite"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    content_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("academy_contents.id"), index=True)

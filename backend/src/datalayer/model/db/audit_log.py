import uuid
from typing import Optional
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, ForeignKey, JSON
from src.datalayer.model.db.base import BaseModel


class AuditLog(BaseModel):
    __tablename__ = "audit_logs"

    actor_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id"), index=True, default=None)

    action: Mapped[str] = mapped_column(String(100), index=True)
    entity_type: Mapped[str] = mapped_column(String(50))
    entity_id: Mapped[Optional[str]] = mapped_column(String(100), default=None)

    metadata_json: Mapped[Optional[dict]] = mapped_column(JSON, name="metadata", default={})
    
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), default=None)
    tenant_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("tenants.id"), default=None)

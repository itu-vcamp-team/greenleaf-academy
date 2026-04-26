import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from src.datalayer.database import get_db_session
from src.datalayer.repository.contact_info_repository import ContactInfoRepository
from src.services.contact_info_service import ContactInfoService
from src.datalayer.model.db.contact_info import ContactType
from src.utils.auth_deps import get_current_admin
from src.datalayer.model.db.user import User

router = APIRouter(prefix="/contact-info", tags=["Contact Info"])


# ── Pydantic Schemas ──────────────────────────────────────────────────────────

class ContactInfoCreate(BaseModel):
    owner_name: str
    type: ContactType
    value: str
    label: Optional[str] = None
    order: int = 0


class ContactInfoUpdate(BaseModel):
    owner_name: Optional[str] = None
    type: Optional[ContactType] = None
    value: Optional[str] = None
    label: Optional[str] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None


# ── Public Endpoint ───────────────────────────────────────────────────────────

@router.get("")
async def list_active_contacts(
    db: AsyncSession = Depends(get_db_session),
):
    """
    Public — returns all active contact info entries (visible in guest/partner navbar).
    Returns empty list when no active entries exist (hides navbar section client-side).
    """
    repo = ContactInfoRepository(db)
    service = ContactInfoService(repo)
    return await service.get_active()


# ── Admin Endpoints ───────────────────────────────────────────────────────────

@router.get("/admin", dependencies=[Depends(get_current_admin)])
async def list_all_contacts(
    db: AsyncSession = Depends(get_db_session),
):
    """Admin — returns all entries including inactive ones."""
    repo = ContactInfoRepository(db)
    service = ContactInfoService(repo)
    return await service.list_all()


@router.post("", dependencies=[Depends(get_current_admin)])
async def create_contact_info(
    payload: ContactInfoCreate,
    db: AsyncSession = Depends(get_db_session),
    current_admin: User = Depends(get_current_admin),
):
    repo = ContactInfoRepository(db)
    service = ContactInfoService(repo)
    return await service.create(
        owner_name=payload.owner_name,
        type=payload.type,
        value=payload.value,
        created_by=current_admin.id,
        label=payload.label,
        order=payload.order,
    )


@router.patch("/{entry_id}", dependencies=[Depends(get_current_admin)])
async def update_contact_info(
    entry_id: uuid.UUID,
    payload: ContactInfoUpdate,
    db: AsyncSession = Depends(get_db_session),
):
    repo = ContactInfoRepository(db)
    service = ContactInfoService(repo)
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    try:
        return await service.update(entry_id, **updates)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{entry_id}", dependencies=[Depends(get_current_admin)])
async def delete_contact_info(
    entry_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
):
    """Soft delete — sets is_active=False."""
    repo = ContactInfoRepository(db)
    service = ContactInfoService(repo)
    try:
        await service.soft_delete(entry_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"message": "İletişim bilgisi kaldırıldı."}

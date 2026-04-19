import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession

from src.datalayer.database import get_db_session
from src.datalayer.repository import AnnouncementRepository
from src.services.announcement_service import AnnouncementService
from src.utils.auth_deps import get_current_user, get_current_admin
from src.utils.tenant_deps import get_current_tenant_id
from src.datalayer.model.db.user import User

router = APIRouter(prefix="/announcements", tags=["Announcements"])

@router.get("/")
async def list_announcements(
    db: AsyncSession = Depends(get_db_session),
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    _=Depends(get_current_user),
):
    """Aktif ve sabitlenmiş duyuruları listeler."""
    repo = AnnouncementRepository(db, tenant_id)
    service = AnnouncementService(repo)
    return await service.get_active_announcements()

@router.get("/admin", dependencies=[Depends(get_current_admin)])
async def list_all_announcements(
    db: AsyncSession = Depends(get_db_session),
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
):
    """Admin görünümü: Tüm duyuruları listeler."""
    repo = AnnouncementRepository(db, tenant_id)
    service = AnnouncementService(repo)
    return await service.list_all()

@router.post("/", dependencies=[Depends(get_current_admin)])
async def create_announcement(
    title: str = Body(...),
    body: str = Body(...),
    pinned: bool = Body(False),
    db: AsyncSession = Depends(get_db_session),
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    current_admin: User = Depends(get_current_admin),
):
    repo = AnnouncementRepository(db, tenant_id)
    service = AnnouncementService(repo)
    return await service.create_announcement(title, body, current_admin.id, pinned)

@router.patch("/{ann_id}", dependencies=[Depends(get_current_admin)])
async def update_announcement(
    ann_id: uuid.UUID,
    updates: dict = Body(...),
    db: AsyncSession = Depends(get_db_session),
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
):
    repo = AnnouncementRepository(db, tenant_id)
    service = AnnouncementService(repo)
    try:
        return await service.update_announcement(ann_id, **updates)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{ann_id}", dependencies=[Depends(get_current_admin)])
async def delete_announcement(
    ann_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
):
    """Soft delete: is_active=False"""
    repo = AnnouncementRepository(db, tenant_id)
    service = AnnouncementService(repo)
    await service.soft_delete(ann_id)
    return {"message": "Duyuru kaldırıldı."}

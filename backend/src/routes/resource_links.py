import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Body, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.datalayer.database import get_db_session
from src.datalayer.repository import ResourceLinkRepository
from src.services.resource_link_service import ResourceLinkService
from src.utils.auth_deps import get_current_partner, get_current_admin
from src.datalayer.model.db.user import User

router = APIRouter(prefix="/resource-links", tags=["Resource Links"])

@router.get("/")
async def list_resources(
    category: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db_session),
    _=Depends(get_current_partner),
):
    """Partner ve üstü rol için kaynak merkezi linklerini döner."""
    repo = ResourceLinkRepository(db)
    service = ResourceLinkService(repo)
    return await service.get_resources(category)

@router.get("/admin", dependencies=[Depends(get_current_admin)])
async def list_all_resources(
    db: AsyncSession = Depends(get_db_session),
):
    """Admin görünümü: Tüm kaynakları listeler."""
    repo = ResourceLinkRepository(db)
    service = ResourceLinkService(repo)
    return await service.list_all()

@router.post("/", dependencies=[Depends(get_current_admin)])
async def create_resource(
    title: str = Body(...),
    url: str = Body(...),
    description: Optional[str] = Body(None),
    category: Optional[str] = Body(None),
    order: int = Body(0),
    db: AsyncSession = Depends(get_db_session),
    current_admin: User = Depends(get_current_admin),
):
    repo = ResourceLinkRepository(db)
    service = ResourceLinkService(repo)
    return await service.create_resource(title, url, current_admin.id, description, category, order)

@router.patch("/{res_id}", dependencies=[Depends(get_current_admin)])
async def update_resource(
    res_id: uuid.UUID,
    updates: dict = Body(...),
    db: AsyncSession = Depends(get_db_session),
):
    repo = ResourceLinkRepository(db)
    service = ResourceLinkService(repo)
    try:
        return await service.update_resource(res_id, **updates)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{res_id}", dependencies=[Depends(get_current_admin)])
async def delete_resource(
    res_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
):
    """Soft delete: is_active=False"""
    repo = ResourceLinkRepository(db)
    service = ResourceLinkService(repo)
    await service.soft_delete(res_id)
    return {"message": "Kaynak kaldırıldı."}

import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession

from src.datalayer.database import get_db_session
from src.datalayer.repository import WaitlistRepository
from src.services.waitlist_service import WaitlistService
from src.utils.auth_deps import get_current_admin
from src.datalayer.model.db.user import User

router = APIRouter(prefix="/waitlist", tags=["Waitlist"])

@router.post("/apply")
async def apply_to_waitlist(
    full_name: str = Body(...),
    email: str = Body(...),
    phone: Optional[str] = Body(None),
    supervisor_name: Optional[str] = Body(None),
    message: Optional[str] = Body(None),
    db: AsyncSession = Depends(get_db_session),
):
    """Kamuya açık waitlist başvuru ucu."""
    repo = WaitlistRepository(db)
    service = WaitlistService(repo)
    entry = await service.apply(full_name, email, phone, supervisor_name, message)
    return {"message": "Başvurunuz alındı.", "id": str(entry.id)}

@router.get("/admin", dependencies=[Depends(get_current_admin)])
async def get_waitlist(
    db: AsyncSession = Depends(get_db_session),
):
    """Admin view: Bekleyen başvuruları listeler."""
    repo = WaitlistRepository(db)
    service = WaitlistService(repo)
    return await service.list_pending()

@router.post("/{wait_id}/process", dependencies=[Depends(get_current_admin)])
async def mark_as_processed(
    wait_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    current_admin: User = Depends(get_current_admin),
):
    """Başvuruyu 'işlendi' olarak işaretler."""
    repo = WaitlistRepository(db)
    service = WaitlistService(repo)
    try:
        await service.mark_as_processed(wait_id, current_admin.id)
        return {"message": "Başvuru işlendi olarak işaretlendi."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

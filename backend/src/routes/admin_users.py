import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.datalayer.database import get_db_session
from src.datalayer.repository import UserRepository, ProgressRepository
from src.services.admin_user_service import AdminUserService
from src.services.progress_service import ProgressService
from src.utils.auth_deps import get_current_admin, get_current_partner
from src.datalayer.model.db.user import User, UserRole
from src.datalayer.model.db.academy_content import ContentType

router = APIRouter(prefix="/admin/users", tags=["Admin - Users"])

@router.get("/pending", dependencies=[Depends(get_current_admin)])
async def get_pending_users(
    db: AsyncSession = Depends(get_db_session),
):
    """Admin onayı bekleyen kullanıcıları listeler."""
    repo = UserRepository(db)
    service = AdminUserService(repo)
    return await service.get_pending_approvals()

@router.post("/{user_id}/approve", dependencies=[Depends(get_current_admin)])
async def approve_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
):
    """Kullanıcıyı partner olarak onaylar."""
    repo = UserRepository(db)
    service = AdminUserService(repo)
    try:
        user = await service.approve_partner(user_id)
        return {"message": f"{user.full_name} onaylandı.", "partner_id": user.partner_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{user_id}/reject", dependencies=[Depends(get_current_admin)])
async def reject_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
):
    """Kullanıcı başvurusu reddeder."""
    repo = UserRepository(db)
    service = AdminUserService(repo)
    try:
        await service.reject_user(user_id)
        return {"message": "Kullanıcı reddedildi."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/all", dependencies=[Depends(get_current_admin)])
async def list_all_users(
    db: AsyncSession = Depends(get_db_session),
    role: Optional[UserRole] = Query(None),
    is_active: Optional[bool] = Query(None),
):
    """Admin görünümü: Tüm kullanıcıları listele."""
    repo = UserRepository(db)
    service = AdminUserService(repo)
    return await service.list_users(role, is_active)

@router.post("/{user_id}/toggle-active", dependencies=[Depends(get_current_admin)])
async def toggle_user_active(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
):
    """Kullanıcıyı aktif/pasif yapar."""
    repo = UserRepository(db)
    service = AdminUserService(repo)
    try:
        user = await service.toggle_user_active(user_id)
        return {"is_active": user.is_active}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Partner Dashboard: My Children
@router.get("/my-children")
async def get_my_children(
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_partner),
):
    """Partner'ın davet ettiği kişilerin listesi ve temel ilerlemeleri."""
    user_repo = UserRepository(db)
    children = await user_repo.get_children(current_user.id)

    results = []
    for child in children:
        progress_repo = ProgressRepository(db, child.id)
        progress_service = ProgressService(progress_repo)

        shorts_stats = await progress_service.get_stats(ContentType.SHORT)
        masterclass_stats = await progress_service.get_stats(ContentType.MASTERCLASS)

        results.append({
            "id": str(child.id),
            "username": child.username,
            "full_name": child.full_name,
            "email": child.email,
            "is_active": child.is_active,
            "partner_id": child.partner_id,
            "joined_at": child.created_at.isoformat() if child.created_at else None,
            "progress": {
                "shorts": shorts_stats,
                "masterclass": masterclass_stats,
            }
        })

    return results

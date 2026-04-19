import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.datalayer.database import get_db_session
from src.datalayer.repository import UserRepository, TenantRepository, ProgressRepository
from src.services.admin_user_service import AdminUserService
from src.services.progress_service import ProgressService
from src.utils.auth_deps import get_current_admin, get_current_partner
from src.utils.tenant_deps import get_current_tenant_id
from src.datalayer.model.db.user import User, UserRole

router = APIRouter(prefix="/admin/users", tags=["Admin - Users"])

@router.get("/pending", dependencies=[Depends(get_current_admin)])
async def get_pending_users(
    db: AsyncSession = Depends(get_db_session),
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
):
    """Admin onayı bekleyen kullanıcıları listeler."""
    repo = UserRepository(db)
    tenant_repo = TenantRepository(db)
    service = AdminUserService(repo, tenant_repo)
    return await service.get_pending_approvals(tenant_id)

@router.post("/{user_id}/approve", dependencies=[Depends(get_current_admin)])
async def approve_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
):
    """Kullanıcıyı partner olarak onaylar."""
    repo = UserRepository(db)
    tenant_repo = TenantRepository(db)
    service = AdminUserService(repo, tenant_repo)
    try:
        user = await service.approve_partner(user_id, tenant_id)
        return {"message": f"{user.full_name} onaylandı.", "partner_id": user.partner_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{user_id}/reject", dependencies=[Depends(get_current_admin)])
async def reject_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
):
    """Kullanıcı başvurusu reddeder."""
    repo = UserRepository(db)
    tenant_repo = TenantRepository(db)
    service = AdminUserService(repo, tenant_repo)
    await service.reject_user(user_id, tenant_id)
    return {"message": "Kullanıcı reddedildi."}

@router.get("/all", dependencies=[Depends(get_current_admin)])
async def list_all_users(
    db: AsyncSession = Depends(get_db_session),
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    role: Optional[UserRole] = Query(None),
    is_active: Optional[bool] = Query(None),
):
    """Admin görünümü: Tüm kullanıcıları listele."""
    repo = UserRepository(db)
    tenant_repo = TenantRepository(db)
    service = AdminUserService(repo, tenant_repo)
    return await service.list_users(tenant_id, role, is_active)

@router.post("/{user_id}/toggle-active", dependencies=[Depends(get_current_admin)])
async def toggle_user_active(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
):
    """Kullanıcıyı aktif/pasif yapar."""
    repo = UserRepository(db)
    tenant_repo = TenantRepository(db)
    service = AdminUserService(repo, tenant_repo)
    user = await service.toggle_user_active(user_id, tenant_id)
    return {"is_active": user.is_active}

# Partner Dashboard: My Children
@router.get("/my-children")
async def get_my_children(
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_partner),
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
):
    """Partner'ın davet ettiği kişilerin listesi ve temel ilerlemeleri."""
    user_repo = UserRepository(db)
    children = await user_repo.get_children(current_user.id)
    
    results = []
    for child in children:
        # Get stats for each child
        progress_repo = ProgressRepository(db, child.id)
        progress_service = ProgressService(progress_repo)
        
        # Note: We use 0 as default if no progress found yet
        shorts_stats = await progress_service.get_stats(tenant_id, "SHORT")
        masterclass_stats = await progress_service.get_stats(tenant_id, "MASTERCLASS")
        
        results.append({
            "id": str(child.id),
            "full_name": child.full_name,
            "partner_id": child.partner_id,
            "role": child.role,
            "shorts_percentage": shorts_stats["percentage"],
            "masterclass_percentage": masterclass_stats["percentage"],
            "is_active": child.is_active
        })
    
    return results

# Partner Dashboard: Drill down into child progress
@router.get("/child/{child_id}/progress")
async def get_child_progress_detail(
    child_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_partner),
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
):
    """Adayın ders bazlı detaylı ilerlemesini döner."""
    user_repo = UserRepository(db)
    child = await user_repo.get_by_id(child_id)
    
    # Security check: Only inviter or admin can see detail
    if not child or (child.inviter_id != current_user.id and current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]):
        raise HTTPException(status_code=403, detail="Erişim reddedildi.")
        
    progress_repo = ProgressRepository(db, child.id)
    progress_service = ProgressService(progress_repo)
    
    return await progress_service.get_detailed_stats(tenant_id)

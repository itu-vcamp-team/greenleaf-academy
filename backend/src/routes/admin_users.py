import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from src.datalayer.database import get_db_session
from src.datalayer.repository import UserRepository, ProgressRepository
from src.services.admin_user_service import AdminUserService
from src.services.mailing_service import MailingService
from src.services.progress_service import ProgressService
from src.utils.auth_deps import get_current_admin, get_current_partner
from src.datalayer.model.db.user import User, UserRole
from src.datalayer.model.db.academy_content import ContentType

from src.datalayer.model.dto.auth_dto import AdminCreateUserSchema

router = APIRouter(prefix="/admin/users", tags=["Admin - Users"])

@router.post("/create", dependencies=[Depends(get_current_admin)])
async def create_user(
    data: AdminCreateUserSchema,
    db: AsyncSession = Depends(get_db_session),
):
    """Admin tarafından manuel kullanıcı oluşturur."""
    repo = UserRepository(db)
    service = AdminUserService(repo)
    try:
        user = await service.create_user(data)
        return {"message": f"{user.full_name} oluşturuldu.", "id": user.id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/pending", dependencies=[Depends(get_current_admin)])
async def get_pending_users(
    db: AsyncSession = Depends(get_db_session),
    search: Optional[str] = Query(None),
    sort_by: str = Query("created_at"),
    sort_dir: str = Query("desc"),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100)
):
    """Admin onayı bekleyen kullanıcıları listeler."""
    repo = UserRepository(db)
    service = AdminUserService(repo)
    return await service.get_pending_approvals(
        search=search, sort_by=sort_by, sort_dir=sort_dir, page=page, size=size
    )

@router.post("/{user_id}/approve", dependencies=[Depends(get_current_admin)])
async def approve_user(
    user_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db_session),
):
    """Kullanıcıyı partner olarak onaylar ve hoş geldin e-postası gönderir."""
    repo = UserRepository(db)
    service = AdminUserService(repo)
    try:
        user = await service.approve_partner(user_id)
        # Task 3: Send welcome email in background
        background_tasks.add_task(
            MailingService.send_welcome_email,
            to_email=user.email,
            full_name=user.full_name,
            partner_id=user.partner_id or "",
        )
        return {"message": f"{user.full_name} onaylandı.", "partner_id": user.partner_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{user_id}/reject", dependencies=[Depends(get_current_admin)])
async def reject_user(
    user_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db_session),
):
    """Kullanıcı başvurusunu reddeder ve bildirim e-postası gönderir."""
    repo = UserRepository(db)
    # Fetch user BEFORE rejecting so we have name/email for the notification
    user = await repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")
    user_email = user.email
    user_name = user.full_name

    service = AdminUserService(repo)
    try:
        await service.reject_user(user_id)
        # Task 3: Send rejection notification in background
        background_tasks.add_task(
            MailingService.send_account_status_email,
            to_email=user_email,
            full_name=user_name,
            is_approved=False,
        )
        return {"message": "Kullanıcı reddedildi."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/all", dependencies=[Depends(get_current_admin)])
async def list_all_users(
    db: AsyncSession = Depends(get_db_session),
    search: Optional[str] = Query(None),
    role: Optional[UserRole] = Query(None),
    is_active: Optional[bool] = Query(None),
    sort_by: str = Query("created_at"),
    sort_dir: str = Query("desc"),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100)
):
    """Admin görünümü: Tüm kullanıcıları listele."""
    repo = UserRepository(db)
    service = AdminUserService(repo)
    return await service.list_users(
        search=search, role=role, is_active=is_active,
        sort_by=sort_by, sort_dir=sort_dir, page=page, size=size
    )

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
    """Partner'ın davet ettiği kişilerin listesi ve detaylı ilerlemeleri."""
    user_repo = UserRepository(db)
    # This now gets all users with inviter_id = current_user.id
    children = await user_repo.get_children(current_user.id)

    results = []
    for child in children:
        progress_repo = ProgressRepository(db, child.id)
        progress_service = ProgressService(progress_repo)

        # Get detailed stats
        shorts_stats = await progress_service.get_stats(ContentType.SHORT)
        masterclass_stats = await progress_service.get_stats(ContentType.MASTERCLASS)
        rank_data = await progress_service.get_rank()

        results.append({
            "id": str(child.id),
            "username": child.username,
            "full_name": child.full_name,
            "email": child.email,
            "phone": child.phone,
            "is_active": child.is_active,
            "is_verified": child.is_verified,
            "partner_id": child.partner_id,
            "joined_at": child.created_at.isoformat() if child.created_at else None,
            "status": "ACTIVE" if child.is_active else "PENDING_APPROVAL",
            "profile_image_path": child.profile_image_path,
            "shorts_percentage": shorts_stats["percentage"],
            "masterclass_percentage": masterclass_stats["percentage"],
            "progress": {
                "shorts": shorts_stats,
                "masterclass": masterclass_stats,
            },
            # Rank / points info
            "rank": rank_data["rank"],
            "rank_label": rank_data["rank_label"],
            "rank_emoji": rank_data["rank_emoji"],
            "rank_color": rank_data["rank_color"],
            "earned_points": rank_data["earned_points"],
            "max_points": rank_data["max_points"],
            "rank_percentage": rank_data["rank_percentage"],
        })

    return results


@router.get("/child/{user_id}/progress", dependencies=[Depends(get_current_partner)])
async def get_child_progress_detail(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    current_partner: User = Depends(get_current_partner)
):
    """Partner'ın kendi adayı olan birinin detaylı izleme geçmişini getirir."""
    user_repo = UserRepository(db)
    child = await user_repo.get_by_id(user_id)
    
    if not child or child.inviter_id != current_partner.id:
        raise HTTPException(status_code=403, detail="Bu adayın bilgilerine erişim yetkiniz yok.")

    progress_repo = ProgressRepository(db, user_id)
    progress_service = ProgressService(progress_repo)
    
    return await progress_service.get_detailed_history()

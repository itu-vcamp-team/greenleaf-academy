from __future__ import annotations
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from src.datalayer.database import get_db_session
from src.datalayer.model.db.user import User
from src.datalayer.model.db.academy_content import ContentType
from src.datalayer.model.dto.progress_dto import WatchProgressSchema
from src.datalayer.repository.progress_repository import ProgressRepository
from src.services.progress_service import ProgressService
from src.utils.auth_deps import get_current_partner, get_optional_user

router = APIRouter(prefix="/progress", tags=["Progress"])

@router.post("/watch")
async def update_watch_progress(
    data: WatchProgressSchema,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_partner),
):
    """
    Updates watch percentage and last position.
    Automatically marks as completed if >= 85%.
    """
    repo = ProgressRepository(db, current_user.id)
    service = ProgressService(repo)

    progress = await service.update_watch_progress(
        content_id=data.content_id,
        percentage=data.completion_percentage,
        last_position=data.last_position_seconds
    )

    return {
        "status": progress.status,
        "percentage": progress.completion_percentage,
        "completed_at": progress.completed_at
    }

@router.get("/my-stats")
async def get_my_stats(
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_optional_user),
):
    """Returns overall completion stats for the current user."""
    from src.datalayer.model.db.user import UserRole
    if current_user.role == UserRole.GUEST:
        return {
            "shorts": {"completed": 0, "total": 0, "percentage": 0},
            "masterclass": {"completed": 0, "total": 0, "percentage": 0}
        }

    repo = ProgressRepository(db, current_user.id)
    service = ProgressService(repo)

    shorts_stats = await service.get_stats(ContentType.SHORT)
    masterclass_stats = await service.get_stats(ContentType.MASTERCLASS)

    return {
        "shorts": shorts_stats,
        "masterclass": masterclass_stats
    }

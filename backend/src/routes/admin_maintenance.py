from fastapi import APIRouter, Depends, BackgroundTasks
from src.datalayer.database import get_db_session
from sqlalchemy.ext.asyncio import AsyncSession
from src.utils.auth_deps import require_roles
from src.datalayer.model.db.user import UserRole
from src.utils.cleanup_jobs import CleanupService
from src.logger import logger

router = APIRouter(prefix="/admin/maintenance", tags=["Maintenance"])


@router.post("/cleanup")
async def run_cleanup(
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db_session),
    _=Depends(require_roles([UserRole.ADMIN])),
):
    """
    Manually triggers account and session cleanup.
    Restricted to ADMIN only.
    """
    background_tasks.add_task(_do_cleanup, db)
    return {"message": "Bakım ve temizlik işlemleri arka planda başlatıldı."}


async def _do_cleanup(db: AsyncSession):
    """Execution logic for background cleanup."""
    try:
        deleted_guests = await CleanupService.cleanup_inactive_guest_accounts(db)
        deleted_sessions = await CleanupService.cleanup_expired_sessions(db)
        await db.commit()
        logger.info(f"Manual cleanup finished: {deleted_guests} guests, {deleted_sessions} sessions removed.")
    except Exception as e:
        logger.error(f"Cleanup failed during manual execution: {e}")
        await db.rollback()

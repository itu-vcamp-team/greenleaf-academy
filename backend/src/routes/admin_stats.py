from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.datalayer.database import get_db_session
from src.services.admin_stats_service import AdminStatsService
from src.utils.auth_deps import get_current_admin

router = APIRouter(prefix="/admin/stats", tags=["Admin - Stats"])

@router.get("/", dependencies=[Depends(get_current_admin)])
async def get_dashboard_metrics(
    db: AsyncSession = Depends(get_db_session),
):
    """Admin dashboard metriklerini döner (Toplam partner, bekleyen onaylar vb.)."""
    service = AdminStatsService(db)
    return await service.get_dashboard_stats()

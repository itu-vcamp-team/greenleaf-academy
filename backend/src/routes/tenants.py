from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.datalayer.database import get_db_session
from src.datalayer.model.db.tenant import Tenant
from typing import List

router = APIRouter(prefix="/tenants", tags=["Tenants"])

@router.get("")
async def list_tenants(db: AsyncSession = Depends(get_db_session)):
    """
    Lists all active tenants with their configuration.
    Publicly available for frontend initialization.
    """
    stmt = select(Tenant).where(Tenant.is_active == True)
    res = await db.execute(stmt)
    tenants = res.scalars().all()
    
    return [
        {
            "id": str(t.id),
            "slug": t.slug,
            "name": t.name,
            "logo": t.config.get("flag", "🌐"), # Use flag from config or default
            "config": t.config
        }
        for t in tenants
    ]

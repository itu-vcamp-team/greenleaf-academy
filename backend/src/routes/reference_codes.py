import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.datalayer.database import get_db_session
from src.datalayer.repository import ReferenceCodeRepository, TenantRepository
from src.services.reference_code_service import ReferenceCodeService
from src.utils.auth_deps import get_current_partner
from src.utils.tenant_deps import get_current_tenant_id
from src.datalayer.model.db.user import User

router = APIRouter(prefix="/reference-codes", tags=["Reference Codes"])

@router.post("/generate")
async def generate_reference_code(
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_partner),
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
):
    """Partner tek seferlik bir referans kodu oluşturur."""
    repo = ReferenceCodeRepository(db, tenant_id)
    tenant_repo = TenantRepository(db)
    service = ReferenceCodeService(repo, tenant_repo)
    
    try:
        new_code = await service.generate_code(current_user.id)
        return {"code": new_code.code}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/my-codes")
async def get_my_reference_codes(
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_partner),
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
):
    """Partnerin oluşturduğu kodların listesi."""
    repo = ReferenceCodeRepository(db, tenant_id)
    tenant_repo = TenantRepository(db)
    service = ReferenceCodeService(repo, tenant_repo)
    
    return await service.get_my_codes(current_user.id)

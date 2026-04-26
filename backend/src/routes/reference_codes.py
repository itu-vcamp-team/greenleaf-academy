import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.datalayer.database import get_db_session
from src.datalayer.repository import ReferenceCodeRepository
from src.services.reference_code_service import ReferenceCodeService
from src.utils.auth_deps import get_current_partner
from src.datalayer.model.db.user import User

router = APIRouter(prefix="/reference-codes", tags=["Reference Codes"])

@router.post("/generate")
async def generate_reference_code(
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_partner),
):
    """Partner tek seferlik bir referans kodu oluşturur."""
    repo = ReferenceCodeRepository(db)
    service = ReferenceCodeService(repo)

    try:
        new_code = await service.generate_code(current_user.id)
        return {"code": new_code.code}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/my-codes")
async def get_my_reference_codes(
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_partner),
):
    """Partnerin oluşturduğu kodların listesi."""
    repo = ReferenceCodeRepository(db)
    service = ReferenceCodeService(repo)

    return await service.get_my_codes(current_user.id)

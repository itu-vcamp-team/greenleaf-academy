import uuid
from typing import List, Optional, Union
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.datalayer.database import get_db_session
from src.datalayer.model.db.user import UserRole
from src.datalayer.model.db.academy_content import ContentType
from src.datalayer.model.dto.academy_schemas import (
    ContentCreate, 
    ContentUpdate, 
    ContentResponse, 
    GuestContentResponse,
    UserProgressSchema
)
from src.datalayer.repository.academy_repository import AcademyRepository
from src.services.academy_service import AcademyService
from src.utils.auth_deps import get_current_user, get_current_admin, get_optional_user
from src.utils.tenant_deps import get_current_tenant_id
from src.exceptions import PrerequisiteNotMetError, NotFoundError

router = APIRouter(prefix="/academy", tags=["Academy"])


@router.get("/contents", response_model=list[ContentResponse | GuestContentResponse])
async def list_contents(
    type: ContentType,
    locale: str = "tr",
    db: AsyncSession = Depends(get_db_session),
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    current_user=Depends(get_optional_user),
):
    """
    Lists academy contents based on user role and prerequisite logic.
    - GUEST: Returns metadata but hides video URLs and resources.
    - PARTNER: Returns full content with 'is_locked' and 'progress' data.
    """
    repo = AcademyRepository(db, tenant_id)
    
    if current_user.role == UserRole.GUEST:
        contents = await repo.get_contents_by_type(type, locale)
        return [GuestContentResponse.model_validate(c) for c in contents]
    
    # Partner+ Logic
    data_items = await repo.get_with_progress(current_user.id, type, locale)
    
    responses = []
    for item in data_items:
        content = item["content"]
        is_locked = item["is_locked"]
        progress = item["progress"]
        
        resp = ContentResponse.model_validate(content)
        resp.is_locked = is_locked
        resp.progress = UserProgressSchema.model_validate(progress) if progress else None
        
        # Security: Hide video/resource URL if locked
        if is_locked:
            resp.video_url = None
            resp.resource_link = None
            
        responses.append(resp)
        
    return responses


@router.get("/contents/search", response_model=list[ContentResponse | GuestContentResponse])
async def search_contents(
    q: str = Query(..., min_length=2),
    type: Optional[ContentType] = None,
    locale: str = "tr",
    db: AsyncSession = Depends(get_db_session),
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    current_user=Depends(get_optional_user),
):
    """
    Full-text search (ILIKE) on academy contents.
    Restrictions apply based on user role.
    """
    repo = AcademyRepository(db, tenant_id)
    results = await repo.search_contents(q, locale, type)
    
    if current_user.role == UserRole.GUEST:
        return [GuestContentResponse.model_validate(r) for r in results]
    
    # For partners in search, we'll return full metadata but with is_locked=True 
    # to avoid heavy per-item prerequisite calculation in search (UX preference).
    # Real lock check happens in detail view.
    responses = []
    for r in results:
        resp = ContentResponse.model_validate(r)
        resp.is_locked = True # Safe default for search results
        responses.append(resp)
        
    return responses


@router.get("/contents/{content_id}", response_model=ContentResponse | GuestContentResponse)
async def get_content(
    content_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    current_user=Depends(get_optional_user),
):
    """
    Get detailed content. 
    Enforces prerequisite locking for non-guest users.
    """
    repo = AcademyRepository(db, tenant_id)
    content = await repo.get_by_id(content_id)
    
    if not content:
        raise NotFoundError("İçerik bulunamadı.")
        
    if current_user.role == UserRole.GUEST:
        return GuestContentResponse.model_validate(content)

    # Partner Lock Check
    # To determine lock for a single item, we check its specific prerequisite
    is_locked = False
    progress = None
    
    if content.prerequisite_id:
        from src.datalayer.model.db.user_progress import UserProgress
        from sqlalchemy import select
        
        # Check prerequisite progress
        stmt = select(UserProgress).where(
            UserProgress.user_id == current_user.id,
            UserProgress.content_id == content.prerequisite_id
        )
        res = await db.execute(stmt)
        prereq_prog = res.scalar_one_or_none()
        
        if not prereq_prog or prereq_prog.status != "completed":
            is_locked = True
            
    # Fetch current content progress
    from src.datalayer.model.db.user_progress import UserProgress
    from sqlalchemy import select
    stmt = select(UserProgress).where(
        UserProgress.user_id == current_user.id,
        UserProgress.content_id == content.id
    )
    res = await db.execute(stmt)
    progress = res.scalar_one_or_none()

    resp = ContentResponse.model_validate(content)
    resp.is_locked = is_locked
    resp.progress = UserProgressSchema.model_validate(progress) if progress else None
    
    if is_locked:
        resp.video_url = None
        resp.resource_link = None
        
    return resp


# --- ADMIN CRUD ---

@router.post("/contents", response_model=ContentResponse, dependencies=[Depends(get_current_admin)])
async def create_content(
    data: ContentCreate,
    db: AsyncSession = Depends(get_db_session),
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    service: AcademyService = Depends()
):
    """Create new academy content (Admin Only)."""
    content = await service.create_content(db, tenant_id, data.model_dump())
    return ContentResponse.model_validate(content, update={"is_locked": False, "is_new": True})


@router.patch("/contents/{content_id}", response_model=ContentResponse, dependencies=[Depends(get_current_admin)])
async def update_content(
    content_id: uuid.UUID,
    data: ContentUpdate,
    db: AsyncSession = Depends(get_db_session),
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    service: AcademyService = Depends()
):
    """Update existing content (Admin Only)."""
    content = await service.update_content(db, tenant_id, content_id, data.model_dump(exclude_unset=True))
    if not content:
        raise NotFoundError()
    return ContentResponse.model_validate(content, update={"is_locked": False})


@router.delete("/contents/{content_id}", dependencies=[Depends(get_current_admin)])
async def delete_content(
    content_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    tenant_id: uuid.UUID = Depends(get_current_tenant_id)
):
    """Delete content (Admin Only)."""
    repo = AcademyRepository(db, tenant_id)
    deleted = await repo.delete(content_id)
    if not deleted:
        raise NotFoundError()
    await db.commit()
    return {"message": "İçerik başarıyla silindi."}


@router.post("/contents/reorder", dependencies=[Depends(get_current_admin)])
async def reorder_contents(
    ordered_ids: List[uuid.UUID],
    db: AsyncSession = Depends(get_db_session),
    tenant_id: uuid.UUID = Depends(get_current_tenant_id)
):
    """Update display order of contents (Admin Only)."""
    repo = AcademyRepository(db, tenant_id)
    await repo.reorder_contents(ordered_ids)
    await db.commit()
    return {"message": "Sıralama güncellendi."}

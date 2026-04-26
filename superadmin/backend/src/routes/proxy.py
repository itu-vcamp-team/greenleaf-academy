"""
Proxy routes — forwards requests to specific deployment APIs.
Superadmin can manage users and view stats on any registered deployment.
"""
import uuid
from typing import Any, Optional, Literal
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
import httpx

from src.database import get_db
from src.models import Deployment

router = APIRouter(prefix="/proxy", tags=["Deployment Proxy"])


async def get_deployment_or_404(deployment_id: uuid.UUID, db: AsyncSession) -> Deployment:
    result = await db.execute(
        select(Deployment).where(Deployment.id == deployment_id, Deployment.is_active == True)
    )
    deployment = result.scalar_one_or_none()
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found or inactive")
    return deployment


async def call_deployment_api(
    deployment: Deployment,
    method: str,
    path: str,
    json: Any = None
) -> dict:
    """Calls a deployment's API with the stored API key."""
    url = f"{deployment.api_base_url.rstrip('/')}/api{path}"
    headers = {
        "Authorization": f"Bearer {deployment.api_key}",
        "Content-Type": "application/json"
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.request(method, url, headers=headers, json=json)
        if response.status_code >= 400:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Deployment API error: {response.text}"
            )
        return response.json()


# ── Stats ─────────────────────────────────────────────────────────────────────

@router.get("/{deployment_id}/stats")
async def get_deployment_stats(
    deployment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """Fetch admin dashboard stats from a specific deployment."""
    deployment = await get_deployment_or_404(deployment_id, db)
    return await call_deployment_api(deployment, "GET", "/admin/stats/")


# ── User Management ───────────────────────────────────────────────────────────

@router.get("/{deployment_id}/users")
async def list_deployment_users(
    deployment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """List all users on a specific deployment."""
    deployment = await get_deployment_or_404(deployment_id, db)
    return await call_deployment_api(deployment, "GET", "/admin/users/all")


class CreateUserRequest(BaseModel):
    full_name: str
    username: str
    email: EmailStr
    phone: Optional[str] = None
    password: str
    role: Literal["ADMIN", "PARTNER"] = "PARTNER"


@router.post("/{deployment_id}/users")
async def create_user_on_deployment(
    deployment_id: uuid.UUID,
    data: CreateUserRequest,
    db: AsyncSession = Depends(get_db)
):
    """Create a new user (ADMIN or PARTNER) on a specific deployment."""
    deployment = await get_deployment_or_404(deployment_id, db)
    return await call_deployment_api(
        deployment, "POST", "/admin/users/create",
        json=data.model_dump()
    )

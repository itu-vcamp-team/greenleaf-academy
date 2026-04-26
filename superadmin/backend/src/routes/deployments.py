"""Deployment management routes — CRUD for registered Academy deployments."""
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from src.database import get_db
from src.models import Deployment

router = APIRouter(prefix="/deployments", tags=["Deployments"])


class DeploymentCreate(BaseModel):
    name: str
    country_code: str
    api_base_url: str
    api_key: str
    notes: Optional[str] = None


class DeploymentUpdate(BaseModel):
    name: Optional[str] = None
    api_base_url: Optional[str] = None
    api_key: Optional[str] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class DeploymentResponse(BaseModel):
    id: uuid.UUID
    name: str
    country_code: str
    api_base_url: str
    is_active: bool
    notes: Optional[str]

    class Config:
        from_attributes = True


@router.get("/", response_model=List[DeploymentResponse])
async def list_deployments(db: AsyncSession = Depends(get_db)):
    """List all registered deployments."""
    result = await db.execute(select(Deployment).order_by(Deployment.country_code))
    return result.scalars().all()


@router.post("/", response_model=DeploymentResponse, status_code=201)
async def create_deployment(data: DeploymentCreate, db: AsyncSession = Depends(get_db)):
    """Register a new deployment."""
    deployment = Deployment(**data.model_dump())
    db.add(deployment)
    await db.commit()
    await db.refresh(deployment)
    return deployment


@router.get("/{deployment_id}", response_model=DeploymentResponse)
async def get_deployment(deployment_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Deployment).where(Deployment.id == deployment_id))
    deployment = result.scalar_one_or_none()
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")
    return deployment


@router.patch("/{deployment_id}", response_model=DeploymentResponse)
async def update_deployment(
    deployment_id: uuid.UUID,
    data: DeploymentUpdate,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Deployment).where(Deployment.id == deployment_id))
    deployment = result.scalar_one_or_none()
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(deployment, key, value)

    await db.commit()
    await db.refresh(deployment)
    return deployment


@router.delete("/{deployment_id}", status_code=204)
async def delete_deployment(deployment_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Deployment).where(Deployment.id == deployment_id))
    deployment = result.scalar_one_or_none()
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")

    await db.delete(deployment)
    await db.commit()

"""Superadmin authentication routes."""
import uuid
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
import bcrypt
import jwt

from src.config import get_settings
from src.database import get_db
from src.models import SuperadminUser

router = APIRouter(prefix="/auth", tags=["Auth"])
settings = get_settings()


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


def create_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": user_id, "exp": expire, "type": "superadmin"},
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    stmt = select(SuperadminUser).where(
        SuperadminUser.username == data.username,
        SuperadminUser.is_active == True
    )
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not bcrypt.checkpw(data.password.encode(), user.password_hash.encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user.last_login_at = datetime.now(timezone.utc)
    await db.commit()

    return TokenResponse(access_token=create_token(str(user.id)))


@router.get("/me")
async def get_me(db: AsyncSession = Depends(get_db), token: str = Depends(lambda: None)):
    """Returns current superadmin profile. Protected by JWT."""
    return {"message": "Implement with auth dependency"}

from typing import Optional, List, Union
import uuid
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from src.datalayer.database import get_db_session
from src.datalayer.model.db.user import User, UserRole
from src.services.token_service import TokenService
from src.services.session_service import SessionService
from sqlalchemy import select

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)
oauth2_scheme_strict = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=True)


async def get_current_user(
    token: str = Depends(oauth2_scheme_strict),
    db: AsyncSession = Depends(get_db_session)
) -> User:
    """
    FastAPI dependency to get the current authenticated user.
    Validates JWT and checks if the session is still active in DB.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = TokenService.decode_token(token)
    if payload is None:
        raise credentials_exception
    
    user_id: str = payload.get("sub")
    jti: str = payload.get("jti")
    if user_id is None or jti is None:
        raise credentials_exception

    # Check if session is still active (Kick-out check)
    if not await SessionService.is_session_active(db, jti):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or kicked out",
        )

    stmt = select(User).where(User.id == uuid.UUID(user_id))
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception
    return user


async def get_optional_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db_session)
) -> User:
    """
    Returns the user if token is valid, otherwise returns a mock Guest user object.
    Does NOT throw 401 if token is missing or invalid.
    """
    if not token or token == "undefined" or token == "null":
        return User(
            id=uuid.uuid4(), 
            role=UserRole.GUEST, 
            username=f"guest_{uuid.uuid4().hex[:8]}", 
            email="guest@local",
            full_name="Guest User",
            password_hash="",
            tenant_id=uuid.uuid4() # Dummy
        )
    
    payload = TokenService.decode_token(token)
    if not payload:
        return User(id=uuid.uuid4(), role=UserRole.GUEST, username="Guest", email="guest@local", full_name="Guest User", password_hash="", tenant_id=uuid.uuid4())
    
    user_id: str = payload.get("sub")
    jti: str = payload.get("jti")
    
    if not user_id or not jti:
        return User(id=uuid.uuid4(), role=UserRole.GUEST, username="Guest", email="guest@local", full_name="Guest User", password_hash="", tenant_id=uuid.uuid4())
    
    if not await SessionService.is_session_active(db, jti):
        return User(id=uuid.uuid4(), role=UserRole.GUEST, username="Guest", email="guest@local", full_name="Guest User", password_hash="", tenant_id=uuid.uuid4())

    stmt = select(User).where(User.id == uuid.UUID(user_id))
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    return user or User(id=uuid.uuid4(), role=UserRole.GUEST, username="Guest")


def require_roles(allowed_roles: list[UserRole]):
    """
    Dependency to restrict access based on user roles.
    Example: Depends(require_roles([UserRole.SUPERADMIN, UserRole.ADMIN]))
    """
    async def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have enough permissions"
            )
        return current_user
    return role_checker


async def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    """Shortcut to require ADMIN or SUPERADMIN role."""
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu işlem için yönetici yetkisi gereklidir."
        )
    return current_user


async def get_current_superadmin(current_user: User = Depends(get_current_user)) -> User:
    """Shortcut to require ONLY SUPERADMIN role."""
    if current_user.role != UserRole.SUPERADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu işlem için üst düzey yönetici yetkisi gereklidir."
        )
    return current_user


async def get_current_partner(current_user: User = Depends(get_current_user)) -> User:
    """Shortcut to require PARTNER role or higher (not GUEST)."""
    if current_user.role == UserRole.GUEST:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="İçerik ilerlemesini kaydetmek için partner girişi yapmalısınız."
        )
    return current_user

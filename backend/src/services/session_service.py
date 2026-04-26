import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from src.datalayer.model.db.user_session import UserSession
from src.config import get_settings

settings = get_settings()


class SessionService:
    """
    Service for managing user sessions and implementing kick-out logic.
    """

    @staticmethod
    async def create_session(
        db: AsyncSession, 
        user_id: uuid.UUID, 
        ip_address: str = None, 
        device_info: str = None
    ) -> str:
        """
        Creates a new session for a user and deactivates all other active sessions (Kick-out).
        Returns the unique JTI (JWT ID) for the new session.
        """
        # 1. Kick-out: Deactivate all existing active sessions for this user
        stmt = (
            update(UserSession)
            .where(UserSession.user_id == user_id, UserSession.is_active == True)
            .values(is_active=False)
        )
        await db.execute(stmt)

        # 2. Create new session
        jti = str(uuid.uuid4())
        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        
        new_session = UserSession(
            user_id=user_id,
            token_jti=jti,
            ip_address=ip_address,
            device_info=device_info,
            is_active=True,
            expires_at=expires_at,
            last_used_at=datetime.now(timezone.utc)
        )
        db.add(new_session)
        return jti

    @staticmethod
    async def is_session_active(db: AsyncSession, jti: str) -> bool:
        """Checks if a session with the given JTI is still active in the database."""
        stmt = select(UserSession).where(UserSession.token_jti == jti, UserSession.is_active == True)
        result = await db.execute(stmt)
        return result.scalar_one_or_none() is not None

    @staticmethod
    async def deactivate_session(db: AsyncSession, jti: str):
        """Sets a session's is_active to False."""
        stmt = update(UserSession).where(UserSession.token_jti == jti).values(is_active=False)
        await db.execute(stmt)
    @staticmethod
    async def deactivate_all_user_sessions(db: AsyncSession, user_id: uuid.UUID):
        """Deactivates all active sessions for a specific user (Global Logout)."""
        stmt = update(UserSession).where(UserSession.user_id == user_id).values(is_active=False)
        await db.execute(stmt)

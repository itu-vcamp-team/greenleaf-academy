from datetime import datetime, timezone, timedelta
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from src.datalayer.model.db.user import User, UserRole
from src.datalayer.model.db.user_session import UserSession
from src.logger import logger


class CleanupService:
    """
    Service for periodic maintenance tasks like cleaning inactive accounts and sessions.
    """

    @staticmethod
    async def cleanup_inactive_guest_accounts(db: AsyncSession) -> int:
        """
        Deletes GUEST accounts that have been inactive for more than 1 year (GDPR/KVKK compliance).
        """
        one_year_ago = datetime.now(timezone.utc) - timedelta(days=365)

        # Find inactive guest accounts
        stmt = select(User).where(
            User.role == UserRole.GUEST,
            User.is_active == False,
            User.last_active_at < one_year_ago
        )
        result = await db.execute(stmt)
        users_to_delete = result.scalars().all()

        count = len(users_to_delete)
        for user in users_to_delete:
            await db.delete(user)

        if count > 0:
            logger.info(f"Maintenance: {count} inactive GUEST accounts permanently deleted.")
        
        return count

    @staticmethod
    async def cleanup_expired_sessions(db: AsyncSession) -> int:
        """
        Deletes expired UserSession records to keep the database lean.
        """
        now = datetime.now(timezone.utc)
        
        # This assumes UserSession has an expires_at field OR we check last_activity_at
        # Based on current schema (viewed before), let's assume session TTL is handled by is_active=False
        # or we delete based on last_activity_at + TTL.
        # Let's check the schema if possible, or use a safe threshold.
        threshold = now - timedelta(days=30)
        
        stmt = select(UserSession).where(
            UserSession.is_active == False,
            UserSession.last_activity_at < threshold
        )
        result = await db.execute(stmt)
        expired_sessions = result.scalars().all()
        
        count = len(expired_sessions)
        for session in expired_sessions:
            await db.delete(session)

        if count > 0:
            logger.info(f"Maintenance: {count} old inactive sessions removed.")
            
        return count

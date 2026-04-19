import uuid
from typing import Optional, List
from sqlalchemy import select
from src.datalayer.model.db.user import User, UserRole
from src.datalayer.repository._base_repository import AsyncBaseRepository


class UserRepository(AsyncBaseRepository[User]):
    def __init__(self, session):
        super().__init__(session, User)

    async def get_by_email(self, email: str) -> Optional[User]:
        stmt = select(self.model_class).where(self.model_class.email == email)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_username(self, username: str) -> Optional[User]:
        stmt = select(self.model_class).where(self.model_class.username == username)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_children(self, inviter_id: uuid.UUID) -> List[User]:
        """Get all users invited by a specific partner."""
        stmt = (
            select(self.model_class)
            .where(self.model_class.inviter_id == inviter_id)
            .order_by(self.model_class.created_at.desc())
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_pending_users(self, tenant_id: uuid.UUID) -> List[User]:
        """Get users who verified email but are not yet active (pending admin approval)."""
        stmt = (
            select(self.model_class)
            .where(
                self.model_class.tenant_id == tenant_id,
                self.model_class.is_verified == True,
                self.model_class.is_active == False,
                self.model_class.role == UserRole.GUEST
            )
            .order_by(self.model_class.created_at.asc())
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_tenant_users(
        self, 
        tenant_id: uuid.UUID, 
        role: Optional[UserRole] = None, 
        is_active: Optional[bool] = None,
        limit: int = 100
    ) -> List[User]:
        """Get users for a tenant with optional filtering."""
        stmt = select(self.model_class).where(self.model_class.tenant_id == tenant_id)
        
        if role:
            stmt = stmt.where(self.model_class.role == role)
        if is_active is not None:
            stmt = stmt.where(self.model_class.is_active == is_active)
            
        stmt = stmt.order_by(self.model_class.created_at.desc()).limit(limit)
        
        result = await self.session.execute(stmt)
        return result.scalars().all()

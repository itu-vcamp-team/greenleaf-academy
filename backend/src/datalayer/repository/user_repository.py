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

    async def get_pending_users(self) -> List[dict]:
        """Get inactive users with their inviter details for admin approval."""
        from sqlalchemy.orm import aliased
        Inviter = aliased(User)
        
        stmt = (
            select(User, Inviter.full_name.label("inviter_name"), Inviter.username.label("inviter_username"))
            .outerjoin(Inviter, User.inviter_id == Inviter.id)
            .where(
                User.is_active == False,
                User.is_verified == True
            )
            .order_by(User.created_at.desc())
        )
        
        result = await self.session.execute(stmt)
        rows = result.all()
        
        pending = []
        for row in rows:
            u = row[0]
            pending.append({
                "id": str(u.id),
                "username": u.username,
                "email": u.email,
                "full_name": u.full_name,
                "phone": u.phone,
                "created_at": u.created_at.isoformat() if u.created_at else None,
                "inviter_name": row.inviter_name,
                "inviter_username": row.inviter_username,
                "supervisor_note": u.supervisor_note
            })
        return pending

    async def get_users(
        self,
        role: Optional[UserRole] = None,
        is_active: Optional[bool] = None,
        limit: int = 100
    ) -> List[User]:
        """Get users with optional filtering."""
        stmt = select(self.model_class)

        if role:
            stmt = stmt.where(self.model_class.role == role)
        if is_active is not None:
            stmt = stmt.where(self.model_class.is_active == is_active)

        stmt = stmt.order_by(self.model_class.created_at.desc()).limit(limit)

        result = await self.session.execute(stmt)
        return result.scalars().all()

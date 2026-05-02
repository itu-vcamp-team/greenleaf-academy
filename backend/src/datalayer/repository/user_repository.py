import uuid
from typing import Optional, List, Tuple
from sqlalchemy import select, func, or_, desc
from sqlalchemy.orm import aliased
from src.datalayer.model.db.user import User, UserRole
from src.datalayer.model.db.event_calendar_rsvp import EventCalendarRsvp
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

    async def get_pending_users(
        self,
        search: Optional[str] = None,
        sort_by: str = "created_at",
        sort_dir: str = "desc",
        page: int = 1,
        size: int = 50
    ) -> Tuple[List[dict], int]:
        """Get inactive users (regardless of verification) for admin approval, with pagination."""
        Inviter = aliased(User)
        
        base_stmt = (
            select(User, Inviter.full_name.label("inviter_name"), Inviter.username.label("inviter_username"))
            .outerjoin(Inviter, User.inviter_id == Inviter.id)
            .where(
                User.is_active == False,
                User.is_verified == True,   # Only show verified users waiting for approval
                User.role.notin_([UserRole.ADMIN, UserRole.EDITOR])
            )
        )

        if search:
            search_term = f"%{search}%"
            base_stmt = base_stmt.where(
                or_(
                    User.full_name.ilike(search_term),
                    User.email.ilike(search_term),
                    User.username.ilike(search_term),
                    User.partner_id.ilike(search_term)
                )
            )
            
        # Count total
        count_stmt = select(func.count()).select_from(base_stmt.subquery())
        total_result = await self.session.execute(count_stmt)
        total = total_result.scalar() or 0
        
        # Sorting
        sort_col = getattr(User, sort_by, User.created_at)
        if sort_dir.lower() == "asc":
            base_stmt = base_stmt.order_by(sort_col.asc())
        else:
            base_stmt = base_stmt.order_by(sort_col.desc())
            
        # Pagination
        stmt = base_stmt.offset((page - 1) * size).limit(size)
        
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
                "role": u.role.value if u.role else "GUEST",
                "is_verified": u.is_verified,
                "created_at": u.created_at.isoformat() if u.created_at else None,
                "inviter_name": row.inviter_name,
                "inviter_username": row.inviter_username,
                "supervisor_note": u.supervisor_note,
                "partner_id": u.partner_id,
                "is_active": u.is_active
            })
        return pending, total

    async def get_users_paginated(
        self,
        search: Optional[str] = None,
        role: Optional[UserRole] = None,
        is_active: Optional[bool] = None,
        sort_by: str = "created_at",
        sort_dir: str = "desc",
        page: int = 1,
        size: int = 50
    ) -> Tuple[List[User], int]:
        """Get users with filtering, search, and pagination."""
        stmt = select(self.model_class)

        if role:
            stmt = stmt.where(self.model_class.role == role)
        if is_active is not None:
            stmt = stmt.where(self.model_class.is_active == is_active)

        if search:
            search_term = f"%{search}%"
            stmt = stmt.where(
                or_(
                    self.model_class.full_name.ilike(search_term),
                    self.model_class.email.ilike(search_term),
                    self.model_class.username.ilike(search_term),
                    self.model_class.partner_id.ilike(search_term)
                )
            )

        # Count total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.session.execute(count_stmt)
        total = total_result.scalar() or 0
        
        # Sorting
        sort_col = getattr(self.model_class, sort_by, self.model_class.created_at)
        if sort_dir.lower() == "asc":
            stmt = stmt.order_by(sort_col.asc())
        else:
            stmt = stmt.order_by(sort_col.desc())

        # Pagination
        stmt = stmt.offset((page - 1) * size).limit(size)

        result = await self.session.execute(stmt)
        items = result.scalars().all()
        return list(items), total

    async def get_event_guests_paginated(
        self,
        search: Optional[str] = None,
        sort_by: str = "created_at",
        sort_dir: str = "desc",
        page: int = 1,
        size: int = 50
    ) -> Tuple[List[dict], int]:
        """Get all unauthenticated event RSVP guests (is_member=False) with pagination."""
        stmt = (
            select(EventCalendarRsvp)
            .where(EventCalendarRsvp.is_member == False)
        )

        if search:
            search_term = f"%{search}%"
            stmt = stmt.where(
                or_(
                    EventCalendarRsvp.full_name.ilike(search_term),
                    EventCalendarRsvp.email.ilike(search_term),
                )
            )

        # Count total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.session.execute(count_stmt)
        total = total_result.scalar() or 0

        # Sorting
        sort_col = getattr(EventCalendarRsvp, sort_by, EventCalendarRsvp.created_at)
        if sort_dir.lower() == "asc":
            stmt = stmt.order_by(sort_col.asc())
        else:
            stmt = stmt.order_by(sort_col.desc())

        # Pagination
        stmt = stmt.offset((page - 1) * size).limit(size)

        result = await self.session.execute(stmt)
        rows = result.scalars().all()

        items = []
        for r in rows:
            items.append({
                "id": str(r.id),
                "event_id": str(r.event_id),
                "email": r.email,
                "full_name": r.full_name,
                "is_member": r.is_member,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            })
        return items, total

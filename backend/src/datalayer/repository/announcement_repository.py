from typing import List
from sqlalchemy import select
from src.datalayer.model.db.announcement import Announcement
from ._base_repository import AsyncBaseRepository


class AnnouncementRepository(AsyncBaseRepository[Announcement]):
    def __init__(self, session):
        super().__init__(session, Announcement)

    async def get_active_announcements(self, limit: int = 10) -> List[Announcement]:
        """Get active and pinned announcements first."""
        stmt = (
            select(self.model_class)
            .where(self.model_class.is_active == True)
            .order_by(self.model_class.pinned.desc(), self.model_class.created_at.desc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

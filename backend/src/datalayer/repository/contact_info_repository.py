from typing import List
from sqlalchemy import select
from src.datalayer.model.db.contact_info import ContactInfo
from ._base_repository import AsyncBaseRepository


class ContactInfoRepository(AsyncBaseRepository[ContactInfo]):
    def __init__(self, session):
        super().__init__(session, ContactInfo)

    async def get_active(self) -> List[ContactInfo]:
        """Return all active contact entries sorted by order then created_at."""
        stmt = (
            select(self.model_class)
            .where(self.model_class.is_active == True)
            .order_by(self.model_class.order.asc(), self.model_class.created_at.asc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_all_for_admin(self) -> List[ContactInfo]:
        """Return all contact entries (including inactive) for admin listing."""
        stmt = (
            select(self.model_class)
            .order_by(self.model_class.order.asc(), self.model_class.created_at.asc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

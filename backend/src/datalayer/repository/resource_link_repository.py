from typing import List, Optional
from sqlalchemy import select
from src.datalayer.model.db.resource_link import ResourceLink
from ._base_repository import AsyncBaseRepository


class ResourceLinkRepository(AsyncBaseRepository[ResourceLink]):
    def __init__(self, session):
        super().__init__(session, ResourceLink)

    async def get_active_resources(self, category: Optional[str] = None) -> List[ResourceLink]:
        """Get active resources, optionally filtered by category, ordered by 'order'."""
        stmt = (
            select(self.model_class)
            .where(self.model_class.is_active == True)
        )
        if category:
            stmt = stmt.where(self.model_class.category == category)

        stmt = stmt.order_by(self.model_class.order.asc(), self.model_class.title.asc())

        result = await self.session.execute(stmt)
        return result.scalars().all()

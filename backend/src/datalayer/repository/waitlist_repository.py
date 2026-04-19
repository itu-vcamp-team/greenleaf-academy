import uuid
from typing import List
from sqlalchemy import select
from src.datalayer.model.db.waitlist import Waitlist
from ._tenant_base_repository import AsyncTenantBaseRepository


class WaitlistRepository(AsyncTenantBaseRepository[Waitlist]):
    def __init__(self, session, tenant_id: uuid.UUID):
        super().__init__(session, Waitlist, tenant_id)

    async def get_pending_applications(self) -> List[Waitlist]:
        """Get waitlist applications that haven't been processed yet."""
        stmt = (
            select(self.model_class)
            .where(
                self.model_class.tenant_id == self.tenant_id,
                self.model_class.is_processed == False
            )
            .order_by(self.model_class.created_at.asc())
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_by_email(self, email: str) -> List[Waitlist]:
        """Check if an email is already in the waitlist for this tenant."""
        stmt = (
            select(self.model_class)
            .where(
                self.model_class.tenant_id == self.tenant_id,
                self.model_class.email == email
            )
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

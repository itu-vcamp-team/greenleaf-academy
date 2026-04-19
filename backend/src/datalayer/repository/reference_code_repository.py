import uuid
from typing import Optional
from sqlalchemy import select
from src.datalayer.model.db.reference_code import ReferenceCode
from ._tenant_base_repository import AsyncTenantBaseRepository


class ReferenceCodeRepository(AsyncTenantBaseRepository[ReferenceCode]):
    def __init__(self, session, tenant_id: uuid.UUID):
        super().__init__(session, ReferenceCode, tenant_id)

    async def get_by_code(self, code: str) -> Optional[ReferenceCode]:
        """Get a reference code by its unique string representation."""
        stmt = (
            select(self.model_class)
            .where(
                self.model_class.code == code,
                self.model_class.tenant_id == self.tenant_id
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_unused_by_code(self, code: str) -> Optional[ReferenceCode]:
        """Get a reference code only if it hasn't been used yet."""
        stmt = (
            select(self.model_class)
            .where(
                self.model_class.code == code,
                self.model_class.tenant_id == self.tenant_id,
                self.model_class.is_used == False
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

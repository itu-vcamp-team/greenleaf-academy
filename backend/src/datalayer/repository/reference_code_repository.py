import uuid
from typing import Optional
from sqlalchemy import select
from src.datalayer.model.db.reference_code import ReferenceCode
from ._base_repository import AsyncBaseRepository


class ReferenceCodeRepository(AsyncBaseRepository[ReferenceCode]):
    def __init__(self, session):
        super().__init__(session, ReferenceCode)

    async def get_by_code(self, code: str) -> Optional[ReferenceCode]:
        """Get a reference code by its unique string representation."""
        stmt = (
            select(self.model_class)
            .where(self.model_class.code == code)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_unused_by_code(self, code: str) -> Optional[ReferenceCode]:
        """Get a reference code only if it hasn't been used yet."""
        stmt = (
            select(self.model_class)
            .where(
                self.model_class.code == code,
                self.model_class.is_used == False
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

import uuid
from typing import TypeVar, List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from ._base_repository import AsyncBaseRepository, PrimaryKeyType

T = TypeVar('T')


class AsyncTenantBaseRepository(AsyncBaseRepository[T]):
    """
    Extends AsyncBaseRepository to automatically filter all queries by tenant_id.
    Ensures absolute data isolation between tenants.
    """
    
    def __init__(self, session: AsyncSession, model_class: type[T], tenant_id: uuid.UUID):
        super().__init__(session, model_class)
        self.tenant_id = tenant_id

    async def get_by_id(self, id: PrimaryKeyType) -> Optional[T]:
        """Get entity by primary key AND tenant_id"""
        stmt = (
            select(self.model_class)
            .where(
                self.model_class.id == id,
                self.model_class.tenant_id == self.tenant_id
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_all(self, limit: Optional[int] = None, offset: Optional[int] = None) -> List[T]:
        """Get all entities for the current tenant"""
        stmt = select(self.model_class).where(self.model_class.tenant_id == self.tenant_id)
        if offset:
            stmt = stmt.offset(offset)
        if limit:
            stmt = stmt.limit(limit)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def find_by(self, **filters) -> List[T]:
        """Find entities for the current tenant by filter criteria"""
        # Inject tenant_id into filters
        filters["tenant_id"] = self.tenant_id
        return await super().find_by(**filters)

    async def save(self, entity: T) -> T:
        """Ensure entity belongs to the current tenant before saving"""
        # For new records, automatically set tenant_id if it's missing or empty
        if hasattr(entity, "tenant_id") and (getattr(entity, "tenant_id") is None):
            setattr(entity, "tenant_id", self.tenant_id)
        elif hasattr(entity, "tenant_id") and getattr(entity, "tenant_id") != self.tenant_id:
            # Safety check: Prevent saving records to another tenant
            raise ValueError(f"Entity tenant_id {entity.tenant_id} does not match repository tenant_id {self.tenant_id}")
            
        return await super().save(entity)

    async def count(self, **filters) -> int:
        """Count entities for the current tenant"""
        filters["tenant_id"] = self.tenant_id
        return await super().count(**filters)

    async def exists(self, id: PrimaryKeyType) -> bool:
        """Check if entity exists for the current tenant"""
        stmt = (
            select(1)
            .where(
                self.model_class.id == id,
                self.model_class.tenant_id == self.tenant_id
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar() is not None

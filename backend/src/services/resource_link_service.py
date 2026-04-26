import uuid
from typing import List, Optional
from src.datalayer.model.db.resource_link import ResourceLink
from src.datalayer.repository.resource_link_repository import ResourceLinkRepository


class ResourceLinkService:
    def __init__(self, repo: ResourceLinkRepository):
        self.repo = repo

    async def get_resources(self, category: str = None) -> List[ResourceLink]:
        """Get active resources for partners."""
        return await self.repo.get_active_resources(category)

    async def list_all(self, limit: int = 100) -> List[ResourceLink]:
        """Admin view: includes inactive resources."""
        return await self.repo.get_all(limit=limit)

    async def create_resource(
        self, 
        title: str, 
        url: str, 
        created_by: uuid.UUID, 
        description: str = None, 
        category: str = None, 
        order: int = 0
    ) -> ResourceLink:
        resource = ResourceLink(
            title=title,
            url=url,
            created_by=created_by,
            description=description,
            category=category,
            order=order
        )
        return await self.repo.save(resource)

    async def update_resource(
        self, 
        resource_id: uuid.UUID, 
        **kwargs
    ) -> ResourceLink:
        resource = await self.repo.get_by_id(resource_id)
        if not resource:
            raise ValueError("Resource not found")
            
        for key, value in kwargs.items():
            if hasattr(resource, key):
                setattr(resource, key, value)
                
        return await self.repo.save(resource)

    async def soft_delete(self, resource_id: uuid.UUID) -> None:
        """Sets is_active to False."""
        await self.update_resource(resource_id, is_active=False)

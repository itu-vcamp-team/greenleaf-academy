import uuid
from typing import List, Optional
from src.datalayer.model.db.announcement import Announcement
from src.datalayer.repository.announcement_repository import AnnouncementRepository


class AnnouncementService:
    def __init__(self, repo: AnnouncementRepository):
        self.repo = repo

    async def get_active_announcements(self, limit: int = 10) -> List[Announcement]:
        return await self.repo.get_active_announcements(limit)

    async def list_all(self, limit: int = 50) -> List[Announcement]:
        """Admin view: includes inactive announcements."""
        return await self.repo.get_all(limit=limit)

    async def create_announcement(
        self, 
        title: str, 
        body: str, 
        created_by: uuid.UUID, 
        pinned: bool = False
    ) -> Announcement:
        announcement = Announcement(
            title=title,
            body=body,
            created_by=created_by,
            pinned=pinned
        )
        return await self.repo.save(announcement)

    async def update_announcement(
        self, 
        announcement_id: uuid.UUID, 
        **kwargs
    ) -> Announcement:
        announcement = await self.repo.get_by_id(announcement_id)
        if not announcement:
            raise ValueError("Announcement not found")
            
        for key, value in kwargs.items():
            if hasattr(announcement, key):
                setattr(announcement, key, value)
                
        return await self.repo.save(announcement)

    async def soft_delete(self, announcement_id: uuid.UUID) -> None:
        """Sets is_active to False instead of deleting from DB."""
        await self.update_announcement(announcement_id, is_active=False)

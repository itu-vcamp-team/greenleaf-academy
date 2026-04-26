import uuid
from typing import List, Optional
from src.datalayer.model.db.contact_info import ContactInfo, ContactType
from src.datalayer.repository.contact_info_repository import ContactInfoRepository


class ContactInfoService:
    def __init__(self, repo: ContactInfoRepository):
        self.repo = repo

    async def get_active(self) -> List[ContactInfo]:
        """Public: returns only active entries."""
        return await self.repo.get_active()

    async def list_all(self) -> List[ContactInfo]:
        """Admin: returns all entries including inactive."""
        return await self.repo.get_all_for_admin()

    async def create(
        self,
        owner_name: str,
        type: ContactType,
        value: str,
        created_by: uuid.UUID,
        label: Optional[str] = None,
        order: int = 0,
    ) -> ContactInfo:
        entry = ContactInfo(
            owner_name=owner_name,
            type=type,
            value=value,
            created_by=created_by,
            label=label,
            order=order,
        )
        return await self.repo.save(entry)

    async def update(self, entry_id: uuid.UUID, **kwargs) -> ContactInfo:
        entry = await self.repo.get_by_id(entry_id)
        if not entry:
            raise ValueError("İletişim kaydı bulunamadı.")
        for key, value in kwargs.items():
            if hasattr(entry, key):
                setattr(entry, key, value)
        return await self.repo.save(entry)

    async def soft_delete(self, entry_id: uuid.UUID) -> None:
        """Sets is_active=False instead of hard-deleting."""
        await self.update(entry_id, is_active=False)

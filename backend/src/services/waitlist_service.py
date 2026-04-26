import uuid
from typing import List, Optional
from src.datalayer.model.db.waitlist import Waitlist
from src.datalayer.repository.waitlist_repository import WaitlistRepository


class WaitlistService:
    def __init__(self, repo: WaitlistRepository):
        self.repo = repo

    async def apply(
        self, 
        full_name: str, 
        email: str, 
        phone: str = None, 
        supervisor_name: str = None, 
        message: str = None
    ) -> Waitlist:
        """Pubic endpoint logic for applying to waitlist."""
        # Optional: check if already in waitlist
        existing = await self.repo.get_by_email(email)
        if existing:
            # Maybe return existing or raise error? 
            # For now just return the first one to avoid duplicates in processing.
            return existing[0]
            
        entry = Waitlist(
            full_name=full_name,
            email=email,
            phone=phone,
            supervisor_name=supervisor_name,
            message=message
        )
        return await self.repo.save(entry)

    async def list_pending(self) -> List[Waitlist]:
        """Admin view: pending applications."""
        return await self.repo.get_pending_applications()

    async def list_all(self, limit: int = 100) -> List[Waitlist]:
        return await self.repo.get_all(limit=limit)

    async def mark_as_processed(self, waitlist_id: uuid.UUID, processed_by: uuid.UUID) -> Waitlist:
        """Sets is_processed to True."""
        entry = await self.repo.get_by_id(waitlist_id)
        if not entry:
            raise ValueError("Waitlist entry not found")
            
        entry.is_processed = True
        entry.processed_by = processed_by
        return await self.repo.save(entry)

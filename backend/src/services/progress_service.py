from __future__ import annotations
import uuid
from datetime import datetime, timezone
from typing import Optional
from src.datalayer.repository.progress_repository import ProgressRepository
from src.datalayer.model.db.user_progress import UserProgress

class ProgressService:
    """Service for handling academy progress business logic."""

    COMPLETION_THRESHOLD = 85.0

    def __init__(self, repo: ProgressRepository):
        self.repo = repo

    async def update_watch_progress(
        self, 
        content_id: uuid.UUID, 
        percentage: float, 
        last_position: float
    ) -> UserProgress:
        """
        Updates the watch progress and automatically marks as completed 
        if the 85% threshold is reached.
        """
        # Business Rule: If percentage >= threshold, status should be 'completed'
        status = "in_progress"
        completed_at = None
        
        if percentage >= self.COMPLETION_THRESHOLD:
            status = "completed"
            completed_at = datetime.now(timezone.utc)

        # Repositor handles backward-progress protection and persistence
        return await self.repo.upsert_progress(
            content_id=content_id,
            percentage=percentage,
            last_position=last_position,
            status=status,
            completed_at=completed_at
        )

    async def get_stats(self, tenant_id: uuid.UUID, content_type: Optional[str] = None) -> dict:
        """Retrieves statistics for the user dashboard."""
        return await self.repo.get_stats(tenant_id, content_type)

    async def get_detailed_stats(self, tenant_id: uuid.UUID) -> List[dict]:
        """Retrieves detailed per-content statistics for child drill-down."""
        return await self.repo.get_detailed_progress(tenant_id)

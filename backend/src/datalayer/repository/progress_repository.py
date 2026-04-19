from __future__ import annotations
import uuid
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from src.datalayer.model.db.user_progress import UserProgress
from src.datalayer.model.db.academy_content import AcademyContent, ContentStatus

class ProgressRepository:
    """Repository for managing user progress on academy contents."""

    def __init__(self, session: AsyncSession, user_id: uuid.UUID):
        self.session = session
        self.user_id = user_id

    async def get_progress(self, content_id: uuid.UUID) -> Optional[UserProgress]:
        """Fetch current progress record for a specific content."""
        stmt = select(UserProgress).where(
            UserProgress.user_id == self.user_id,
            UserProgress.content_id == content_id,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_all_progress(self, content_ids: List[uuid.UUID]) -> List[UserProgress]:
        """Fetch progress records for multiple contents (Bulk)."""
        if not content_ids:
            return []
        stmt = select(UserProgress).where(
            UserProgress.user_id == self.user_id,
            UserProgress.content_id.in_(content_ids),
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def upsert_progress(
        self,
        content_id: uuid.UUID,
        percentage: float,
        last_position: float,
        status: str = "in_progress",
        completed_at: Optional[datetime] = None
    ) -> UserProgress:
        """
        Creates or updates progress data. 
        Implements idempotency and automated completion logic.
        """
        progress = await self.get_progress(content_id)

        if not progress:
            progress = UserProgress(
                user_id=self.user_id,
                content_id=content_id,
                status=status,
                completion_percentage=percentage,
                last_position_seconds=last_position,
                last_watched_at=datetime.now(timezone.utc),
                completed_at=completed_at
            )
            self.session.add(progress)
        else:
            # Prevent progress from going backwards
            if percentage > progress.completion_percentage:
                progress.completion_percentage = percentage
                # Update status if threshold met
                if status == "completed" and progress.status != "completed":
                    progress.status = "completed"
                    progress.completed_at = completed_at or datetime.now(timezone.utc)
            
            progress.last_position_seconds = last_position
            progress.last_watched_at = datetime.now(timezone.utc)
            
            if progress.status == "not_started" and status == "in_progress":
                progress.status = "in_progress"

        await self.session.flush()
        return progress

    async def get_stats(self, tenant_id: uuid.UUID, content_type: Optional[str] = None) -> dict:
        """Calculates overall completion stats for the dashboard."""
        
        # 1. Total count of published contents for the tenant
        total_stmt = select(func.count(AcademyContent.id)).where(
            AcademyContent.tenant_id == tenant_id,
            AcademyContent.status == ContentStatus.PUBLISHED,
        )
        if content_type:
            total_stmt = total_stmt.where(AcademyContent.type == content_type)
        
        total_res = await self.session.execute(total_stmt)
        total_count = total_res.scalar() or 0

        if total_count == 0:
            return {"completed": 0, "total": 0, "percentage": 0.0}

        # 2. Count of completed contents by this user
        # Note: We filter through AcademyContent to ensure we count for this tenant/type
        completed_stmt = select(func.count(UserProgress.id)).join(
            AcademyContent, AcademyContent.id == UserProgress.content_id
        ).where(
            UserProgress.user_id == self.user_id,
            UserProgress.status == "completed",
            AcademyContent.tenant_id == tenant_id,
            AcademyContent.status == ContentStatus.PUBLISHED
        )
        if content_type:
            completed_stmt = completed_stmt.where(AcademyContent.type == content_type)

        completed_res = await self.session.execute(completed_stmt)
        completed_count = completed_res.scalar() or 0

        return {
            "completed": completed_count,
            "total": total_count,
            "percentage": round((completed_count / total_count) * 100, 1)
        }

    async def get_detailed_progress(self, tenant_id: uuid.UUID) -> List[dict]:
        """
        Returns a detailed list of all published contents and the user's progress for each.
        Used for child progress drill-down.
        """
        # Fetch all published content for this tenant
        content_stmt = select(AcademyContent).where(
            AcademyContent.tenant_id == tenant_id,
            AcademyContent.status == ContentStatus.PUBLISHED
        ).order_by(AcademyContent.order.asc())
        
        contents = (await self.session.execute(content_stmt)).scalars().all()
        
        # Fetch all progress records for this user
        progress_stmt = select(UserProgress).where(UserProgress.user_id == self.user_id)
        progress_records = {p.content_id: p for p in (await self.session.execute(progress_stmt)).scalars().all()}
        
        results = []
        for content in contents:
            p = progress_records.get(content.id)
            results.append({
                "content_id": content.id,
                "title": content.title,
                "type": content.type,
                "status": p.status if p else "not_started",
                "percentage": p.completion_percentage if p else 0,
                "completed_at": p.completed_at if p else None
            })
            
        return results

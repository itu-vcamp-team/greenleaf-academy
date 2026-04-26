import uuid
from typing import List, Optional
from sqlalchemy import select, or_, update
from src.datalayer.model.db.academy_content import AcademyContent, ContentType, ContentStatus
from src.datalayer.model.db.user_progress import UserProgress
from src.datalayer.repository._base_repository import AsyncBaseRepository


class AcademyRepository(AsyncBaseRepository[AcademyContent]):
    """
    Repository for managing Academy Content.
    Single-tenant: no tenant filtering required.
    """
    def __init__(self, session):
        super().__init__(session, AcademyContent)

    async def get_contents_by_type(
        self,
        content_type: ContentType,
        locale: Optional[str] = None,
        include_draft: bool = False
    ) -> List[AcademyContent]:
        """
        Fetch contents by type and optionally filter by locale.
        If locale is None, returns all locales.
        """
        stmt = select(AcademyContent).where(
            AcademyContent.type == content_type
        )
        if locale:
            stmt = stmt.where(AcademyContent.locale == locale)
        stmt = stmt.order_by(AcademyContent.order.asc())

        if not include_draft:
            stmt = stmt.where(AcademyContent.status == ContentStatus.PUBLISHED)

        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def search_contents(
        self,
        query: str,
        locale: Optional[str] = None,
        content_type: Optional[ContentType] = None
    ) -> List[AcademyContent]:
        """
        Search contents using ILIKE on title and description.
        Only returns PUBLISHED contents.
        If locale is None, searches across all locales.
        """
        search_pattern = f"%{query}%"
        stmt = select(AcademyContent).where(
            AcademyContent.status == ContentStatus.PUBLISHED,
            or_(
                AcademyContent.title.ilike(search_pattern),
                AcademyContent.description.ilike(search_pattern)
            )
        ).order_by(AcademyContent.order.asc()).limit(20)
        if locale:
            stmt = stmt.where(AcademyContent.locale == locale)

        if content_type:
            stmt = stmt.where(AcademyContent.type == content_type)

        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_with_progress(
        self,
        user_id: uuid.UUID,
        content_type: ContentType,
        locale: Optional[str] = None
    ) -> List[dict]:
        """
        Complex fetch: matches content with user progress and calculates 'is_locked'.
        """
        # 1. Fetch all contents for this type/locale
        contents = await self.get_contents_by_type(content_type, locale)
        if not contents:
            return []

        # 2. Fetch progress for these contents
        content_ids = [c.id for c in contents]
        progress_stmt = select(UserProgress).where(
            UserProgress.user_id == user_id,
            UserProgress.content_id.in_(content_ids)
        )
        result = await self.session.execute(progress_stmt)
        progress_map = {p.content_id: p for p in result.scalars().all()}

        # 3. Build result with lock logic
        results = []
        prev_completed = True  # First content is always unlocked

        for content in contents:
            progress = progress_map.get(content.id)

            if content.prerequisite_id is None:
                is_locked = False
            else:
                # Locked if the prerequisite hasn't been completed
                prereq_progress = progress_map.get(content.prerequisite_id)
                is_locked = not (prereq_progress and prereq_progress.status == "completed")

            results.append({
                "content": content,
                "progress": progress,
                "is_locked": is_locked
            })

            prev_completed = (progress and progress.status == "completed")

        return results

    async def reorder_contents(self, ordered_ids: List[uuid.UUID]) -> None:
        """Update display order based on the position in the provided list."""
        for idx, content_id in enumerate(ordered_ids):
            stmt = (
                update(AcademyContent)
                .where(AcademyContent.id == content_id)
                .values(order=idx + 1)
            )
            await self.session.execute(stmt)

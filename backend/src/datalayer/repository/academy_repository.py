import uuid
from typing import List, Optional
from sqlalchemy import select, or_, update, case
from src.datalayer.model.db.academy_content import AcademyContent, ContentType, ContentStatus
from src.datalayer.model.db.user_progress import UserProgress
from src.datalayer.repository._base_repository import AsyncBaseRepository


class AcademyRepository(AsyncBaseRepository[AcademyContent]):
    """
    Repository for managing Academy Content.
    """
    def __init__(self, session):
        super().__init__(session, AcademyContent)

    async def get_contents_by_type(
        self,
        content_type: ContentType,
        locale: Optional[str] = None,
        include_draft: bool = False,
        public_only: bool = False,
        public_first: bool = False,
    ) -> List[AcademyContent]:
        """
        Fetch contents by type and optionally filter by locale.
        If locale is None, returns all locales.
        public_only=True filters to is_public=True (used for guest views).
        public_first=True sorts public items before private ones (guest view).
        Partners always see the admin-defined order (order ASC only).
        """
        stmt = select(AcademyContent).where(
            AcademyContent.type == content_type
        )
        if locale:
            stmt = stmt.where(AcademyContent.locale == locale)

        if not include_draft:
            stmt = stmt.where(AcademyContent.status == ContentStatus.PUBLISHED)

        if public_only:
            stmt = stmt.where(AcademyContent.is_public == True)

        if public_first:
            # Guest view: public items float to the top, then by admin-defined order
            stmt = stmt.order_by(
                case((AcademyContent.is_public == True, 0), else_=1).asc(),
                AcademyContent.order.asc()
            )
        else:
            # Partner/admin view: respect admin's custom sort order exactly
            stmt = stmt.order_by(AcademyContent.order.asc())

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
        ).order_by(
            case((AcademyContent.is_public == True, 0), else_=1).asc(),
            AcademyContent.order.asc()
        ).limit(20)
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
        Uses admin-defined order only (no public-first for partners).
        """
        # 1. Fetch all published contents for this type/locale in admin's custom order
        contents = await self.get_contents_by_type(content_type, locale, public_first=False)
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
        """
        Update display order and prerequisite chain based on the provided list.
        Auto-links each item to the previous one in the list.
        """
        from src.utils.lexorank import generate_sequence
        ranks = generate_sequence(len(ordered_ids))

        prev_id = None
        for idx, content_id in enumerate(ordered_ids):
            stmt = (
                update(AcademyContent)
                .where(AcademyContent.id == content_id)
                .values(
                    order=ranks[idx],
                    prerequisite_id=prev_id
                )
            )
            await self.session.execute(stmt)
            prev_id = content_id

    async def get_with_neighbors(self, content_id: uuid.UUID, public_first: bool = False) -> dict:
        """
        Fetches content along with its next and previous IDs in the sequence.
        public_first=True for guests (public items float to top), False for partners
        (admin-defined order only).
        """
        content = await self.get_by_id(content_id)
        if not content:
            return None

        # Find neighbors within the same type and locale using the correct sort order
        stmt = select(AcademyContent).where(
            AcademyContent.type == content.type,
            AcademyContent.locale == content.locale,
            AcademyContent.status == ContentStatus.PUBLISHED
        )
        if public_first:
            stmt = stmt.order_by(
                case((AcademyContent.is_public == True, 0), else_=1).asc(),
                AcademyContent.order.asc()
            )
        else:
            stmt = stmt.order_by(AcademyContent.order.asc())
        
        result = await self.session.execute(stmt)
        all_contents = result.scalars().all()
        
        content_list = list(all_contents)
        try:
            idx = next(i for i, c in enumerate(content_list) if c.id == content_id)
            prev_id = content_list[idx - 1].id if idx > 0 else None
            next_id = content_list[idx + 1].id if idx < len(content_list) - 1 else None
        except StopIteration:
            prev_id = None
            next_id = None

        return {
            "content": content,
            "prev_id": prev_id,
            "next_id": next_id
        }

    async def get_last_item(self, content_type: ContentType, locale: str) -> Optional[AcademyContent]:
        """Fetches the last item in the sequence for a given type/locale."""
        stmt = select(AcademyContent).where(
            AcademyContent.type == content_type,
            AcademyContent.locale == locale
        ).order_by(AcademyContent.order.desc()).limit(1)
        
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

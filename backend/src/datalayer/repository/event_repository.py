import uuid
from datetime import datetime, timezone
from typing import List
from sqlalchemy import select
from src.datalayer.model.db.event import Event, EventVisibility
from src.datalayer.model.db.user import User, UserRole
from src.datalayer.repository._base_repository import AsyncBaseRepository


class EventRepository(AsyncBaseRepository[Event]):
    def __init__(self, session):
        super().__init__(session, Event)

    async def get_upcoming_events(
        self,
        user_role: UserRole,
        limit: int = 50,
    ) -> List[Event]:
        """
        Fetches published upcoming events.
        GUEST role: only visibility=ALL events.
        PARTNER+ role: all published events.
        """
        now = datetime.now(timezone.utc)
        stmt = (
            select(Event)
            .where(
                Event.is_published == True,
                Event.start_time >= now,
            )
            .order_by(Event.start_time.asc())
            .limit(limit)
        )

        if user_role == UserRole.GUEST:
            stmt = stmt.where(Event.visibility == EventVisibility.ALL)

        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_events_by_month(
        self,
        year: int,
        month: int,
        user_role: UserRole = None,  # kept for API compat; visibility no longer filtered here
    ) -> List[Event]:
        """Fetches UPCOMING events for a specific month (for calendar grid).

        Past events are excluded so the calendar never shows stale entries.
        ALL visibility levels are included regardless of role — meeting links
        are stripped for guests via GuestEventResponse in the route handler,
        and the UI uses the `visibility` field to show a lock indicator.
        """
        import calendar as cal_module
        _, last_day = cal_module.monthrange(year, month)

        now = datetime.now(timezone.utc)
        month_end = datetime(year, month, last_day, 23, 59, 59, tzinfo=timezone.utc)

        # For the current or past months: start from NOW (skip already-passed events).
        # For future months: start from the beginning of that month.
        month_start = datetime(year, month, 1, tzinfo=timezone.utc)
        effective_start = max(month_start, now)

        stmt = (
            select(Event)
            .where(
                Event.is_published == True,
                Event.start_time >= effective_start,
                Event.start_time <= month_end,
            )
            .order_by(Event.start_time.asc())
        )

        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_all_events(self, limit: int = 100) -> List[Event]:
        """Admin view: Fetches all events regardless of status or date."""
        stmt = select(Event).order_by(Event.start_time.desc()).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_partner_emails_for_announcement(self) -> List[str]:
        """
        Fetches emails of all active and verified partners.
        Used for broadcast announcements.
        """
        stmt = select(User.email).where(
            User.role == UserRole.PARTNER,
            User.is_active == True,
            User.is_verified == True,
        )
        result = await self.session.execute(stmt)
        return [row[0] for row in result.all()]

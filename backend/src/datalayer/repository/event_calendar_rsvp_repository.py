import uuid
from typing import List, Set

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.datalayer.model.db.event_calendar_rsvp import EventCalendarRsvp
from src.datalayer.repository._base_repository import AsyncBaseRepository


class EventCalendarRsvpRepository(AsyncBaseRepository[EventCalendarRsvp]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, EventCalendarRsvp)

    async def get_by_event_id(self, event_id: uuid.UUID) -> List[EventCalendarRsvp]:
        result = await self.session.execute(
            select(EventCalendarRsvp)
            .where(EventCalendarRsvp.event_id == event_id)
            .order_by(EventCalendarRsvp.created_at.desc())
        )
        return list(result.scalars().all())

    async def count_by_event_id(self, event_id: uuid.UUID) -> int:
        result = await self.session.execute(
            select(func.count())
            .select_from(EventCalendarRsvp)
            .where(EventCalendarRsvp.event_id == event_id)
        )
        return result.scalar() or 0

    async def already_rsvped(self, event_id: uuid.UUID, email: str) -> bool:
        result = await self.session.execute(
            select(EventCalendarRsvp)
            .where(
                EventCalendarRsvp.event_id == event_id,
                EventCalendarRsvp.email == email.lower(),
            )
            .limit(1)
        )
        return result.scalar_one_or_none() is not None

    async def get_rsvped_event_ids(self, email: str) -> Set[uuid.UUID]:
        """Returns the set of event IDs the given email has RSVPed to."""
        result = await self.session.execute(
            select(EventCalendarRsvp.event_id)
            .where(EventCalendarRsvp.email == email.lower())
        )
        return set(result.scalars().all())

    async def record_rsvp(
        self,
        event_id: uuid.UUID,
        email: str,
        full_name: str | None = None,
        is_member: bool = False,
        user_id: uuid.UUID | None = None,
    ) -> EventCalendarRsvp:
        """Create and persist a new RSVP record; returns the saved instance."""
        rsvp = EventCalendarRsvp(
            event_id=event_id,
            email=email.lower().strip(),
            full_name=full_name.strip() if full_name else None,
            is_member=is_member,
            user_id=user_id,
        )
        return await self.save(rsvp)

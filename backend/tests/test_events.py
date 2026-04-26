import pytest
import uuid
from datetime import datetime, timezone, timedelta
from src.datalayer.model.db.event import Event, EventCategory, EventVisibility
from src.datalayer.model.db.user import UserRole
from src.datalayer.repository.event_repository import EventRepository
from src.services.event_service import EventService
from src.utils.ical_generator import generate_ics

@pytest.mark.asyncio
async def test_event_visibility_guest_vs_partner(db_session):
    """Ensure GUEST cannot see PARTNER_ONLY events or meeting links."""
    repo = EventRepository(db_session)

    # Create one public and one partner event
    e1 = Event(
        id=uuid.uuid4(), title="Public",
        category=EventCategory.WEBINAR, start_time=datetime.now(timezone.utc) + timedelta(days=1),
        visibility=EventVisibility.ALL, is_published=True
    )
    e2 = Event(
        id=uuid.uuid4(), title="Secret",
        category=EventCategory.TRAINING, start_time=datetime.now(timezone.utc) + timedelta(days=2),
        visibility=EventVisibility.PARTNER_ONLY, is_published=True,
        meeting_link="https://zoom.us/secret"
    )

    db_session.add_all([e1, e2])
    await db_session.commit()

    # 1. GUEST Check
    guest_events = await repo.get_upcoming_events(UserRole.GUEST)
    assert len(guest_events) == 1
    assert guest_events[0].title == "Public"

    # 2. PARTNER Check
    partner_events = await repo.get_upcoming_events(UserRole.PARTNER)
    assert len(partner_events) == 2

@pytest.mark.asyncio
async def test_ical_content_generation():
    """Verify .ics header and structure."""
    start = datetime(2026, 5, 20, 10, 0, tzinfo=timezone.utc)
    ics = generate_ics(
        title="Test Event",
        description="Test Desc",
        start_time=start,
        end_time=None,
        location="Istanbul",
        meeting_link="https://link.com"
    )

    assert "BEGIN:VCALENDAR" in ics
    assert "SUMMARY:Test Event" in ics
    assert "DTSTART:20260520T100000Z" in ics
    assert "LOCATION:Istanbul" in ics
    assert "END:VCALENDAR" in ics

@pytest.mark.asyncio
async def test_event_deletion_removes_cover_logic(db_session):
    """Verify event service handles deletion correctly (logical check for path)."""
    repo = EventRepository(db_session)
    service = EventService(repo)

    event_id = uuid.uuid4()
    event = await service.create_event({
        "id": event_id,
        "title": "Old Event",
        "category": EventCategory.MEETUP,
        "start_time": datetime.now(timezone.utc),
        "cover_image_path": "/uploads/events/test.webp"
    })

    res = await service.delete_event(event_id)

    assert res is True
    assert await repo.get_by_id(event_id) is None

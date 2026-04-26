from __future__ import annotations

import uuid
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from src.datalayer.database import get_db_session
from src.datalayer.model.db.user import User, UserRole
from src.datalayer.model.db.event import EventCategory, EventVisibility
from src.datalayer.repository.event_repository import EventRepository
from src.datalayer.repository.event_calendar_rsvp_repository import EventCalendarRsvpRepository
from src.services.event_service import EventService
from src.services.mailing_service import MailingService
from src.utils.auth_deps import get_current_admin, get_current_partner, get_optional_user
from src.utils.ical_generator import generate_ics
from src.datalayer.model.dto.event_dto import EventResponse, GuestEventResponse, GuestCalendarRequest, RsvpResponse

router = APIRouter(prefix="/events", tags=["Events"])


# ─── Public / mixed-auth endpoints ────────────────────────────────────────────

@router.get("", response_model=list[EventResponse | GuestEventResponse])
async def list_events(
    limit: int = Query(default=20, le=100),
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_optional_user),
):
    """Lists upcoming events. Guests see less info (no meeting link)."""
    repo = EventRepository(db)
    events = await repo.get_upcoming_events(current_user.role, limit)
    return [_sanitize_event(e, current_user.role) for e in events]


@router.get("/calendar", response_model=list[EventResponse | GuestEventResponse])
async def get_calendar_events(
    year: int | None = Query(None, ge=2024, le=2100),
    month: int | None = Query(None, ge=1, le=12),
    db: AsyncSession = Depends(get_db_session),
    current_user=Depends(get_optional_user),
):
    """Returns events for a specific month for calendar view."""
    now = datetime.now()
    year = year or now.year
    month = month or now.month

    repo = EventRepository(db)
    events = await repo.get_events_by_month(year, month, current_user.role)
    return [_sanitize_event(e, current_user.role) for e in events]


# ─── Calendar-invite (add to calendar) ────────────────────────────────────────

@router.get("/{event_id}/add-to-calendar")
async def add_to_calendar(
    event_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_partner),
):
    """
    Authenticated partners/admins: records their RSVP and sends an
    .ics calendar invite to their registered email address.
    """
    repo = EventRepository(db)
    event = await repo.get_by_id(event_id)
    if not event or not event.is_published:
        raise HTTPException(status_code=404, detail="Etkinlik bulunamadı.")

    # Idempotent RSVP: record only if not already saved
    rsvp_repo = EventCalendarRsvpRepository(db)
    if not await rsvp_repo.already_rsvped(event_id, current_user.email):
        await rsvp_repo.record_rsvp(
            event_id=event_id,
            email=current_user.email,
            full_name=current_user.full_name if hasattr(current_user, "full_name") else None,
            is_member=True,
            user_id=current_user.id,
        )

    ics_content = generate_ics(
        title=event.title,
        description=event.description,
        start_time=event.start_time,
        end_time=event.end_time,
        location=event.location,
        meeting_link=event.meeting_link,
    )

    background_tasks.add_task(
        MailingService.send_calendar_invite_email,
        to_email=current_user.email,
        event_title=event.title,
        ics_content=ics_content,
    )

    return {"message": "Takvim daveti e-postanıza gönderildi."}


@router.post("/{event_id}/add-to-calendar/guest")
async def add_to_calendar_guest(
    event_id: uuid.UUID,
    body: GuestCalendarRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db_session),
):
    """
    Unauthenticated guests: collect name + email, record the RSVP,
    and send an .ics invite. Only allowed for publicly visible events.
    """
    # Basic email sanity check (avoids heavy dependency like email-validator)
    email = (body.email or "").strip()
    if "@" not in email or "." not in email.split("@")[-1]:
        raise HTTPException(status_code=422, detail="Geçerli bir e-posta adresi girin.")

    repo = EventRepository(db)
    event = await repo.get_by_id(event_id)
    if not event or not event.is_published:
        raise HTTPException(status_code=404, detail="Etkinlik bulunamadı.")

    if event.visibility != EventVisibility.ALL:
        raise HTTPException(
            status_code=403,
            detail="Bu etkinlik yalnızca üyelere özeldir. Giriş yaparak takvime ekleyebilirsiniz.",
        )

    # Idempotent RSVP: record only once per email per event
    rsvp_repo = EventCalendarRsvpRepository(db)
    if not await rsvp_repo.already_rsvped(event_id, email):
        await rsvp_repo.record_rsvp(
            event_id=event_id,
            email=email,
            full_name=body.full_name,
            is_member=False,
            user_id=None,
        )

    ics_content = generate_ics(
        title=event.title,
        description=event.description,
        start_time=event.start_time,
        end_time=event.end_time,
        location=event.location,
        meeting_link=None,  # guests do not receive the meeting link
    )

    background_tasks.add_task(
        MailingService.send_calendar_invite_email,
        to_email=email,
        event_title=event.title,
        ics_content=ics_content,
    )

    return {"message": "Takvim daveti e-postanıza gönderildi."}


# ─── Admin endpoints ───────────────────────────────────────────────────────────

@router.get("/admin/list", response_model=list[EventResponse])
async def list_admin_events(
    limit: int = Query(default=100, le=500),
    db: AsyncSession = Depends(get_db_session),
    admin_user: User = Depends(get_current_admin),
):
    """Admin view: Lists all events without filters."""
    repo = EventRepository(db)
    events = await repo.get_all_events(limit)
    return [EventResponse.model_validate(e) for e in events]


@router.get("/{event_id}/calendar-rsvps", response_model=list[RsvpResponse])
async def get_calendar_rsvps(
    event_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    admin_user: User = Depends(get_current_admin),
):
    """Admin: returns all calendar-invite RSVPs for a given event."""
    event_repo = EventRepository(db)
    event = await event_repo.get_by_id(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Etkinlik bulunamadı.")

    rsvp_repo = EventCalendarRsvpRepository(db)
    rsvps = await rsvp_repo.get_by_event_id(event_id)
    return [RsvpResponse.model_validate(r) for r in rsvps]


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_event(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    category: EventCategory = Form(...),
    start_time: datetime = Form(...),
    end_time: Optional[datetime] = Form(None),
    meeting_link: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    contact_info: Optional[str] = Form(None),
    visibility: EventVisibility = Form(default=EventVisibility.PARTNER_ONLY),
    cover_image: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db_session),
    admin_user: User = Depends(get_current_admin),
):
    """Admin creates event with optional cover image."""
    repo = EventRepository(db)
    service = EventService(repo)

    event_data = {
        "title": title,
        "description": description,
        "category": category,
        "start_time": start_time,
        "end_time": end_time,
        "meeting_link": meeting_link,
        "location": location,
        "contact_info": contact_info,
        "visibility": visibility,
    }

    return await service.create_event(event_data, cover_image)


@router.patch("/{event_id}")
async def update_event(
    event_id: uuid.UUID,
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    category: Optional[EventCategory] = Form(None),
    start_time: Optional[datetime] = Form(None),
    end_time: Optional[datetime] = Form(None),
    meeting_link: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    contact_info: Optional[str] = Form(None),
    visibility: Optional[EventVisibility] = Form(None),
    cover_image: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db_session),
    admin_user: User = Depends(get_current_admin),
):
    """Admin updates an existing event."""
    repo = EventRepository(db)
    service = EventService(repo)

    update_data = {k: v for k, v in {
        "title": title,
        "description": description,
        "category": category,
        "start_time": start_time,
        "end_time": end_time,
        "meeting_link": meeting_link,
        "location": location,
        "contact_info": contact_info,
        "visibility": visibility,
    }.items() if v is not None}

    try:
        return await service.update_event(event_id, update_data, cover_image)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{event_id}/publish")
async def publish_event(
    event_id: uuid.UUID,
    notify_partners: bool = Query(default=False),
    background_tasks: BackgroundTasks = None,
    db: AsyncSession = Depends(get_db_session),
    admin_user: User = Depends(get_current_admin),
):
    """Sets event to published and optionally broadcasts emails to partners."""
    repo = EventRepository(db)
    service = EventService(repo)

    try:
        event = await service.publish_event(event_id)
        emails = []

        if notify_partners and background_tasks:
            emails = await repo.get_partner_emails_for_announcement()
            if emails:
                background_tasks.add_task(
                    MailingService.send_event_announcement_email,
                    recipient_emails=emails,
                    event_title=event.title,
                    event_description=event.description,
                    start_time=event.start_time,
                    meeting_link=event.meeting_link,
                    location=event.location,
                )

        return {"message": "Etkinlik yayınlandı", "notified_count": len(emails) if notify_partners else 0}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{event_id}")
async def delete_event(
    event_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    admin_user: User = Depends(get_current_admin),
):
    """Admin deletes event (cascades to calendar RSVPs)."""
    repo = EventRepository(db)
    service = EventService(repo)

    deleted = await service.delete_event(event_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Etkinlik bulunamadı")

    return {"message": "Etkinlik silindi"}


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _sanitize_event(event, role: UserRole) -> EventResponse | GuestEventResponse:
    """Returns typed response, hiding sensitive info (meeting_link) from GUESTS."""
    if role == UserRole.GUEST:
        return GuestEventResponse.model_validate(event)
    return EventResponse.model_validate(event)

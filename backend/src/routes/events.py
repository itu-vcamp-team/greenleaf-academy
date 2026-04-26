from __future__ import annotations
import uuid
from typing import Optional, List, Union
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query, BackgroundTasks, Response
from sqlalchemy.ext.asyncio import AsyncSession

from src.datalayer.database import get_db_session
from src.datalayer.model.db.user import User, UserRole
from src.datalayer.model.db.event import EventCategory, EventVisibility
from src.datalayer.repository.event_repository import EventRepository
from src.services.event_service import EventService
from src.services.mailing_service import MailingService
from src.utils.auth_deps import get_current_user, get_current_admin, get_current_partner, get_optional_user
from src.utils.ical_generator import generate_ics
from src.datalayer.model.dto.event_dto import EventResponse, GuestEventResponse

router = APIRouter(prefix="/events", tags=["Events"])

@router.get("/", response_model=list[EventResponse | GuestEventResponse])
async def list_events(
    limit: int = Query(default=20, le=100),
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_optional_user),
):
    """Lists upcoming events. Guests see less info."""
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

@router.get("/{event_id}/add-to-calendar")
async def add_to_calendar(
    event_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_partner),
):
    """Generates .ics and sends it via email."""
    repo = EventRepository(db)
    event = await repo.get_by_id(event_id)
    if not event or not event.is_published:
        raise HTTPException(status_code=404, detail="Etkinlik bulunamadı.")

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
        ics_content=ics_content
    )

    return Response(
        content=ics_content,
        media_type="text/calendar",
        headers={
            "Content-Disposition": f'attachment; filename="{event.title}.ics"'
        }
    )

@router.post("/", status_code=status.HTTP_201_CREATED)
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
    """Admin creates event with image."""
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

@router.post("/{event_id}/publish")
async def publish_event(
    event_id: uuid.UUID,
    notify_partners: bool = Query(default=False),
    background_tasks: BackgroundTasks = None,
    db: AsyncSession = Depends(get_db_session),
    admin_user: User = Depends(get_current_admin),
):
    """Sets event to published and optionally broadcasts emails."""
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
                    location=event.location
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
    """Admin deletes event."""
    repo = EventRepository(db)
    service = EventService(repo)

    deleted = await service.delete_event(event_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Etkinlik bulunamadı")

    return {"message": "Etkinlik silindi"}


# Helpers
def _sanitize_event(event: any, role: UserRole) -> dict:
    """Hides sensitive info (meeting_link) from GUESTS."""
    data = {
        "id": event.id,
        "title": event.title,
        "description": event.description,
        "category": event.category,
        "start_time": event.start_time,
        "end_time": event.end_time,
        "cover_image_url": event.cover_image_path,
        "location": event.location,
        "contact_info": event.contact_info,
        "visibility": event.visibility,
    }

    if role == UserRole.GUEST:
        data["meeting_link"] = None
    else:
        data["meeting_link"] = event.meeting_link

    return data

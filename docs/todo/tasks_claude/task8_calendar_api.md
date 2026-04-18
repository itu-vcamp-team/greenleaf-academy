# Task 8: Dinamik Takvim ve Etkinlik Yönetimi

## 🎯 Hedef
Etkinlik CRUD endpoint'lerini, kapak görseli yüklemeyi (WebP dönüşümü), etkinlik görünürlük kontrolünü (Partner/Herkese açık), "Takvime Ekle" mail gönderimini ve admin'in tüm partnerlere tek tuşla bildirim gönderebilmesini uygulamak.

## ⚠️ Ön Koşullar
- Task 1-4 tamamlanmış, `Event` modeli ve image storage kurulu olmalı
- Resend mail servisi (Task 9) hazır olmalı (takvim maili için)
- `UPLOAD_DIR` env değişkeni Render disk path'ini göstermeli

---

## 🧠 Etkinlik Sistemi Mantığı

```
Admin bir etkinlik oluşturur:
  title, description, category, start_time, end_time
  meeting_link (Zoom/Meet), location (fiziksel adres)
  cover_image (opsiyonel görsel), visibility (ALL / PARTNER_ONLY)
  contact_info (davetiye notu)

  ──── "Partnerlere Duyur" butonuna basar ────
  → Tenant'taki tüm aktif partnerlere bildirim maili gönderilir

Partner bir etkinlik görür:
  → "Takvime Ekle" butonuna basar
  → Backend .ics (iCalendar) dosyası üretir
  → Kullanıcının e-postasına takvim daveti gönderilir
  → PARTNER_ONLY etkinliklerin meeting_link'i misafire gösterilmez
```

---

## 📄 Adım 1: Görsel Yükleme Altyapısı – `src/services/image_service.py`

```python
import os
import uuid
from pathlib import Path
from PIL import Image
import io
from fastapi import UploadFile, HTTPException
from src.config import get_settings

settings = get_settings()

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_FILE_SIZE_MB = 5
MAX_DIMENSIONS = (1920, 1080)  # Maksimum çözünürlük
OUTPUT_QUALITY = 80             # WebP kalitesi (0-100)


async def save_image(
    upload_file: UploadFile,
    subfolder: str,  # "events", "profiles", "tenants"
) -> str:
    """
    Yüklenen görseli WebP formatına dönüştürüp Render disk'e kayder.
    
    Returns: Görselin göreceli yolu (örn: "/uploads/events/abc.webp")
    """
    # İçerik türü doğrulama
    if upload_file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=422,
            detail=f"Geçersiz dosya türü. İzin verilenler: JPEG, PNG, WebP, GIF"
        )

    # Dosya boyutu kontrolü
    content = await upload_file.read()
    size_mb = len(content) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=422,
            detail=f"Dosya boyutu {MAX_FILE_SIZE_MB}MB'ı aşamaz. (Gönderilen: {size_mb:.1f}MB)"
        )

    # PIL ile görseli aç ve WebP'ye dönüştür
    try:
        image = Image.open(io.BytesIO(content))
    except Exception:
        raise HTTPException(status_code=422, detail="Geçersiz görsel dosyası.")

    # RGBA ise RGB'ye çevir (WebP RGBA destekler ama JPEG için gerekli)
    if image.mode in ("RGBA", "P"):
        image = image.convert("RGB")

    # Büyük görselleri küçült (aspect ratio koruyarak)
    image.thumbnail(MAX_DIMENSIONS, Image.Resampling.LANCZOS)

    # Kayıt dizinini oluştur
    save_dir = Path(settings.UPLOAD_DIR) / subfolder
    save_dir.mkdir(parents=True, exist_ok=True)

    # Benzersiz dosya adı
    filename = f"{uuid.uuid4()}.webp"
    file_path = save_dir / filename

    # WebP olarak kaydet
    image.save(file_path, "WEBP", quality=OUTPUT_QUALITY)

    # Göreceli path döner (API response'da kullanılır)
    return f"/uploads/{subfolder}/{filename}"


def delete_image(image_path: str | None) -> None:
    """Disk'teki görsel dosyasını siler. Hata olursa sessizce geçer."""
    if not image_path:
        return
    full_path = Path(settings.UPLOAD_DIR).parent / image_path.lstrip("/")
    try:
        if full_path.exists():
            full_path.unlink()
    except Exception:
        pass  # Silme başarısız olsa bile devam et
```

---

## 📄 Adım 2: `.ics` (iCalendar) Üretici – `src/utils/ical_generator.py`

```python
from datetime import datetime
import uuid as uuid_lib


def generate_ics(
    title: str,
    description: str | None,
    start_time: datetime,
    end_time: datetime | None,
    location: str | None,
    meeting_link: str | None,
    organizer_email: str = "noreply@greenleafakademi.com",
) -> str:
    """
    RFC 5545 uyumlu .ics (iCalendar) içeriği üretir.
    Kullanıcının telefon/bilgisayar takvimine eklenebilir.
    
    Returns: .ics dosya içeriği (string)
    """
    uid = str(uuid_lib.uuid4())
    now = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    start_str = start_time.strftime("%Y%m%dT%H%M%SZ")

    if end_time:
        end_str = end_time.strftime("%Y%m%dT%H%M%SZ")
    else:
        # Varsayılan bitiş: başlangıç + 1 saat
        from datetime import timedelta
        end_str = (start_time + timedelta(hours=1)).strftime("%Y%m%dT%H%M%SZ")

    # Açıklama oluştur
    desc_parts = []
    if description:
        desc_parts.append(description)
    if meeting_link:
        desc_parts.append(f"Toplantı Bağlantısı: {meeting_link}")
    description_text = "\\n".join(desc_parts).replace(",", "\\,")

    location_text = ""
    if location:
        location_text = f"LOCATION:{location}\r\n"
    elif meeting_link:
        location_text = f"LOCATION:{meeting_link}\r\n"

    ics_content = (
        "BEGIN:VCALENDAR\r\n"
        "VERSION:2.0\r\n"
        "PRODID:-//Greenleaf Akademi//TR\r\n"
        "METHOD:REQUEST\r\n"
        "BEGIN:VEVENT\r\n"
        f"UID:{uid}\r\n"
        f"DTSTAMP:{now}\r\n"
        f"DTSTART:{start_str}\r\n"
        f"DTEND:{end_str}\r\n"
        f"SUMMARY:{title}\r\n"
        f"DESCRIPTION:{description_text}\r\n"
        f"{location_text}"
        f"ORGANIZER:mailto:{organizer_email}\r\n"
        "STATUS:CONFIRMED\r\n"
        "END:VEVENT\r\n"
        "END:VCALENDAR\r\n"
    )

    return ics_content
```

---

## 📄 Adım 3: `src/datalayer/repository/event_repository.py`

```python
import uuid
from datetime import datetime
from typing import List, Optional
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.datalayer.model.db import Event, EventVisibility, User, UserRole
from src.datalayer.repository.base_repository import TenantRepository


class EventRepository(TenantRepository[Event]):
    model = Event

    async def get_upcoming_events(
        self,
        user_role: UserRole,
        limit: int = 50,
    ) -> List[Event]:
        """
        Gelecekteki yayınlanmış etkinlikleri döner.
        GUEST rolü: sadece ALL görünürlüklü etkinlikler
        PARTNER+: tüm yayınlanmış etkinlikler
        """
        now = datetime.utcnow()
        query = (
            select(Event)
            .where(
                Event.tenant_id == self.tenant_id,
                Event.is_published == True,
                Event.start_time >= now,
            )
            .order_by(Event.start_time.asc())
            .limit(limit)
        )

        if user_role == UserRole.GUEST:
            query = query.where(Event.visibility == EventVisibility.ALL)

        result = await self.session.execute(query)
        return result.scalars().all()

    async def get_events_by_month(
        self,
        year: int,
        month: int,
        user_role: UserRole,
    ) -> List[Event]:
        """Belirli ay/yılın etkinliklerini döner (takvim görünümü için)."""
        from calendar import monthrange
        _, last_day = monthrange(year, month)

        month_start = datetime(year, month, 1)
        month_end = datetime(year, month, last_day, 23, 59, 59)

        query = (
            select(Event)
            .where(
                Event.tenant_id == self.tenant_id,
                Event.is_published == True,
                Event.start_time >= month_start,
                Event.start_time <= month_end,
            )
            .order_by(Event.start_time.asc())
        )

        if user_role == UserRole.GUEST:
            query = query.where(Event.visibility == EventVisibility.ALL)

        result = await self.session.execute(query)
        return result.scalars().all()

    async def get_partner_emails_in_tenant(self) -> List[str]:
        """
        Bu tenant'taki tüm aktif partner e-postalarını döner.
        Toplu bildirim gönderimi için kullanılır.
        """
        result = await self.session.execute(
            select(User.email).where(
                User.tenant_id == self.tenant_id,
                User.role == UserRole.PARTNER,
                User.is_active == True,
                User.is_verified == True,
            )
        )
        return result.scalars().all()
```

---

## 📄 Adım 4: `src/routes/events.py` – Event Endpoint'leri

```python
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, BackgroundTasks, Response
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from src.datalayer.database import get_db_session
from src.utils.auth_deps import get_current_user, get_current_admin
from src.utils.tenant_deps import get_tenant_id
from src.datalayer.model.db import User, Event, EventCategory, EventVisibility
from src.datalayer.repository.event_repository import EventRepository
from src.services.image_service import save_image, delete_image
from src.utils.ical_generator import generate_ics

router = APIRouter(prefix="/events", tags=["Events"])


@router.get("/")
async def list_events(
    db: AsyncSession = Depends(get_db_session),
    tenant_id: str = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    limit: int = Query(default=20, le=100),
):
    """Yaklaşan etkinlikleri listeler. Guest için meeting_link gizlenir."""
    repo = EventRepository(db, uuid.UUID(tenant_id))
    events = await repo.get_upcoming_events(current_user.role, limit)
    return [_sanitize_event(e, current_user) for e in events]


@router.get("/calendar")
async def get_calendar_events(
    year: int = Query(default=2025),
    month: int = Query(default=1, ge=1, le=12),
    db: AsyncSession = Depends(get_db_session),
    tenant_id: str = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
):
    """
    Belirli ay/yıl için etkinlikleri listeler.
    Takvim grid görünümü için kullanılır.
    """
    repo = EventRepository(db, uuid.UUID(tenant_id))
    events = await repo.get_events_by_month(year, month, current_user.role)
    return [_sanitize_event(e, current_user) for e in events]


@router.get("/{event_id}/add-to-calendar")
async def add_to_calendar(
    event_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    tenant_id: str = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    background_tasks: BackgroundTasks = None,
):
    """
    "Takvime Ekle" butonu.
    1. .ics dosyası üretir ve kullanıcının e-postasına gönderir.
    2. .ics dosyasını Response olarak döner (tarayıcı indirir/takvime ekler).
    """
    repo = EventRepository(db, uuid.UUID(tenant_id))
    event = await repo.get_by_id(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Etkinlik bulunamadı.")

    ics_content = generate_ics(
        title=event.title,
        description=event.description,
        start_time=event.start_time,
        end_time=event.end_time,
        location=event.location,
        meeting_link=event.meeting_link if current_user.role != "GUEST" else None,
    )

    # Arka planda e-posta gönder
    if background_tasks:
        from src.services.mailing_service import send_calendar_invite_email
        background_tasks.add_task(
            send_calendar_invite_email,
            to_email=current_user.email,
            event_title=event.title,
            ics_content=ics_content,
        )

    # .ics dosyasını Response olarak döner
    return Response(
        content=ics_content,
        media_type="text/calendar",
        headers={
            "Content-Disposition": f'attachment; filename="{event.title}.ics"'
        },
    )


@router.post("/", dependencies=[Depends(get_current_admin)])
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
    tenant_id: str = Depends(get_tenant_id),
):
    """
    Etkinlik oluşturur. Görsel varsa WebP'ye dönüştürülür.
    Form data kullanılır (multipart/form-data) çünkü dosya yükleniyor.
    """
    cover_image_path = None
    if cover_image:
        cover_image_path = await save_image(cover_image, "events")

    repo = EventRepository(db, uuid.UUID(tenant_id))
    event = await repo.create({
        "title": title,
        "description": description,
        "category": category,
        "start_time": start_time,
        "end_time": end_time,
        "meeting_link": meeting_link,
        "location": location,
        "contact_info": contact_info,
        "visibility": visibility,
        "cover_image_path": cover_image_path,
        "is_published": False,  # Önce taslak olarak oluşturulur
    })
    return event


@router.post("/{event_id}/publish", dependencies=[Depends(get_current_admin)])
async def publish_event(
    event_id: uuid.UUID,
    notify_partners: bool = False,
    db: AsyncSession = Depends(get_db_session),
    tenant_id: str = Depends(get_tenant_id),
    background_tasks: BackgroundTasks = None,
):
    """
    Etkinliği yayına alır.
    notify_partners=True ise tenant'taki tüm aktif partnerlere mail gönderir.
    """
    repo = EventRepository(db, uuid.UUID(tenant_id))
    event = await repo.get_by_id(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Etkinlik bulunamadı.")

    event.is_published = True

    if notify_partners and background_tasks:
        partner_emails = await repo.get_partner_emails_in_tenant()
        if partner_emails:
            from src.services.mailing_service import send_event_announcement_email
            background_tasks.add_task(
                send_event_announcement_email,
                recipient_emails=partner_emails,
                event_title=event.title,
                event_description=event.description,
                start_time=event.start_time,
                meeting_link=event.meeting_link,
                location=event.location,
            )

    return {"message": "Etkinlik yayına alındı.", "notified_count": len(partner_emails) if notify_partners else 0}


@router.delete("/{event_id}", dependencies=[Depends(get_current_admin)])
async def delete_event(
    event_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    tenant_id: str = Depends(get_tenant_id),
):
    """Etkinliği ve varsa kapak görselini siler."""
    repo = EventRepository(db, uuid.UUID(tenant_id))
    event = await repo.get_by_id(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Etkinlik bulunamadı.")

    # Disk'teki görseli sil
    delete_image(event.cover_image_path)
    await repo.delete(event_id)
    return {"message": "Etkinlik silindi."}


# === Yardımcı Fonksiyonlar ===

def _sanitize_event(event: Event, current_user: User) -> dict:
    """
    GUEST için meeting_link gizlenir.
    PARTNER+ için tüm alanlar gösterilir.
    """
    data = {
        "id": str(event.id),
        "title": event.title,
        "description": event.description,
        "category": event.category,
        "start_time": event.start_time.isoformat(),
        "end_time": event.end_time.isoformat() if event.end_time else None,
        "cover_image_url": event.cover_image_path,
        "location": event.location,
        "contact_info": event.contact_info,
        "visibility": event.visibility,
    }

    # Meeting link sadece partner ve üstüne gösterilir
    if current_user.role != "GUEST":
        data["meeting_link"] = event.meeting_link
    else:
        data["meeting_link"] = None

    return data
```

---

## ✅ Kabul Kriterleri

- [ ] `GET /events/calendar?year=2025&month=6` ilgili ay için etkinlik listesi döndürüyor
- [ ] GUEST için `meeting_link` `null` geliyor; PARTNER için görünüyor
- [ ] Görsel yükleme: JPEG/PNG upload edilince `.webp` olarak kaydediliyor
- [ ] 5MB'dan büyük dosya yüklenince 422 hatası geliyor
- [ ] `GET /events/{id}/add-to-calendar` `.ics` dosyası indiriyor ve mail gönderiliyor
- [ ] `POST /events/{id}/publish?notify_partners=true` tüm aktif partnerlere mail gönderiyor
- [ ] Etkinlik silindikten sonra kapak görseli disk'ten de kaldırılıyor

---

## 📝 Junior Developer Notları

> **Neden `Form(...)` ve `File(...)` birlikte?** Görsel yükleme için `multipart/form-data` content type kullanılır. `JSON` body ile dosya gönderilemez. `Form(...)` diğer alanları, `File(...)` dosyayı alır.
>
> **`.ics` nedir?** iCalendar formatı (RFC 5545). iPhone, Android, Google Calendar, Outlook tarafından tanınır. `.ics` dosyası açılınca takvime ekleme ekranı açılır.
>
> **`notify_partners` neden query param?** Admin bazen sadece etkinliği yayınlamak, bazen yayınlayıp bildirmek isteyebilir. Bu parametre seçim sunar.
>
> **Toplu mail background task neden?** 100+ partnere mail göndermek saniyeler alabilir. `BackgroundTasks` ile bu işlem response'u bekletmeden arka planda çalışır.

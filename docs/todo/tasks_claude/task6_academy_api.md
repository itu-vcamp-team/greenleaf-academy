# Task 6: Akademi API ve İçerik Yönetimi

## 🎯 Hedef
Akademi içeriklerinin (Shorts + Masterclass) yönetimi, sıralama mantığı, prerequisite (kilit açma) sistemi, PostgreSQL tam metin araması ve guest için kilitli içerik önizlemesi endpoint'lerini yazmak.

## ⚠️ Ön Koşullar
- Task 1-3 tamamlanmış, `AcademyContent` modeli DB'de hazır
- Auth sistemi (Task 4) çalışıyor: `get_current_admin`, `get_current_partner` dependency'leri hazır
- Tenant middleware aktif

---

## 🧠 Akademi Mantığına Genel Bakış

```
Akademi
├── Shorts (kısa dikey videolar - 2-3 dk)
│     ├── Node 1 (order=1, prerequisite=None)  → Kilit Açık
│     ├── Node 2 (order=2, prerequisite=Node1)  → Node1 tamamlanınca açılır
│     └── Node 3 (order=3, prerequisite=Node2)  → Node2 tamamlanınca açılır
└── Masterclass (uzun format eğitimler)
      ├── Node 1 (order=1)  → Kilit Açık
      └── Node 2 (order=2, prerequisite=Node1)

Misafir (GUEST):
  → Tüm içeriklerin başlık+açıklamasını görebilir
  → Video embed ve resource link GÖRÜNMEZ (blur/lock UI)

Partner:
  → Tüm içeriklere erişim
  → İlerleme takibi
```

---

## 📄 Adım 1: `src/datalayer/repository/academy_repository.py`

```python
import uuid
from typing import Optional, List
from sqlmodel import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from src.datalayer.model.db import AcademyContent, ContentType, ContentStatus, UserProgress
from src.datalayer.repository.base_repository import TenantRepository


class AcademyRepository(TenantRepository[AcademyContent]):
    model = AcademyContent

    async def get_contents_by_type(
        self,
        content_type: ContentType,
        locale: str,
        include_draft: bool = False,
    ) -> List[AcademyContent]:
        """
        Belirli tip ve dil için tüm içerikleri ORDER ile döner.
        include_draft=False ise sadece PUBLISHED içerikler gelir.
        """
        query = (
            select(AcademyContent)
            .where(
                AcademyContent.tenant_id == self.tenant_id,
                AcademyContent.type == content_type,
                AcademyContent.locale == locale,
            )
            .order_by(AcademyContent.order.asc())
        )
        if not include_draft:
            query = query.where(AcademyContent.status == ContentStatus.PUBLISHED)

        result = await self.session.execute(query)
        return result.scalars().all()

    async def search_contents(
        self,
        query_text: str,
        locale: str,
        content_type: Optional[ContentType] = None,
    ) -> List[AcademyContent]:
        """
        PostgreSQL ILIKE ile başlık ve açıklamada arama yapar.
        (Full-text search alternatif olarak ILIKE yeterlidir bu ölçekte.)
        """
        search_pattern = f"%{query_text}%"
        stmt = (
            select(AcademyContent)
            .where(
                AcademyContent.tenant_id == self.tenant_id,
                AcademyContent.locale == locale,
                AcademyContent.status == ContentStatus.PUBLISHED,
                or_(
                    AcademyContent.title.ilike(search_pattern),
                    AcademyContent.description.ilike(search_pattern),
                ),
            )
            .order_by(AcademyContent.order.asc())
            .limit(20)
        )
        if content_type:
            stmt = stmt.where(AcademyContent.type == content_type)

        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def reorder_contents(
        self, ordered_ids: List[uuid.UUID]
    ) -> None:
        """
        Admin'in sürükle-bırak ile değiştirdiği sıralamayı günceller.
        ordered_ids: [uuid1, uuid2, uuid3, ...] (yeni sıralamaya göre)
        """
        for index, content_id in enumerate(ordered_ids):
            result = await self.session.execute(
                select(AcademyContent).where(
                    AcademyContent.id == content_id,
                    AcademyContent.tenant_id == self.tenant_id,
                )
            )
            content = result.scalar_one_or_none()
            if content:
                content.order = index + 1
        # session.commit() çağrısı route'da yapılır


    async def get_user_accessible_contents(
        self,
        content_type: ContentType,
        locale: str,
        user_id: uuid.UUID,
    ) -> List[dict]:
        """
        Kullanıcının erişebileceği içerikleri ve kilit durumlarını döner.
        Her içerik için 'is_locked' ve 'progress' bilgisi eklenir.
        """
        contents = await self.get_contents_by_type(content_type, locale)

        # UserProgress kayıtlarını tek sorguda çek
        progress_result = await self.session.execute(
            select(UserProgress).where(
                UserProgress.user_id == user_id,
                UserProgress.content_id.in_([c.id for c in contents]),
            )
        )
        progress_map = {str(p.content_id): p for p in progress_result.scalars().all()}

        result = []
        for content in contents:
            progress = progress_map.get(str(content.id))
            is_locked = False

            # Prerequisite kontrolü
            if content.prerequisite_id:
                prereq_progress = progress_map.get(str(content.prerequisite_id))
                if not prereq_progress or prereq_progress.status != "completed":
                    is_locked = True

            result.append({
                "content": content,
                "is_locked": is_locked,
                "progress": progress,
            })

        return result
```

---

## 📄 Adım 2: `src/services/academy_service.py`

```python
import uuid
import re
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from src.datalayer.repository.academy_repository import AcademyRepository
from src.datalayer.model.db import AcademyContent, ContentType, ContentStatus


def extract_youtube_id(url: str) -> Optional[str]:
    """
    YouTube URL'sinden video ID'sini çıkarır.
    Desteklenen formatlar:
      - https://www.youtube.com/watch?v=VIDEO_ID
      - https://youtu.be/VIDEO_ID
      - https://www.youtube.com/embed/VIDEO_ID
    """
    patterns = [
        r"(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([a-zA-Z0-9_\-]{11})",
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


def get_youtube_thumbnail_url(video_url: str) -> Optional[str]:
    """YouTube videosunun thumbnail URL'sini döner."""
    video_id = extract_youtube_id(video_url)
    if video_id:
        return f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"
    return None


def validate_youtube_url(url: str) -> bool:
    """YouTube URL'sinin geçerli bir video ID içerdiğini doğrular."""
    return extract_youtube_id(url) is not None


def validate_drive_url(url: str) -> bool:
    """Google Drive URL'sinin geçerli görünüp görünmediğini kontrol eder."""
    return "drive.google.com" in url or "docs.google.com" in url


async def create_content(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    data: dict,
) -> AcademyContent:
    """
    Yeni akademi içeriği oluşturur.
    YouTube URL'si doğrulanır ve thumbnail otomatik set edilir.
    """
    # YouTube URL doğrulama
    if not validate_youtube_url(data["video_url"]):
        raise ValueError("Geçerli bir YouTube URL'si girin.")

    # Resource link doğrulama (verilmişse)
    if data.get("resource_link") and not validate_drive_url(data["resource_link"]):
        raise ValueError("Kaynak linki geçerli bir Google Drive linki olmalıdır.")

    # Thumbnail otomatik set et
    data["thumbnail_url"] = get_youtube_thumbnail_url(data["video_url"])

    repo = AcademyRepository(db, tenant_id)
    return await repo.create(data)
```

---

## 📄 Adım 3: `src/routes/academy.py` – Endpoint'ler

```python
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from src.datalayer.database import get_db_session
from src.utils.auth_deps import get_current_user, get_current_admin
from src.utils.tenant_deps import get_tenant_id
from src.datalayer.model.db import UserRole, AcademyContent, ContentType
from src.datalayer.repository.academy_repository import AcademyRepository
from src.services.academy_service import create_content

router = APIRouter(prefix="/academy", tags=["Academy"])


@router.get("/contents")
async def list_contents(
    type: ContentType,
    locale: str = Query(default="tr"),
    db: AsyncSession = Depends(get_db_session),
    tenant_id: str = Depends(get_tenant_id),
    current_user=Depends(get_current_user),
):
    """
    Belirli tip ve dil için tüm içerikleri listeler.

    - GUEST rolü: Video URL ve resource_link gizlenir, is_locked her zaman True
    - PARTNER+ rolü: Kilitli/kilitsiz bilgisi prerequisite'a göre hesaplanır
    """
    repo = AcademyRepository(db, uuid.UUID(tenant_id))
    is_guest = current_user.role == UserRole.GUEST

    if is_guest:
        # Guest: sadece metadata, video gizli
        contents = await repo.get_contents_by_type(type, locale)
        return [_to_guest_response(c) for c in contents]
    else:
        # Partner+: kilit durumu hesapla
        data = await repo.get_user_accessible_contents(type, locale, current_user.id)
        return [_to_partner_response(item) for item in data]


@router.get("/contents/search")
async def search_contents(
    q: str = Query(min_length=2, max_length=100),
    locale: str = Query(default="tr"),
    type: ContentType | None = None,
    db: AsyncSession = Depends(get_db_session),
    tenant_id: str = Depends(get_tenant_id),
    current_user=Depends(get_current_user),
):
    """
    Başlık ve açıklamada metin araması yapar.
    Minimum 2 karakter gerektirir.
    """
    repo = AcademyRepository(db, uuid.UUID(tenant_id))
    results = await repo.search_contents(q, locale, type)
    is_guest = current_user.role == UserRole.GUEST
    if is_guest:
        return [_to_guest_response(c) for c in results]
    return results


@router.get("/contents/{content_id}")
async def get_content(
    content_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    tenant_id: str = Depends(get_tenant_id),
    current_user=Depends(get_current_user),
):
    """
    Tek içerik detayını döner.
    GUEST için video URL gizlenir.
    PARTNER için prerequisite'e göre erişim kontrolü yapılır.
    """
    repo = AcademyRepository(db, uuid.UUID(tenant_id))
    content = await repo.get_by_id(content_id)
    if not content:
        raise HTTPException(status_code=404, detail="İçerik bulunamadı.")

    if current_user.role == UserRole.GUEST:
        return _to_guest_response(content)

    # Prerequisite kontrolü
    if content.prerequisite_id:
        from src.datalayer.model.db import UserProgress
        from sqlmodel import select
        prog = await db.execute(
            select(UserProgress).where(
                UserProgress.user_id == current_user.id,
                UserProgress.content_id == content.prerequisite_id,
                UserProgress.status == "completed",
            )
        )
        if not prog.scalar_one_or_none():
            raise HTTPException(
                status_code=403,
                detail="Bu içeriğe erişmek için önce önceki içeriği tamamlamalısınız."
            )

    return content


@router.post("/contents", dependencies=[Depends(get_current_admin)])
async def create_content_endpoint(
    data: ContentCreateSchema,
    db: AsyncSession = Depends(get_db_session),
    tenant_id: str = Depends(get_tenant_id),
):
    """İçerik oluşturur. Sadece Admin/Editor erişebilir."""
    try:
        content = await create_content(db, uuid.UUID(tenant_id), data.model_dump())
        return content
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.patch("/contents/{content_id}", dependencies=[Depends(get_current_admin)])
async def update_content(
    content_id: uuid.UUID,
    data: ContentUpdateSchema,
    db: AsyncSession = Depends(get_db_session),
    tenant_id: str = Depends(get_tenant_id),
):
    """İçerik günceller. Sadece Admin/Editor."""
    repo = AcademyRepository(db, uuid.UUID(tenant_id))
    content = await repo.get_by_id(content_id)
    if not content:
        raise HTTPException(status_code=404, detail="İçerik bulunamadı.")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(content, key, value)

    # YouTube URL güncellendiyse thumbnail da güncelle
    if "video_url" in update_data:
        from src.services.academy_service import get_youtube_thumbnail_url
        content.thumbnail_url = get_youtube_thumbnail_url(content.video_url)

    return content


@router.delete("/contents/{content_id}", dependencies=[Depends(get_current_admin)])
async def delete_content(
    content_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    tenant_id: str = Depends(get_tenant_id),
):
    """İçerik siler. Sadece Admin."""
    repo = AcademyRepository(db, uuid.UUID(tenant_id))
    deleted = await repo.delete(content_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="İçerik bulunamadı.")
    return {"message": "İçerik silindi."}


@router.post("/contents/reorder", dependencies=[Depends(get_current_admin)])
async def reorder_contents(
    ordered_ids: list[uuid.UUID],
    db: AsyncSession = Depends(get_db_session),
    tenant_id: str = Depends(get_tenant_id),
):
    """
    Admin'in sürükle-bırak ile değiştirdiği sıralamayı kaydeder.
    Body: ["uuid1", "uuid2", "uuid3", ...]
    """
    repo = AcademyRepository(db, uuid.UUID(tenant_id))
    await repo.reorder_contents(ordered_ids)
    return {"message": "Sıralama güncellendi."}


# === Yardımcı Fonksiyonlar ===

def _to_guest_response(content: AcademyContent) -> dict:
    """
    Guest kullanıcılar için video URL ve resource link gizlenir.
    Sadece metadata (başlık, açıklama, thumbnail) gösterilir.
    """
    return {
        "id": str(content.id),
        "type": content.type,
        "title": content.title,
        "description": content.description,
        "thumbnail_url": content.thumbnail_url,
        "order": content.order,
        "is_new": content.is_new,
        "is_locked": True,  # Guest için her zaman kilitli
        # video_url ve resource_link intentionally omitted
    }


def _to_partner_response(item: dict) -> dict:
    content: AcademyContent = item["content"]
    progress = item["progress"]
    return {
        "id": str(content.id),
        "type": content.type,
        "title": content.title,
        "description": content.description,
        "video_url": content.video_url if not item["is_locked"] else None,
        "resource_link": content.resource_link if not item["is_locked"] else None,
        "resource_link_label": content.resource_link_label,
        "thumbnail_url": content.thumbnail_url,
        "order": content.order,
        "is_new": content.is_new,
        "is_locked": item["is_locked"],
        "progress": {
            "status": progress.status if progress else "not_started",
            "completion_percentage": progress.completion_percentage if progress else 0.0,
            "last_position_seconds": progress.last_position_seconds if progress else None,
        } if not item["is_locked"] else None,
    }
```

---

## 📄 Adım 4: DTO Şemaları (`src/datalayer/model/dto/academy_schemas.py`)

```python
from pydantic import BaseModel, HttpUrl, field_validator
from typing import Optional
from src.datalayer.model.db import ContentType, ContentStatus
import uuid


class ContentCreateSchema(BaseModel):
    type: ContentType
    locale: str
    title: str
    description: Optional[str] = None
    video_url: str
    resource_link: Optional[str] = None
    resource_link_label: Optional[str] = None
    order: int = 0
    prerequisite_id: Optional[uuid.UUID] = None
    status: ContentStatus = ContentStatus.DRAFT


class ContentUpdateSchema(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    video_url: Optional[str] = None
    resource_link: Optional[str] = None
    resource_link_label: Optional[str] = None
    order: Optional[int] = None
    prerequisite_id: Optional[uuid.UUID] = None
    status: Optional[ContentStatus] = None
    is_new: Optional[bool] = None
```

---

## ✅ Kabul Kriterleri

- [ ] `GET /academy/contents?type=SHORT&locale=tr` partner için kilit durumlarıyla liste döndürüyor
- [ ] Guest kullanıcı için `video_url` ve `resource_link` `null` geliyor
- [ ] `GET /academy/contents/search?q=ikna` başlık/açıklamada eşleşen içerikleri döndürüyor
- [ ] Prerequisite tamamlanmayan içeriğe partner erişince 403 geliyor
- [ ] Admin `POST /academy/contents` ile içerik oluşturabiliyor
- [ ] Geçersiz YouTube URL'si girilince 422 hatası geliyor
- [ ] `POST /academy/contents/reorder` sıralamayı güncelliyor
- [ ] `thumbnail_url` YouTube URL'sinden otomatik hesaplanıyor

---

## 📝 Junior Developer Notları

> **`is_locked` nasıl hesaplanır?** Her içeriğin `prerequisite_id` alanı var. Eğer bu alan doluysa, o içeriğe erişmek için `prerequisite_id`'e karşılık gelen içeriğin `UserProgress.status == "completed"` olması gerekiyor. Yoksa `is_locked = True`.
>
> **ILIKE vs Full-Text Search:** PostgreSQL'in `to_tsvector` / `plainto_tsquery` full-text search'ü Türkçe için daha iyi sonuç verir. Ancak basit ILIKE bu ölçek için yeterlidir. İleride `AcademyContent.title` ve `description` üzerine GIN index eklenebilir.
>
> **`resource_link` neden Google Drive?** PDF dosyası sunucuya yüklenmiyor. Sadece Google Drive linki giriliyor. İndirme yoktur, sadece görüntüleme. `resource_link_label` alanı buton metnini belirler (örn: "Sunum Dosyasını Görüntüle").

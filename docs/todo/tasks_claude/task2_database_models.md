# Task 2: Veritabanı Modelleri ve Migration

## 🎯 Hedef
SQLModel kullanarak tüm veritabanı tablolarını `backend/src/datalayer/model/db/` altında tanımlamak, Alembic ile migration sistemini kurmak ve ilk `initial` migration dosyasını oluşturmak.

## ⚠️ Ön Koşullar
- Task 1 tamamlanmış, `datalayer/database.py` hazır olmalı
- `docker-compose up` ile Postgres ayakta olmalı

---

## 🧠 Modellere Genel Bakış

Aşağıdaki tablolar oluşturulacak (bağımlılık sırasına göre):

```
Tenant
  └─► User (tenant_id FK)
        └─► ReferenceCode (created_by FK)
        └─► UserSession (user_id FK)
        └─► UserProgress (user_id FK)
        └─► Favorite (user_id FK)
  └─► AcademyContent (tenant_id FK)
        └─► UserProgress (content_id FK)
        └─► Favorite (content_id FK)
  └─► Event (tenant_id FK)
  └─► Announcement (tenant_id FK)
  └─► ResourceLink (tenant_id FK)
  └─► Waitlist (tenant_id FK)
  └─► AuditLog (actor_id FK)
```

---

## 📄 Adım 1: `src/datalayer/model/db/base.py` – Temel Model

Tüm modeller bu base sınıfını miras alır:

```python
import uuid
from datetime import datetime, timezone
from sqlmodel import Field, SQLModel


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class BaseModel(SQLModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)
```

---

## 📄 Adım 2: `src/datalayer/model/db/tenant.py` – Tenant Modeli

```python
from typing import Optional
from sqlmodel import Field, Column
from sqlalchemy import JSON
from src.datalayer.model.db.base import BaseModel


class Tenant(BaseModel, table=True):
    __tablename__ = "tenants"

    slug: str = Field(unique=True, index=True, max_length=10)
    # Örnek slug değerleri: "tr", "de", "fr"

    name: str = Field(max_length=100)
    # Örnek: "Greenleaf Türkiye"

    is_active: bool = Field(default=True)

    config: Optional[dict] = Field(default={}, sa_column=Column(JSON))
    # config içeriği:
    # {
    #   "logo_url": "/uploads/tenants/tr/logo.webp",
    #   "primary_color": "#2D6A4F",     # HEX renk kodu
    #   "secondary_color": "#74C69D",
    #   "support_links": {
    #     "whatsapp": "https://wa.me/...",
    #     "telegram": "https://t.me/..."
    #   },
    #   "social_media": {
    #     "instagram": "https://instagram.com/...",
    #     "youtube": "https://youtube.com/..."
    #   }
    # }
```

---

## 📄 Adım 3: `src/datalayer/model/db/user.py` – Kullanıcı Modeli

```python
import uuid
from typing import Optional
from enum import Enum
from sqlmodel import Field
from src.datalayer.model.db.base import BaseModel


class UserRole(str, Enum):
    SUPERADMIN = "SUPERADMIN"
    ADMIN = "ADMIN"
    EDITOR = "EDITOR"
    PARTNER = "PARTNER"
    GUEST = "GUEST"


class User(BaseModel, table=True):
    __tablename__ = "users"

    tenant_id: uuid.UUID = Field(foreign_key="tenants.id", index=True)
    # Hangi tenant'a (bölgeye) ait olduğu

    role: UserRole = Field(default=UserRole.GUEST)

    username: str = Field(unique=True, index=True, max_length=50)
    # Kullanıcı adı (giriş için kullanılır)

    email: str = Field(unique=True, index=True, max_length=255)

    password_hash: str = Field(max_length=255)
    # bcrypt ile hashlenmiş şifre

    full_name: str = Field(max_length=150)

    phone: Optional[str] = Field(default=None, max_length=20)

    partner_id: Optional[str] = Field(default=None, max_length=50, index=True)
    # Greenleaf Global'daki partner numarası. Admin onaylandıktan sonra atanır.

    inviter_id: Optional[uuid.UUID] = Field(default=None, foreign_key="users.id")
    # Bu kullanıcıyı davet eden partner'ın user.id'si (parent-child ilişkisi)

    is_verified: bool = Field(default=False)
    # E-posta doğrulaması yapıldı mı?

    is_active: bool = Field(default=False)
    # Admin onayı sonrası True olur. Pasif partnerlar False olarak işaretlenir.

    profile_image_path: Optional[str] = Field(default=None, max_length=500)
    # Render disk'e kaydedilen WebP görselin yolu. Örn: "/uploads/profiles/uuid.webp"

    last_2fa_at: Optional[datetime] = Field(default=None)
    # En son aylık e-posta 2FA doğrulamasının zamanı

    supervisor_note: Optional[str] = Field(default=None, max_length=500)
    # "Partner ID yok" diyen kullanıcıların yazdığı supervisor bilgisi
    # Admin onay ekranında görünür

    consent_given_at: Optional[datetime] = Field(default=None)
    # KVKK/GDPR metninin onaylandığı tarih/saat

    consent_ip: Optional[str] = Field(default=None, max_length=45)
    # Onay verilen IP adresi (KVKK için saklanır)

    last_login_at: Optional[datetime] = Field(default=None)

    # GDPR: 1 yıl hareketsiz GUEST hesapları için
    last_active_at: Optional[datetime] = Field(default=None)
```

---

## 📄 Adım 4: `src/datalayer/model/db/reference_code.py` – Referans Kodu

```python
import uuid
from typing import Optional
from datetime import datetime
from sqlmodel import Field
from src.datalayer.model.db.base import BaseModel


class ReferenceCode(BaseModel, table=True):
    __tablename__ = "reference_codes"

    tenant_id: uuid.UUID = Field(foreign_key="tenants.id", index=True)

    code: str = Field(unique=True, index=True, max_length=20)
    # Admin'in oluşturduğu tek seferlik davetiye kodu. Örn: "GL-TR-A7X2"

    created_by: uuid.UUID = Field(foreign_key="users.id")
    # Kodu oluşturan partnerin user.id'si

    is_used: bool = Field(default=False)
    # Kullanıldı mı? True olduktan sonra bir daha kullanılamaz.

    used_by: Optional[uuid.UUID] = Field(default=None, foreign_key="users.id")
    # Kodu kullanan kullanıcının user.id'si

    used_at: Optional[datetime] = Field(default=None)

    expires_at: Optional[datetime] = Field(default=None)
    # None ise süresiz geçerli. Belirli bir tarihe kadar geçerli olmasını istersen doldur.
```

---

## 📄 Adım 5: `src/datalayer/model/db/user_session.py` – Oturum Tablosu

Kick-out mekanizması için her aktif oturum burada takip edilir.

```python
import uuid
from typing import Optional
from datetime import datetime
from sqlmodel import Field
from src.datalayer.model.db.base import BaseModel


class UserSession(BaseModel, table=True):
    __tablename__ = "user_sessions"

    user_id: uuid.UUID = Field(foreign_key="users.id", index=True)

    token_jti: str = Field(unique=True, index=True, max_length=100)
    # JWT'nin "jti" (JWT ID) claim'i. Her token için benzersiz ID.

    is_active: bool = Field(default=True)
    # Yeni bir oturum açıldığında eski oturumun is_active'i False yapılır (kick-out).

    device_info: Optional[str] = Field(default=None, max_length=300)
    # Kullanıcının cihaz bilgisi (user-agent). Opsiyonel, bilgi amaçlı.

    ip_address: Optional[str] = Field(default=None, max_length=45)

    expires_at: datetime = Field()
    # Token'ın geçerlilik süresi. Bu tarih geçtikten sonra oturum zaten geçersizdir.

    last_used_at: Optional[datetime] = Field(default=None)
    # Her istek geldiğinde güncellenir (Redis ile daha verimli yapılabilir).
```

---

## 📄 Adım 6: `src/datalayer/model/db/academy_content.py` – Akademi İçerikleri

```python
import uuid
from typing import Optional
from enum import Enum
from sqlmodel import Field
from src.datalayer.model.db.base import BaseModel


class ContentType(str, Enum):
    SHORT = "SHORT"        # Kısa dikey format video (eski adı: Reels)
    MASTERCLASS = "MASTERCLASS"  # Uzun format eğitim videosu


class ContentStatus(str, Enum):
    PUBLISHED = "PUBLISHED"  # Yayında; partner ve editor görebilir
    DRAFT = "DRAFT"          # Taslak; sadece admin/editor görebilir


class AcademyContent(BaseModel, table=True):
    __tablename__ = "academy_contents"

    tenant_id: uuid.UUID = Field(foreign_key="tenants.id", index=True)

    type: ContentType

    locale: str = Field(max_length=5, index=True)
    # Dil kodu. Örn: "tr", "en", "de"

    title: str = Field(max_length=200)

    description: Optional[str] = Field(default=None, max_length=2000)

    video_url: str = Field(max_length=500)
    # YouTube "liste dışı" video URL'si. Örn: "https://youtube.com/watch?v=abc123"

    resource_link: Optional[str] = Field(default=None, max_length=500)
    # Google Drive döküman linki (PDF, sunum vb.). Sadece görüntüleme, indirme yok.
    # NOT: Eski "pdf_url" alanı bu isimle değiştirildi.

    resource_link_label: Optional[str] = Field(default=None, max_length=100)
    # Buton etiketi. Örn: "Sunum Dosyasını Görüntüle", "Teknik Detaylar"

    order: int = Field(default=0, index=True)
    # Aynı tenant + locale + type içindeki sıralama. Admin sürükle-bırak ile değiştirir.

    status: ContentStatus = Field(default=ContentStatus.DRAFT)

    prerequisite_id: Optional[uuid.UUID] = Field(default=None, foreign_key="academy_contents.id")
    # Bu içeriğin kilidini açmak için önce hangi içeriğin tamamlanması gerektiği.
    # None ise kilitsiz (ilk içerikler genellikle None olur).

    is_new: bool = Field(default=True)
    # İçerik ilk eklendiğinde True. Admin "NEW" etiketini kaldırabilir.

    thumbnail_url: Optional[str] = Field(default=None, max_length=500)
    # YouTube otomatik thumbnail URL'si. Embed'den çekilir.
    # Örn: https://img.youtube.com/vi/{video_id}/hqdefault.jpg
```

---

## 📄 Adım 7: `src/datalayer/model/db/user_progress.py` – İlerleme Takibi

```python
import uuid
from typing import Optional
from datetime import datetime
from sqlmodel import Field, UniqueConstraint
from src.datalayer.model.db.base import BaseModel


class UserProgress(BaseModel, table=True):
    __tablename__ = "user_progress"
    __table_args__ = (
        UniqueConstraint("user_id", "content_id", name="uq_user_content"),
    )
    # Bir kullanıcı, bir içerik için sadece bir UserProgress kaydına sahip olabilir.

    user_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    content_id: uuid.UUID = Field(foreign_key="academy_contents.id", index=True)

    status: str = Field(default="not_started", max_length=20)
    # "not_started" | "in_progress" | "completed"
    # Partner bu değeri manuel olarak değiştirir (backend endpoint'i ile).

    completion_percentage: float = Field(default=0.0)
    # 0.0 - 100.0 arası. YouTube IFrame API'den gelen izlenme yüzdesi.
    # Kullanıcı ileri sardıysa maksimum değer güncellenir.

    last_watched_at: Optional[datetime] = Field(default=None)
    # En son videoyu izlediği tarih/saat.

    last_position_seconds: Optional[float] = Field(default=None)
    # Videonun en son kaldığı saniye. "Kaldığın yerden devam et" için kullanılır.

    completed_at: Optional[datetime] = Field(default=None)
    # status "completed" olduğunda otomatik set edilir.
```

---

## 📄 Adım 8: `src/datalayer/model/db/favorite.py` – Favoriler

```python
import uuid
from sqlmodel import Field, UniqueConstraint
from src.datalayer.model.db.base import BaseModel


class Favorite(BaseModel, table=True):
    __tablename__ = "favorites"
    __table_args__ = (
        UniqueConstraint("user_id", "content_id", name="uq_user_favorite"),
    )

    user_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    content_id: uuid.UUID = Field(foreign_key="academy_contents.id", index=True)
```

---

## 📄 Adım 9: `src/datalayer/model/db/event.py` – Takvim Etkinlikleri

```python
import uuid
from typing import Optional
from datetime import datetime
from enum import Enum
from sqlmodel import Field
from src.datalayer.model.db.base import BaseModel


class EventCategory(str, Enum):
    WEBINAR = "WEBINAR"
    TRAINING = "TRAINING"
    CORPORATE = "CORPORATE"
    MEETUP = "MEETUP"


class EventVisibility(str, Enum):
    ALL = "ALL"          # Misafirler de görebilir
    PARTNER_ONLY = "PARTNER_ONLY"  # Sadece partnerler görebilir


class Event(BaseModel, table=True):
    __tablename__ = "events"

    tenant_id: uuid.UUID = Field(foreign_key="tenants.id", index=True)

    title: str = Field(max_length=200)
    description: Optional[str] = Field(default=None, max_length=3000)

    category: EventCategory

    start_time: datetime = Field(index=True)
    end_time: Optional[datetime] = Field(default=None)

    meeting_link: Optional[str] = Field(default=None, max_length=500)
    # Zoom, Google Meet, Teams vb. bağlantı linki.
    # Sadece partner rolündeki kullanıcılara gösterilir.

    location: Optional[str] = Field(default=None, max_length=300)
    # Fiziksel etkinlik adresi. Örn: "Levent, İstanbul / XYZ Ofis"

    cover_image_path: Optional[str] = Field(default=None, max_length=500)
    # Render disk'e kaydedilen WebP kapak görseli yolu.

    contact_info: Optional[str] = Field(default=None, max_length=500)
    # Davetiye için iletişim notu. Örn: "Detaylar için: info@greenleaf.com"

    visibility: EventVisibility = Field(default=EventVisibility.PARTNER_ONLY)
    # Admin tarafından kontrol edilir.

    is_published: bool = Field(default=False)
    # False iken sadece admin panelinde görünür.
```

---

## 📄 Adım 10: `src/datalayer/model/db/announcement.py` – Duyurular

```python
import uuid
from typing import Optional
from sqlmodel import Field
from src.datalayer.model.db.base import BaseModel


class Announcement(BaseModel, table=True):
    __tablename__ = "announcements"

    tenant_id: uuid.UUID = Field(foreign_key="tenants.id", index=True)

    title: str = Field(max_length=200)
    body: str = Field(max_length=5000)
    # Duyuru içeriği (plain text veya basit markdown)

    is_active: bool = Field(default=True)
    # False yapılınca anasayfada gösterilmez.

    created_by: uuid.UUID = Field(foreign_key="users.id")
    # Duyuruyu oluşturan admin'in user.id'si

    pinned: bool = Field(default=False)
    # True ise listenin en üstünde sabitlenir.
```

---

## 📄 Adım 11: `src/datalayer/model/db/resource_link.py` – Kaynak Merkezi

```python
import uuid
from typing import Optional
from sqlmodel import Field
from src.datalayer.model.db.base import BaseModel


class ResourceLink(BaseModel, table=True):
    __tablename__ = "resource_links"
    # "Kaynak Merkezi" sayfası için admin tarafından eklenen döküman/kaynak linkleri.

    tenant_id: uuid.UUID = Field(foreign_key="tenants.id", index=True)

    title: str = Field(max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)

    url: str = Field(max_length=500)
    # Google Drive dosya linki veya başka bir harici link

    category: Optional[str] = Field(default=None, max_length=100)
    # Opsiyonel kategori. Örn: "Sunum Dosyaları", "Eğitim Materyalleri"

    order: int = Field(default=0)
    is_active: bool = Field(default=True)

    created_by: uuid.UUID = Field(foreign_key="users.id")
```

---

## 📄 Adım 12: `src/datalayer/model/db/waitlist.py` – Bekleme Listesi

```python
import uuid
from typing import Optional
from sqlmodel import Field
from src.datalayer.model.db.base import BaseModel


class Waitlist(BaseModel, table=True):
    __tablename__ = "waitlist"
    # Referans kodu olmayan misafirlerin başvuru formu.
    # Admin bu kişileri görür ve onaylayarak kayıt sürecini başlatabilir.

    tenant_id: uuid.UUID = Field(foreign_key="tenants.id", index=True)

    full_name: str = Field(max_length=150)
    email: str = Field(max_length=255, index=True)
    phone: Optional[str] = Field(default=None, max_length=20)

    supervisor_name: Optional[str] = Field(default=None, max_length=150)
    # Başvurucunun belirttiği supervisor/partner adı

    message: Optional[str] = Field(default=None, max_length=1000)
    # Ek not

    is_processed: bool = Field(default=False)
    # Admin inceledi mi? True ise artık aktif kuyruktan çıkmış kabul edilir.

    processed_by: Optional[uuid.UUID] = Field(default=None, foreign_key="users.id")
```

---

## 📄 Adım 13: `src/datalayer/model/db/audit_log.py` – Denetim Günlüğü

```python
import uuid
from typing import Optional
from sqlmodel import Field, Column
from sqlalchemy import JSON
from src.datalayer.model.db.base import BaseModel


class AuditLog(BaseModel, table=True):
    __tablename__ = "audit_logs"
    # Kritik admin işlemleri burada kayıt altına alınır.
    # Örnek eylemler: "user.role_changed", "content.deleted", "partner.approved"

    actor_id: Optional[uuid.UUID] = Field(default=None, foreign_key="users.id", index=True)
    # İşlemi yapan kişinin user.id'si. Sistem işlemlerinde None olabilir.

    action: str = Field(max_length=100, index=True)
    # Eylem adı. Örn: "partner.approved", "content.created", "event.published"

    entity_type: str = Field(max_length=50)
    # Etkilenen varlık türü. Örn: "User", "AcademyContent", "Event"

    entity_id: Optional[str] = Field(default=None, max_length=100)
    # Etkilenen varlığın ID'si (string olarak saklanır)

    metadata: Optional[dict] = Field(default={}, sa_column=Column(JSON))
    # Ek bilgiler. Örn: {"old_role": "GUEST", "new_role": "PARTNER"}

    ip_address: Optional[str] = Field(default=None, max_length=45)
    tenant_id: Optional[uuid.UUID] = Field(default=None, foreign_key="tenants.id")
```

---

## 🔧 Adım 14: Modelleri `__init__.py` ile Dışa Aktar

`src/datalayer/model/db/__init__.py` dosyasına tüm modelleri ekle:

```python
from .base import BaseModel
from .tenant import Tenant
from .user import User, UserRole
from .reference_code import ReferenceCode
from .user_session import UserSession
from .academy_content import AcademyContent, ContentType, ContentStatus
from .user_progress import UserProgress
from .favorite import Favorite
from .event import Event, EventCategory, EventVisibility
from .announcement import Announcement
from .resource_link import ResourceLink
from .waitlist import Waitlist
from .audit_log import AuditLog

__all__ = [
    "BaseModel", "Tenant", "User", "UserRole", "ReferenceCode",
    "UserSession", "AcademyContent", "ContentType", "ContentStatus",
    "UserProgress", "Favorite", "Event", "EventCategory", "EventVisibility",
    "Announcement", "ResourceLink", "Waitlist", "AuditLog"
]
```

---

## 🗃️ Adım 15: Alembic Kurulumu ve İlk Migration

```bash
# backend/ dizininde çalıştır
alembic init alembic

# alembic/env.py dosyasını düzenle:
# - target_metadata = SQLModel.metadata  satırını ekle
# - Async engine import et
# Tüm DB modellerini import etmeyi unutma! 
# (Alembic model sınıflarını görüyor olmalı)

# İlk migration'ı oluştur
alembic revision --autogenerate -m "initial_schema"

# Migration'ı uygula
alembic upgrade head
```

**`alembic/env.py`'de yapılacak kritik değişiklikler:**

```python
# env.py dosyasının üstüne ekle:
import asyncio
from sqlmodel import SQLModel
from src.config import get_settings

# TÜM modelleri import et (Alembic'in görmesi için şart):
from src.datalayer.model.db import (
    Tenant, User, ReferenceCode, UserSession, AcademyContent,
    UserProgress, Favorite, Event, Announcement, ResourceLink,
    Waitlist, AuditLog
)

settings = get_settings()
target_metadata = SQLModel.metadata
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
```

---

## ✅ Kabul Kriterleri

- [ ] `alembic upgrade head` komutu hatasız çalışıyor
- [ ] Tüm tablolar PostgreSQL'de oluşturulmuş (`\dt` ile kontrol et)
- [ ] Her tablonun `id`, `created_at`, `updated_at` alanları var
- [ ] `user_progress` tablosunda `(user_id, content_id)` unique constraint var
- [ ] `favorites` tablosunda `(user_id, content_id)` unique constraint var
- [ ] Tüm foreign key'ler doğru tablolara işaret ediyor
- [ ] `resource_link`, `announcement`, `waitlist`, `user_session` tabloları mevcut

---

## 📝 Junior Developer Notları

> **Neden `Announcement` ayrı tablo?** Ana sayfada admin'in yönetebileceği duyurular bulunmalı. Bunlar bölgesel (tenant bazlı), bu yüzden ayrı model gerekti.
>
> **Neden `ResourceLink`?** Kaynak merkezi sayfası için admin, Google Drive linklerini buradan yönetir. "Bütün drive linklerini tek yerden yönetmek" bu sayede mümkün olur.
>
> **Neden `UserSession`?** Kick-out mekanizması için: yeni cihazdan giriş yapıldığında eski `UserSession` kaydının `is_active` değeri `False` yapılır ve mevcut JWT geçersiz sayılır.
>
> **`prerequisite_id` ne işe yarar?** İçerik kilitli mantığı için. Örnek: "İkna Teknikleri" videosunu izlemeden "İleri Satış" videosunu açamaz. `prerequisite_id` -> "İkna Teknikleri" içeriğinin ID'si.
>
> **`resource_link` vs `pdf_url`:** Eski tasarımda `pdf_url` vardı. Projenin kararına göre PDF dosyası yüklenmeyecek, sadece Google Drive linki verilecek. Bu yüzden `resource_link` ve `resource_link_label` olarak güncellendi.

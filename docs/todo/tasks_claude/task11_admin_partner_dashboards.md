# Task 11: Yönetim Panelleri (Admin, Partner, SuperAdmin)

## 🎯 Hedef
Partner dashboard'u (aday takibi + ilerleme), Admin paneli (kullanıcı yönetimi, içerik, etkinlik, duyuru, kaynak merkezi, waitlist), ve temel SuperAdmin tenant yönetimi ekranlarını oluşturmak.

## ⚠️ Ön Koşullar
- Task 4 (Auth), Task 6 (Akademi API), Task 8 (Etkinlik API) tamamlanmış olmalı
- `Announcement`, `ResourceLink`, `Waitlist` modelleri DB'de hazır (Task 2)

---

## 🧠 Panel Yapısına Genel Bakış

```
Partner Dashboard:
  → Davet ettiği kişilerin listesi (children)
  → Her birinin akademi ilerleme yüzdesi
  → Tek kullanımlık referans kodu üretme butonu
  → Kendi akademi ilerleme barı

Admin Panel:
  → Bekleyen onay istekleri (yeni partnerler)
  → Waitlist başvuruları
  → İçerik yönetimi (shorts + masterclass CRUD + sıralama)
  → Etkinlik yönetimi (oluştur, yayınla, duyur)
  → Duyuru yönetimi
  → Kaynak merkezi (drive linkleri)
  → Basit istatistikler (toplam partner, tamamlama oranları)

SuperAdmin:
  → Tenant listesi
  → Yeni tenant oluşturma (Faz 1'de manuel rehber + minimal UI)
```

---

## 📄 Adım 1: Backend – Referans Kodu Endpoint'leri (`src/routes/reference_codes.py`)

```python
import uuid
import secrets
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, func
from src.datalayer.database import get_db_session
from src.utils.auth_deps import get_current_partner
from src.utils.tenant_deps import get_tenant_id
from src.datalayer.model.db import ReferenceCode, User

router = APIRouter(prefix="/reference-codes", tags=["Reference Codes"])


@router.post("/generate")
async def generate_reference_code(
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_partner),
    tenant_id: str = Depends(get_tenant_id),
):
    """
    Partner tek seferlik bir referans kodu oluşturur.
    Bu kod ile misafir kayıt olabilir ve partner'ın child'ı olur.
    
    Kod formatı: GL-[TENANT_SLUG_BÜYÜK]-[6 karakter alfanümerik]
    Örn: GL-TR-A7X2K9
    """
    # Benzersiz kod üret (çakışma ihtimaline karşı döngü)
    tenant_slug = tenant_id[:2].upper()  # Basit yaklaşım; gerçekte tenant slug kullanılmalı
    for _ in range(5):  # Maksimum 5 deneme
        code = f"GL-{tenant_slug}-{secrets.token_urlsafe(4).upper()[:6]}"
        existing = await db.execute(
            select(ReferenceCode).where(ReferenceCode.code == code)
        )
        if not existing.scalar_one_or_none():
            break
    else:
        raise HTTPException(status_code=500, detail="Kod üretilemedi, tekrar deneyin.")

    ref_code = ReferenceCode(
        tenant_id=uuid.UUID(tenant_id),
        code=code,
        created_by=current_user.id,
        is_used=False,
    )
    db.add(ref_code)
    await db.flush()

    return {"code": code, "expires_at": None}


@router.get("/my-codes")
async def get_my_reference_codes(
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_partner),
):
    """Partnerin oluşturduğu kodların listesi (kullanılmış/kullanılmamış)."""
    result = await db.execute(
        select(ReferenceCode)
        .where(ReferenceCode.created_by == current_user.id)
        .order_by(ReferenceCode.created_at.desc())
        .limit(20)
    )
    return result.scalars().all()
```

---

## 📄 Adım 2: Backend – Admin Kullanıcı Yönetimi (`src/routes/admin_users.py`)

```python
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from src.datalayer.database import get_db_session
from src.utils.auth_deps import get_current_admin
from src.utils.tenant_deps import get_tenant_id
from src.datalayer.model.db import User, UserRole

router = APIRouter(prefix="/admin/users", tags=["Admin – Users"])


@router.get("/pending")
async def get_pending_users(
    db: AsyncSession = Depends(get_db_session),
    tenant_id: str = Depends(get_tenant_id),
    _=Depends(get_current_admin),
):
    """
    Admin onayı bekleyen kullanıcıları listeler.
    is_verified=True (emaili doğruladı) ama is_active=False (admin onayı yok).
    """
    result = await db.execute(
        select(User).where(
            User.tenant_id == uuid.UUID(tenant_id),
            User.is_verified == True,
            User.is_active == False,
            User.role == UserRole.GUEST,
        ).order_by(User.created_at.asc())
    )
    return result.scalars().all()


@router.post("/{user_id}/approve")
async def approve_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    tenant_id: str = Depends(get_tenant_id),
    background_tasks: BackgroundTasks = None,
    _=Depends(get_current_admin),
):
    """
    Kullanıcıyı partner olarak onaylar.
    1. is_active=True yapılır
    2. role=PARTNER yapılır
    3. partner_id atanır (tenant slug + kısa ID)
    4. Hoşgeldin maili gönderilir
    5. AuditLog kaydı oluşturulur
    """
    result = await db.execute(
        select(User).where(User.id == user_id, User.tenant_id == uuid.UUID(tenant_id))
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")

    # Partner ID üret (tenant_slug + 6 haneli random)
    import secrets
    user.is_active = True
    user.role = UserRole.PARTNER
    user.partner_id = f"GL-TR-{secrets.token_hex(3).upper()}"  # Örn: GL-TR-A1F3C2

    # Hoşgeldin maili arka planda
    if background_tasks:
        from src.services.mailing_service import send_welcome_email
        background_tasks.add_task(
            send_welcome_email,
            user.email, user.full_name, user.partner_id
        )

    return {"message": f"{user.full_name} onaylandı. Partner ID: {user.partner_id}"}


@router.post("/{user_id}/reject")
async def reject_user(
    user_id: uuid.UUID,
    reason: Optional[str] = None,
    db: AsyncSession = Depends(get_db_session),
    tenant_id: str = Depends(get_tenant_id),
    background_tasks: BackgroundTasks = None,
    _=Depends(get_current_admin),
):
    """Kullanıcıyı reddeder. Bildirim maili gönderilir."""
    result = await db.execute(
        select(User).where(User.id == user_id, User.tenant_id == uuid.UUID(tenant_id))
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")

    # Hesabı sil veya rejected durumuna al
    # Basit yaklaşım: is_verified=False yaparak tekrar aktivasyona düşür
    user.is_active = False
    user.is_verified = False

    if background_tasks:
        from src.services.mailing_service import send_account_status_email
        background_tasks.add_task(
            send_account_status_email,
            user.email, user.full_name, False, reason
        )
    return {"message": "Kullanıcı reddedildi."}


@router.get("/all")
async def list_all_users(
    db: AsyncSession = Depends(get_db_session),
    tenant_id: str = Depends(get_tenant_id),
    role: Optional[UserRole] = None,
    is_active: Optional[bool] = None,
    _=Depends(get_current_admin),
):
    """Tenant'taki tüm kullanıcıları listeler. Rol ve aktiflik filtresi."""
    query = select(User).where(User.tenant_id == uuid.UUID(tenant_id))
    if role:
        query = query.where(User.role == role)
    if is_active is not None:
        query = query.where(User.is_active == is_active)
    result = await db.execute(query.order_by(User.created_at.desc()).limit(200))
    return result.scalars().all()


@router.patch("/{user_id}/toggle-active")
async def toggle_user_active(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    tenant_id: str = Depends(get_tenant_id),
    _=Depends(get_current_admin),
):
    """Kullanıcıyı aktif/pasif yapar."""
    result = await db.execute(
        select(User).where(User.id == user_id, User.tenant_id == uuid.UUID(tenant_id))
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")
    user.is_active = not user.is_active
    return {"message": f"Kullanıcı {'aktif' if user.is_active else 'pasif'} yapıldı."}
```

---

## 📄 Adım 3: Backend – Duyuru, Kaynak Merkezi, Waitlist Endpoint'leri

### `src/routes/announcements.py`

```python
import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.datalayer.database import get_db_session
from src.utils.auth_deps import get_current_user, get_current_admin
from src.utils.tenant_deps import get_tenant_id
from src.datalayer.model.db import Announcement, User

router = APIRouter(prefix="/announcements", tags=["Announcements"])


@router.get("/")
async def list_announcements(
    db: AsyncSession = Depends(get_db_session),
    tenant_id: str = Depends(get_tenant_id),
    _=Depends(get_current_user),
):
    """Aktif duyuruları döner. Ana sayfada gösterilir. Tüm roller erişebilir."""
    result = await db.execute(
        select(Announcement)
        .where(
            Announcement.tenant_id == uuid.UUID(tenant_id),
            Announcement.is_active == True,
        )
        .order_by(Announcement.pinned.desc(), Announcement.created_at.desc())
        .limit(10)
    )
    return result.scalars().all()


@router.post("/", dependencies=[Depends(get_current_admin)])
async def create_announcement(data: AnnouncementCreateSchema,
                              db: AsyncSession = Depends(get_db_session),
                              tenant_id: str = Depends(get_tenant_id),
                              current_user: User = Depends(get_current_admin)):
    ann = Announcement(
        tenant_id=uuid.UUID(tenant_id),
        title=data.title,
        body=data.body,
        pinned=data.pinned,
        created_by=current_user.id,
    )
    db.add(ann)
    await db.flush()
    return ann


@router.patch("/{ann_id}/toggle", dependencies=[Depends(get_current_admin)])
async def toggle_announcement(ann_id: uuid.UUID,
                              db: AsyncSession = Depends(get_db_session),
                              tenant_id: str = Depends(get_tenant_id)):
    result = await db.execute(
        select(Announcement).where(
            Announcement.id == ann_id, Announcement.tenant_id == uuid.UUID(tenant_id)
        )
    )
    ann = result.scalar_one_or_none()
    if not ann:
        raise HTTPException(status_code=404)
    ann.is_active = not ann.is_active
    return {"is_active": ann.is_active}


class AnnouncementCreateSchema(BaseModel):
    title: str
    body: str
    pinned: bool = False
```

### `src/routes/resource_links.py`

```python
import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.datalayer.database import get_db_session
from src.utils.auth_deps import get_current_partner, get_current_admin
from src.utils.tenant_deps import get_tenant_id
from src.datalayer.model.db import ResourceLink, User

router = APIRouter(prefix="/resources", tags=["Resource Links"])


@router.get("/")
async def list_resources(
    db: AsyncSession = Depends(get_db_session),
    tenant_id: str = Depends(get_tenant_id),
    _=Depends(get_current_partner),
):
    """Partner ve üstü rol için kaynak merkezi linklerini döner."""
    result = await db.execute(
        select(ResourceLink)
        .where(ResourceLink.tenant_id == uuid.UUID(tenant_id), ResourceLink.is_active == True)
        .order_by(ResourceLink.order.asc())
    )
    return result.scalars().all()


@router.post("/", dependencies=[Depends(get_current_admin)])
async def create_resource(data: ResourceCreateSchema,
                          db: AsyncSession = Depends(get_db_session),
                          tenant_id: str = Depends(get_tenant_id),
                          current_user: User = Depends(get_current_admin)):
    resource = ResourceLink(
        tenant_id=uuid.UUID(tenant_id),
        title=data.title,
        description=data.description,
        url=data.url,
        category=data.category,
        order=data.order,
        created_by=current_user.id,
    )
    db.add(resource)
    await db.flush()
    return resource


class ResourceCreateSchema(BaseModel):
    title: str
    description: Optional[str] = None
    url: str
    category: Optional[str] = None
    order: int = 0
```

### `src/routes/waitlist.py`

```python
import uuid
from fastapi import APIRouter, Depends, BackgroundTasks
from pydantic import BaseModel, EmailStr
from typing import Optional
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.datalayer.database import get_db_session
from src.utils.auth_deps import get_current_admin
from src.utils.tenant_deps import get_tenant_id
from src.datalayer.model.db import Waitlist, User, UserRole

router = APIRouter(prefix="/waitlist", tags=["Waitlist"])


@router.post("/apply")
async def apply_to_waitlist(
    data: WaitlistApplySchema,
    db: AsyncSession = Depends(get_db_session),
    tenant_id: str = Depends(get_tenant_id),
    background_tasks: BackgroundTasks = None,
):
    """
    Referans kodu olmayan misafir için bekleme listesi başvurusu.
    Giriş yapılmadan erişilebilir (public endpoint).
    """
    applicant = Waitlist(
        tenant_id=uuid.UUID(tenant_id),
        full_name=data.full_name,
        email=data.email,
        phone=data.phone,
        supervisor_name=data.supervisor_name,
        message=data.message,
    )
    db.add(applicant)
    await db.flush()

    # Admin'e bildirim gönder (arka planda)
    if background_tasks:
        admin_emails_result = await db.execute(
            select(User.email).where(
                User.tenant_id == uuid.UUID(tenant_id),
                User.role.in_([UserRole.ADMIN, UserRole.SUPERADMIN]),
                User.is_active == True,
            )
        )
        admin_emails = admin_emails_result.scalars().all()
        if admin_emails:
            from src.services.mailing_service import send_waitlist_notification_to_admin
            background_tasks.add_task(
                send_waitlist_notification_to_admin,
                admin_emails, data.full_name, data.email, data.supervisor_name
            )

    return {"message": "Başvurunuz alındı. En kısa sürede sizinle iletişime geçeceğiz."}


@router.get("/", dependencies=[Depends(get_current_admin)])
async def get_waitlist(db: AsyncSession = Depends(get_db_session),
                       tenant_id: str = Depends(get_tenant_id)):
    """Admin tarafından görülen bekleme listesi."""
    result = await db.execute(
        select(Waitlist)
        .where(Waitlist.tenant_id == uuid.UUID(tenant_id), Waitlist.is_processed == False)
        .order_by(Waitlist.created_at.asc())
    )
    return result.scalars().all()


class WaitlistApplySchema(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    supervisor_name: Optional[str] = None
    message: Optional[str] = None
```

---

## 📄 Adım 4: Frontend – Partner Dashboard (`src/app/[locale]/(dashboard)/dashboard/page.tsx`)

```typescript
"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/api-client";
import MyProgressStats from "@/components/academy/MyProgressStats";
import { Users, Code2 } from "lucide-react";

interface ChildUser {
  id: string;
  full_name: string;
  partner_id: string;
  shorts_percentage: number;
  masterclass_percentage: number;
}

export default function PartnerDashboard() {
  const [children, setChildren] = useState<ChildUser[]>([]);
  const [refCode, setRefCode] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    apiClient.get("/admin/users/my-children").then((r) => setChildren(r.data));
  }, []);

  const generateCode = async () => {
    setGenerating(true);
    const res = await apiClient.post("/reference-codes/generate");
    setRefCode(res.data.code);
    setGenerating(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">Panelim</h1>

      {/* Kendi ilerleme barım */}
      <section>
        <h2 className="text-lg font-semibold mb-2">Akademi İlerlememiz</h2>
        <MyProgressStats />
      </section>

      {/* Referans Kodu Üret */}
      <section className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold flex items-center gap-2">
              <Code2 size={18} /> Davetiye Kodu Oluştur
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Kayıt olmak isteyen kişiye bu kodu ilet.
            </p>
          </div>
          <button
            onClick={generateCode}
            disabled={generating}
            className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            {generating ? "Üretiliyor..." : "Yeni Kod Üret"}
          </button>
        </div>
        {refCode && (
          <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-gray-600 mb-1">Tek kullanımlık davetiye kodun:</p>
            <div className="flex items-center gap-2">
              <code className="text-xl font-bold text-primary tracking-widest">
                {refCode}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(refCode)}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Kopyala
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Adaylarım (Children) */}
      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Users size={18} /> Adaylarım ({children.length} kişi)
        </h2>
        {children.length === 0 ? (
          <p className="text-gray-400 text-sm">Henüz davet ettiğin kimse yok.</p>
        ) : (
          <div className="space-y-3">
            {children.map((child) => (
              <ChildRow key={child.id} child={child} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ChildRow({ child }: { child: ChildUser }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="font-medium text-gray-900">{child.full_name}</p>
          <p className="text-xs text-gray-400">ID: {child.partner_id}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <MiniProgressBar label="Shorts" percentage={child.shorts_percentage} color="blue" />
        <MiniProgressBar label="Masterclass" percentage={child.masterclass_percentage} color="green" />
      </div>
    </div>
  );
}

function MiniProgressBar({ label, percentage, color }: any) {
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{label}</span>
        <span>{percentage}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color === "blue" ? "bg-blue-400" : "bg-primary"}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
```

---

## 📄 Adım 5: Frontend – Admin Panel Navigasyonu

Admin paneli `/admin` prefix'i altında şu alt sayfaları içerir:

| Sayfa | Route | Açıklama |
|-------|-------|----------|
| Bekleyen Onaylar | `/admin/users?tab=pending` | Onay bekleyen yeni kullanıcılar |
| Tüm Kullanıcılar | `/admin/users?tab=all` | Tüm partner + misafir listesi |
| Bekleme Listesi | `/admin/waitlist` | Referans kodsuz başvurular |
| İçerik Yönetimi | `/admin/content` | Shorts + Masterclass CRUD + sıralama |
| Etkinlikler | `/admin/events` | Etkinlik oluştur/yayınla/duyur |
| Duyurular | `/admin/announcements` | Duyuru ekle/kaldır/sabitle |
| Kaynak Merkezi | `/admin/resources` | Drive link listesi ekle/sil |
| İstatistikler | `/admin/stats` | Toplam partner, tamamlama oranları |

Her sayfa için temel yapı:
1. Veriyi `useEffect` ile API'den çek
2. Tablo veya kart liste ile göster
3. Aksiyon butonları (onayla/reddet, yayınla/kaldır, sil)
4. Toast bildirim (başarılı/hata)

---

## 📄 Adım 6: Backend – Admin İstatistikleri Endpoint'i

```python
# src/routes/admin_stats.py
@router.get("/stats")
async def get_admin_stats(
    db: AsyncSession = Depends(get_db_session),
    tenant_id: str = Depends(get_tenant_id),
    _=Depends(get_current_admin),
):
    """
    Admin dashboard için temel istatistikler.
    PostgreSQL'de COUNT sorguları ile hesaplanır.
    """
    tid = uuid.UUID(tenant_id)
    
    total_partners = await db.scalar(
        select(func.count(User.id)).where(
            User.tenant_id == tid, User.role == UserRole.PARTNER, User.is_active == True
        )
    )
    pending_approvals = await db.scalar(
        select(func.count(User.id)).where(
            User.tenant_id == tid, User.is_verified == True, User.is_active == False
        )
    )
    waitlist_count = await db.scalar(
        select(func.count(Waitlist.id)).where(
            Waitlist.tenant_id == tid, Waitlist.is_processed == False
        )
    )
    total_contents = await db.scalar(
        select(func.count(AcademyContent.id)).where(
            AcademyContent.tenant_id == tid,
            AcademyContent.status == ContentStatus.PUBLISHED,
        )
    )

    return {
        "total_partners": total_partners or 0,
        "pending_approvals": pending_approvals or 0,
        "waitlist_count": waitlist_count or 0,
        "total_contents": total_contents or 0,
    }
```

---

## ✅ Kabul Kriterleri

- [ ] Partner dashboard'ında "Yeni Kod Üret" butonu çalışıyor ve kod gösteriliyor
- [ ] Aday listesinde her child'ın Shorts ve Masterclass yüzdesi görünüyor
- [ ] Admin `/admin/users?tab=pending` sayfasına girince onay bekleyenler listesi geliyor
- [ ] "Onayla" butonuna basınca kullanıcı aktif oluyor ve hoşgeldin maili gidiyor
- [ ] Waitlist başvurusu admin panelinde görünüyor
- [ ] Admin yeni duyuru oluşturabiliyor, ana sayfada görünüyor
- [ ] Admin kaynak (Drive link) ekleyebiliyor, partner `/resources` sayfasında görüyor
- [ ] `/admin/stats` toplam partner ve bekleyen onay sayısını döndürüyor

---

## 📝 Junior Developer Notları

> **`/admin/users/my-children` neden ayrı?** Partner yalnızca kendi `inviter_id == partner.id` olan kullanıcıları görmeli. Bu endpoint'i Task 11'de ayrıca yaz: `SELECT * FROM users WHERE inviter_id = :current_user_id`.
>
> **Sıralama drag-and-drop için:** Akademi içerik sıralama için `@dnd-kit/core` kütüphanesi kullanılabilir. Sürüklenince `POST /academy/contents/reorder` çağrılır.
>
> **Admin istatistikleri neden basit COUNT?** Bu ölçekte analytics tool'a gerek yok. Basit SQL COUNT sorguları yeterli ve hızlı. İleride gerekirse Metabase vb. entegre edilebilir.

---

## Implementation Summary (Task 11)

### Backend Geliştirmeleri
- **Repository Katmanı:** `ReferenceCode`, `Announcement`, `ResourceLink` ve `Waitlist` modelleri için `AsyncTenantBaseRepository` tabanlı yeni repository'ler oluşturuldu.
- **Servis Katmanı:**
    - `ReferenceCodeService`: `GL-[SLUG]-[HEX]` formatında benzersiz, tek kullanımlık kod üretimi.
    - `AdminUserService`: Partner onaylama akışı ve otomatik `partner_id` atama.
    - `Announcement` & `ResourceLink`: Soft Delete (`is_active=False`) politikası uygulandı.
    - `AdminStatsService`: Dashboard metrikleri için optimize edilmiş COUNT sorguları.
- **API Rotaları:** `/admin/users`, `/admin/stats`, `/announcements`, `/resources`, `/waitlist` ve `/reference-codes` uçları yetki kontrolleriyle (RBAC) birlikte `app.py`'ye kaydedildi.

### Frontend Geliştirmeleri
- **Partner Dashboard:** 
    - Real-time aday takibi ve her aday için Shorts/Masterclass ilerleme çubukları.
    - "Aday Detay Modalı" ile ders bazlı derinlemesine inceleme imkanı.
    - Tek tıkla benzersiz referans kodu üretme ve kopyalama arayüzü.
- **Admin Panel:**
    - `AdminLayout` ve `AdminSidebar` ile premium navigasyon yapısı.
    - Bekleyen kullanıcıları onaylama/reddetme ekranı.
    - Duyuru ve kaynak yönetimi (CRUD + Soft Delete toggle).
    - Bekleme listesi (Waitlist) takip ve işleme ekranı.

### Teknik Kararlar ve Güvenlik
- **RBAC:** Admin ve Partner sayfaları `UserRoleContext` ve `AdminLayout` seviyesinde yetkisiz erişime karşı korundu.
- **Veri İzolasyonu:** Tüm yeni repository'ler `tenant_id` bazlı filtreleme yaparak mutlak veri izolasyonu sağladı.
- **ID Formatı:** Partner ID ve Referans Kodları `GL-TR-XXXXXX` formatında, çakışma kontrollü olarak kurgulandı.

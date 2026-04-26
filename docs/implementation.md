# Implementation Summary — Greenleaf Academy

**Date:** April 2026  
**Scope:** Backend bug fixes + architecture cleanup · Frontend feature completion

---

## Overview

Bu implementasyon, backend'deki kritik hataları gidermiş, mimari tutarsızlıkları düzeltmiş ve frontend'deki eksik özellikleri tamamlamıştır. İki ana eksen üzerinde çalışılmıştır: güvenlik/doğruluk ve kullanıcıya dönük özellik tamamlama.

---

## Backend — Bug Fixes

### 1. `academy.py` — Missing `import uuid`
**Dosya:** `src/routes/academy.py`  
**Problem:** Route handler parametrelerinde `uuid.UUID` kullanılıyordu ancak `uuid` modülü import edilmemişti. Bu durum runtime'da `NameError` fırlatıyor ve tüm `/api/academy/contents` endpointlerini çalışamaz hale getiriyordu.  
**Fix:** Dosya başına `import uuid` eklendi.

### 2. `events.py` — Calendar Endpoint Missing `tenant_id`
**Dosya:** `src/routes/events.py`  
**Problem:** `GET /api/events/calendar` endpointi `EventRepository(db)` şeklinde çağrılıyordu; `tenant_id` parametresi eksikti. Bu, multi-tenant izolasyonunu bozuyor ve tüm tenant'ların verilerini karıştırıyordu.  
**Fix:** `tenant_id: uuid.UUID = Depends(get_current_tenant_id)` bağımlılığı eklendi, `EventRepository(db, tenant_id)` olarak güncellendi.

### 3. `events.py` — Missing Schema Import
**Dosya:** `src/routes/events.py`  
**Problem:** `from src.schemas.event import EventResponse, GuestEventResponse` import'u `src/schemas/event.py` dosyasına referans veriyordu fakat bu dosya **yoktu**. Backend başlatılınca `ImportError` ile crash oluyordu.  
**Fix:** `src/datalayer/model/dto/event_dto.py` oluşturuldu (mimari standarta uygun), import güncellendi.

---

## Backend — Architecture Refactor

### 4. Schema Dosyalarının Taşınması
**Problem:** `src/schemas/` dizini mimari standartlara aykırıydı. DTO'ların tümü `src/datalayer/model/dto/` altında tutulmalı.  
**Yapılan işlemler:**
- `src/schemas/favorite.py` → `src/datalayer/model/dto/favorite_dto.py`
- `src/schemas/progress.py` → `src/datalayer/model/dto/progress_dto.py`
- `src/datalayer/model/dto/event_dto.py` (yeni oluşturuldu)
- `src/schemas/` dizini silindi
- `src/routes/favorites.py` ve `src/routes/progress.py` import yolları güncellendi

---

## Backend — New Features

### 5. `GET /api/auth/profile` — Profil Görüntüleme
**Dosya:** `src/routes/auth.py`  
Kullanıcının kendi profil bilgilerini çektiği endpoint. Mevcut kullanıcı için `full_name`, `phone`, `email`, `role`, `partner_id`, `consent_given_at` döner. Settings sayfası bu endpoint'e bağlı.

### 6. `PATCH /api/auth/profile` — Profil Güncelleme
**Dosya:** `src/routes/auth.py`  
`full_name` ve `phone` güncellemesine izin verir. Şifre değişikliği için `current_password` + `new_password` çifti gereklidir; mevcut şifre yanlışsa `400 Bad Request` döner.  
**DTO:** `ProfileUpdateSchema` → `src/datalayer/model/dto/auth_dto.py`

### 7. `POST /api/auth/logout` — Oturum Sonlandırma
**Dosya:** `src/routes/auth.py`  
JWT token'dan `jti` değerini okuyarak ilgili `UserSession` kaydını `is_active=False` yapar. Bu, tek cihaz kick-out sistemini tamamlar.

---

## Frontend — Critical Bug Fixes

### 8. `proxy.ts` → `middleware.ts` (KRİTİK)
**Dosya:** `src/middleware.ts` (eski adı: `src/proxy.ts`)  
**Problem:** Next.js middleware'i **yalnızca** `middleware.ts` (veya `middleware.js`) olarak adlandırılmış dosyayı çalıştırır. `proxy.ts` adıyla kaydedilmiş dosya hiç çalıştırılmıyordu. Bu şu anlama geliyordu:
- `/dashboard`, `/admin`, `/settings` gibi private sayfalar token olmadan erişilebiliyordu
- Admin sayfaları GUEST rolündeki kullanıcılara açıktı

**Fix:** Dosya `src/middleware.ts` olarak yeniden adlandırıldı.

### 9. `api-client.ts` — Token Refresh URL
**Dosya:** `src/lib/api-client.ts`  
**Problem:** 401 durumunda token yenileme isteği `/api/backend/auth/refresh` adresine gönderiliyordu. Backend route prefix'i `/api` olduğundan doğru adres `/api/backend/api/auth/refresh`'tir.  
**Fix:** İstemci ve sunucu URL'leri güncellendi.

### 10. Admin Content Page — Wrong Resource Endpoints
**Dosya:** `src/app/[locale]/admin/content/page.tsx`  
**Problem:** Kaynak linkleri için `POST /resources/`, `PATCH /resources/{id}`, `DELETE /resources/{id}` kullanılıyordu. Backend router prefix'i `/resource-links`.  
**Fix:** Tüm endpoint URL'leri `/resource-links/` ve `/resource-links/{id}` olarak güncellendi. Ayrıca admin listesi için `/announcements/admin` ve `/resource-links/admin` kullanılacak şekilde düzeltildi.

---

## Frontend — New Features

### 11. Admin Academy Content Management (`/admin/academy-content`)
**Dosya:** `src/app/[locale]/admin/academy-content/page.tsx`

SHORT ve MASTERCLASS içeriklerini yönetmek için tam CRUD sayfası:
- İçerikleri kart grid'de listeler; thumbnail, başlık, sıra numarası, yayın durumu gösterilir
- **Oluştur / Düzenle** modal: başlık, açıklama, YouTube URL, kaynak linki, sıra numarası, "Yeni" etiketi, PUBLISHED/DRAFT durumu
- Silme onaylı hard delete
- `POST /api/academy/contents` · `PATCH /api/academy/contents/{id}` · `DELETE /api/academy/contents/{id}` kullanır

### 12. Admin Events Management (`/admin/events`)
**Dosya:** `src/app/[locale]/admin/events/page.tsx`

Etkinlik takvimi yönetimi için tam CRUD sayfası:
- Etkinlikleri liste görünümünde gösterir; kategori ikonu, zaman, görünürlük rozeti
- **Oluştur/Düzenle** modal: başlık, açıklama, kategori, başlangıç/bitiş zamanı, meeting linki, konum, iletişim bilgisi, görünürlük
- Yayınlama butonu: taslak etkinliği yayına alır ve isteğe bağlı partner bildirim e-postası gönderir
- `POST /api/events/` · `PATCH /api/events/{id}` · `DELETE /api/events/{id}` · `POST /api/events/{id}/publish` kullanır

### 13. Admin Users Page — All Users + Toggle Active
**Dosya:** `src/app/[locale]/admin/users/page.tsx`

Sayfa iki sekmeye ayrıldı:
- **Onay Bekleyenler:** Kayıtlı ama onaylanmamış kullanıcılar; Onayla / Reddet actions
- **Tüm Kullanıcılar:** Tüm kullanıcı listesi with rol, durum, kayıt tarihi; **Aktif/Pasif toggle** butonu

`POST /api/admin/users/{id}/toggle-active` endpoint'i kullanılır.

### 14. AdminSidebar — Updated Menu
**Dosya:** `src/components/admin/AdminSidebar.tsx`

Yeni menü öğeleri eklendi:
- **Akademi İçerikleri** → `/admin/academy-content`
- **Etkinlikler** → `/admin/events`
- Aktif link tespiti `pathname.includes(href)` ile yapılır — nested route'lar için güvenli

Admin layout (`admin/layout.tsx`) Navbar yerine AdminSidebar'ı render edecek şekilde güncellendi; sidebar için `ml-72` offset uygulandı.

### 15. Settings Page — Real API Integration
**Dosya:** `src/app/[locale]/settings/page.tsx`

Tamamen yeniden yazıldı:
- `GET /api/auth/profile` ile profil yüklenir
- **Profil formu:** Ad/telefon güncelleme → `PATCH /api/auth/profile`; başarı mesajı + Zustand store güncellemesi
- **Şifre formu:** Mevcut şifre doğrulaması + yeni şifre eşleşme kontrolü → `PATCH /api/auth/profile`
- KVKK audit log: `consent_given_at` tarihini gerçek veriyle gösterir
- Hesap silme modal (UI hazır, backend bağlantısı ileriki fazda)

### 16. Home Page — Live Event Countdown
**Dosya:** `src/app/[locale]/page.tsx`

Geri sayım artık hardcoded değil:
- `GET /api/events/?limit=1` ile bir sonraki etkinlik çekilir
- Etkinliğin `start_time`'ına göre gerçek zamanlı geri sayım hesaplanır
- Etkinlik başlığı ve zamanı dinamik olarak gösterilir
- API başarısız olursa fallback: 14 saat sonrasına ayarlı placeholder gösterilir

---

## Etkilenen Dosyalar (Özet)

| Dosya | İşlem |
|-------|-------|
| `backend/src/routes/academy.py` | BUG FIX: `import uuid` eklendi |
| `backend/src/routes/events.py` | BUG FIX: calendar endpoint tenant_id, import yolu düzeltildi |
| `backend/src/routes/auth.py` | FEATURE: `GET/PATCH /profile`, `POST /logout` eklendi |
| `backend/src/routes/favorites.py` | REFACTOR: import yolu güncellendi |
| `backend/src/routes/progress.py` | REFACTOR: import yolu güncellendi |
| `backend/src/datalayer/model/dto/event_dto.py` | NEW: EventResponse, GuestEventResponse |
| `backend/src/datalayer/model/dto/favorite_dto.py` | NEW: taşındı |
| `backend/src/datalayer/model/dto/progress_dto.py` | NEW: taşındı |
| `backend/src/datalayer/model/dto/auth_dto.py` | FEATURE: ProfileUpdateSchema eklendi |
| `backend/src/schemas/` | DELETED: dizin kaldırıldı |
| `frontend/src/middleware.ts` | BUG FIX: proxy.ts → middleware.ts |
| `frontend/src/lib/api-client.ts` | BUG FIX: refresh token URL düzeltildi |
| `frontend/src/app/[locale]/admin/layout.tsx` | UPDATE: AdminSidebar entegrasyonu |
| `frontend/src/app/[locale]/admin/users/page.tsx` | FEATURE: 2 sekme, toggle-active |
| `frontend/src/app/[locale]/admin/content/page.tsx` | BUG FIX: endpoint URL'leri düzeltildi |
| `frontend/src/app/[locale]/admin/academy-content/page.tsx` | NEW: Academy CRUD |
| `frontend/src/app/[locale]/admin/events/page.tsx` | NEW: Events CRUD |
| `frontend/src/components/admin/AdminSidebar.tsx` | UPDATE: 2 yeni menü öğesi |
| `frontend/src/app/[locale]/settings/page.tsx` | FEATURE: Gerçek API bağlantısı |
| `frontend/src/app/[locale]/page.tsx` | FEATURE: Gerçek event countdown |

---

## Single-Tenant & Superadmin Separation (April 2026)

### 17. Single-Tenant Architecture
**Problem:** Multi-tenant architecture was over-complicating deployments and scaling.  
**Action:** Removed all `tenant_id` logic and database columns. Each deployment is now a separate instance.  
**Changes:**
- Removed `tenant_id` from all models (`User`, `AcademyContent`, `Event`, etc.).
- Cleaned up service and repository layers to remove tenant filtering.
- Updated JWT tokens to remove `tenant_id` claim.

### 18. Superadmin Service Separation
**Problem:** Superadmin tasks (tenant management, global user creation) were mixed with the main application.  
**Action:** Moved superadmin logic to a standalone service in the `/superadmin` directory.  
**Changes:**
- Removed `SUPERADMIN` role from the main application's `UserRole` enum.
- The highest role within a deployment is now `ADMIN`.
- Superadmin routes (`/superadmin/*`) were removed from the main backend.
- Frontend `AdminUsersPage` was refactored to allow local `ADMIN` users to create partners/admins without tenant selection.
- Superadmin-only UI components were removed from the main academy frontend.

---

## Mimari Kararlar

1. **DTO'lar `datalayer/model/dto/` altında:** Tüm Pydantic request/response şemaları bu dizinde. `schemas/` dizini kaldırıldı.
2. **Single-Tenant Yapı:** Deployment başına tek instance. İzolasyon deployment düzeyinde (domain/db) sağlanır. `tenant_id` kullanımı tamamen kaldırılmıştır.
3. **Superadmin Ayrımı:** Global yönetim paneli (superadmin) artık ana uygulamadan bağımsız bir servistir. Ana uygulamada en yetkili rol `ADMIN`'dir.
4. **API client refresh URL:** Next.js proxy `/api/backend/*` → `{BACKEND_URL}/*` şeklinde çalışır. Backend API prefix'i `/api` olduğundan doğru URL `/api/backend/api/...` şeklindedir.

---

## Bilinen Kısıtlamalar / Sonraki Adımlar

- **Hesap Silme:** Settings sayfasında UI hazır, `DELETE /api/auth/account` endpoint'i henüz eklenmedi.
- **Profile Picture Upload:** `PATCH /api/auth/profile/avatar` ve frontend upload formu eksik.
- **Event PATCH endpoint:** Backend'de `PATCH /api/events/{id}` henüz yoksa eklenmelidir (mevcut durumda sadece `POST + DELETE` var).
- **Admin Content page ESLint:** Mevcut `any` type kullanımları temizlenebilir.
- **Real-time notifications:** Yeni partner kaydı için admin bildirim (WebSocket veya polling).

---

## Session Management & UI Sync (April 2026)

### 19. JWT Expiration & UI Sync
**Problem:** Kullanıcı oturumu (JWT) kapandığında frontend bunu fark etmiyor ve sanki hala login'miş gibi profil ikonunu göstermeye devam ediyordu. Ayrıca Navbar'da profil butonunun çeviri anahtarı (`auth.profile`) eksikti.
**Action:** JWT expiration kontrolü eklendi ve periyodik senkronizasyon mekanizması kuruldu.
**Changes:**
- `src/store/auth.store.ts`: `isTokenExpired` helper'ı eklendi, `isAuthenticated` bu kontrolü yapacak şekilde güncellendi.
- `src/context/UserRoleContext.tsx`: `setInterval` ile dakikada bir token kontrolü yapılıp süresi dolmuşsa `clearAuth` çağrılarak UI'ın "Guest" moduna geçmesi sağlandı.
- `messages/tr-TR.json` & `en-US.json`: Eksik olan `auth.profile` çeviri anahtarı eklendi.

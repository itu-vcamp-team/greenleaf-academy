# Backend Yol Haritası (roadmap/backend/overview.md)

## 1. Aşama: Çekirdek Mimari ve Multi-tenancy
- [ ] **Proje Kurulumu**: FastAPI, SQLModel ve Alembic yapılandırması.
- [ ] **Tenant İzolasyonu**: Middleware seviyesinde `X-Tenant-ID` veya subdomain tabanlı tenant tespiti.
- [ ] **Veritabanı Şeması**: `Tenant`, `User`, `ReferenceCode`, `AcademyContent` modellerinin oluşturulması.
- [ ] **Auth Sistemi**: JWT tabanlı kimlik doğrulama, 2FA (mail kod) akışı.
- [ ] **Rate Limiting**: Redis entegrasyonu ve IP bazlı kısıtlama mantığı.

## 2. Aşama: İçerik ve Operasyon API'ları
- [ ] **Academy API**: Reels ve Masterclass içeriklerinin CRUD işlemleri.
- [ ] **Progress Tracking**: Kullanıcı izleme verilerinin kaydedilmesi ve "kaldığın yerden devam et" API'ı.
- [ ] **Calendar API**: Etkinlik yönetimi ve iCal/Google Calendar link üretimi.
- [ ] **Reference Code Engine**: Adminler için tek seferlik kod üretim servisi.

## 3. Aşama: Admin ve Süper Admin Servisleri
- [ ] **Admin Dashboard API**: Partner onaylama, aday ilerleme raporları.
- [ ] **Super Admin API**: Yeni tenant oluşturma, global konfigürasyon yönetimi.
- [ ] **Mailing Service**: Resend.com entegrasyonu ile şablon tabanlı mail gönderimi.
- [ ] **File Management**: Render Disk üzerinde görsel yükleme ve WebP optimizasyon servisi.

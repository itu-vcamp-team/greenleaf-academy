# Veri Tabanı Şeması Tasarımı (todo/database_design.md)

## 1. Çekirdek Modeller (SQLAlchemy/SQLModel - PostgreSQL)

### `Tenant` (Kiracı)
- `id`: UUID (Birincil Anahtar)
- `slug`: Dize (Örn: "tr", "de")
- `name`: Dize (Ad)
- `config`: JSONB (Logo, Renkler, Meta Bilgiler)

### `User` (Kullanıcı)
- `id`: UUID
- `tenantId`: İlişki -> `Tenant.id`
- `role`: Enum (GUEST, PARTNER, EDITOR, ADMIN, SUPERADMIN)
- `partnerId`: Dize (Her kiracı için benzersiz, manuel giriş)
- `email`: Dize (Benzersiz)
- `passwordHash`: Dize (Şifre Hash'i)
- `inviterId`: UUID (Kendi kendine boş bırakılabilir ilişki)
- `isVerified`: Boole (Doğrulandı mı?)

### `AcademyContent` (Akademi İçeriği)
- `id`: UUID
- `tenantId`: İlişki -> `Tenant.id`
- `type`: Enum (REEL, MASTERCLASS)
- `locale`: Dize (TR, EN, RU vb.)
- `title`: Dize (Başlık)
- `description`: Metin (Açıklama)
- `videoUrl`: Dize (Video Bağlantısı)
- `pdfUrl`: Dize (S3 Bağlantısı)
- `order`: Tam Sayı (Sıra)
- `prerequisiteId`: UUID (Kilidini açmak için kendi kendine boş bırakılabilir referans)

### `UserProgress` (Kullanıcı İlerlemesi)
- `id`: UUID
- `userId`: İlişki -> `User.id`
- `contentId`: İlişki -> `AcademyContent.id`
- `completionStatus`: Ondalıklı Sayı (0.0 - 1.0)
- `isPassed`: Boole (Geçti mi?)
- `lastWatchedAt`: Tarih/Saat (En son izleme)

### `Event` (Etkinlik)
- `id`: UUID
- `tenantId`: İlişki -> `Tenant.id`
- `title`: Dize (Başlık)
- `startTime`: Tarih/Saat (Başlangıç Zamanı)
- `zoomLink`: Dize (Zoom Bağlantısı)
- `category`: Enum (WEBINAR, TRAINING, CORPORATE)

### `AuditLog` (Denetim Günlüğü)
- `id`: UUID
- `actorId`: UUID (Eylemi gerçekleştiren kullanıcı)
- `action`: Dize (Eylem)
- `entityType`: Dize (Varlık Türü)
- `entityId`: Dize (Varlık Kimliği)
- `metadata`: JSONB
- `createdAt`: Tarih/Saat

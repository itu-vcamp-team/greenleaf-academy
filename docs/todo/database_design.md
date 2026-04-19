# Veri Tabanı Şeması Tasarımı (todo/database_design.md)

## 🏛 Mimar Planı (SQLAlchemy 2.0 + Pydantic V2)

Projede veritabanı işlemleri için **SQLAlchemy 2.0 (Async)**, API şemaları için **Pydantic V2** ve veri erişimi için **Repository Pattern** kullanılmaktadır.

- **DB Modelleri (`src/datalayer/model/db/`):** SQLAlchemy `Mapped` ve `mapped_column` ile tanımlanmış sınıflar.
- **DTO'lar (`src/datalayer/model/dto/`):** API istek ve yanıtlarını doğrulayan Pydantic sınıfları.
- **Mapper'lar (`src/datalayer/mapper/`):** DB modelleri ile DTO'lar arasında dönüşüm yapan sade statik metodlar.
- **Repository'ler (`src/datalayer/repository/`):** Veri tabanı CRUD işlemlerini soyutlayan sınıflar (`AsyncBaseRepository` temelli).

## 1. Çekirdek Modeller (PostgreSQL)

### `Tenant` (Kiracı)
- `id`: UUID (Birincil Anahtar, `gen_random_uuid()`)
- `slug`: String(10) (Unique, Index - Örn: "tr", "de")
- `name`: String(100)
- `config`: JSON (Logo, Renkler, Meta Bilgiler)
- `is_active`: Boolean

### `User` (Kullanıcı)
- `id`: UUID
- `tenant_id`: FK -> `tenants.id`
- `role`: Enum (GUEST, PARTNER, EDITOR, ADMIN, SUPERADMIN)
- `username`: String(50) (Unique)
- `email`: String(255) (Unique)
- `password_hash`: String(255)
- `partner_id`: String(50) (Optional, Index)
- `inviter_id`: FK -> `users.id` (Self-referential)
- `is_verified`: Boolean
- `is_active`: Boolean
- `last_login_at`: DateTime

### `AcademyContent` (Akademi İçeriği)
- `id`: UUID
- `tenant_id`: FK -> `tenants.id`
- `type`: Enum (SHORT, MASTERCLASS)
- `locale`: String(5) (Index)
- `title`: String(200)
- `description`: Text(2000)
- `video_url`: String(500)
- `resource_link`: String(500) (Google Drive vb.)
- `resource_link_label`: String(100)
- `order`: Integer (Index)
- `prerequisite_id`: FK -> `academy_contents.id` (Optional)
- `is_new`: Boolean

### `UserProgress` (Kullanıcı İlerlemesi)
- `id`: UUID
- `user_id`: FK -> `users.id`
- `content_id`: FK -> `academy_contents.id`
- `status`: String(20) ("not_started", "in_progress", "completed")
- `completion_percentage`: Float
- `last_position_seconds`: Float (Kaldığı yer)
- `completed_at`: DateTime
- **Constraint**: `UniqueConstraint("user_id", "content_id")`

### Diğer Tablolar
- `ReferenceCode`: Davetiye kodları.
- `UserSession`: Kick-out mekanizması için oturum takibi.
- `Event`: Takvim etkinlikleri.
- `Announcement`: Dashboard duyuruları.
- `ResourceLink`: Kaynak merkezi dökümanları.
- `Waitlist`: Başvuru havuzu.
- `AuditLog`: Admin işlem kayıtları.

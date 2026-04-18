# Teknoloji Yığını ve Araçlar (6_tech_stack.md)

## 1. Frontend Mimarisi
- **Framework**: **Next.js 15+** (App Router).
- **Dil**: **TypeScript**.
- **Stillendirme**: **TailwindCSS 4**.
- **Durum Yönetimi**: **Zustand** veya **React Query** (ihtiyaca göre).

## 2. Backend ve Veri Katmanı
- **Dil/Framework**: **Python 3.12+** ile **FastAPI** (Yüksek performanslı, async destekli).
- **ORM**: **SQLAlchemy** veya **SQLModel** (PostgreSQL ile tam uyumlu).
- **Veri Tabanı**: **PostgreSQL** (Render.com Managed).
- **Önbellekleme**: **Redis** (Render Key Value) - Hız sınırlama ve oturum yönetimi için.

## 3. Altyapı ve DevOps
- **Barındırma**: **Render.com**.
- **CI/CD**: **GitHub Actions** (Render auto-deploy).
- **Gözlemlenebilirlik**: **Sentry** (Hata takibi).

## 4. Medya ve Üçüncü Taraf Servisler
- **Video**: **YouTube Embed** (Liste dışı videolar).
- **E-posta**: **Resend.com**.
- **Dosya Depolama**: **Google Drive** (Sadece link bazlı, indirilemez).
- **Görsel İşleme**: **Render Disk / WebP** (Optimize edilmiş yerel depolama).

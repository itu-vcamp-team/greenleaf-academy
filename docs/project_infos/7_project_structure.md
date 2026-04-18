# Proje Klasör Yapısı (7_project_structure.md)

## 1. Proje Organizasyonu
Proje, Render.com üzerinde kolay dağıtılabilir ve ölçeklenebilir bir yapıda, Next.js 15+ tabanlı bir monolit olarak kurgulanmıştır.

```text
/
├── frontend/               # Next.js 15+ Uygulaması
│   ├── src/
│   │   ├── app/            # Sayfalar ve Client-side Logic
│   │   ├── components/     # UI Bileşenleri (Tailwind 4)
│   │   └── context/        # Tenant ve User Context'leri
├── backend/                # Python 3.12+ FastAPI Uygulaması
│   ├── src/
│   │   ├── datalayer/      # Veri Erişim Katmanı
│   │   │   ├── mapper/     # DTO <-> DB Model Dönüştürücüler
│   │   │   ├── model/      # Veri Modelleri
│   │   │   │   ├── db/     # SQLAlchemy/SQLModel DB Modelleri
│   │   │   │   └── dto/    # Pydantic Şemaları (Data Transfer Objects)
│   │   │   ├── repository/ # Veritabanı Sorgu Mantığı
│   │   │   ├── triggers/   # Veritabanı Tetikleyicileri/Olayları
│   │   │   └── database.py # DB Bağlantı ve Session Yönetimi
│   │   ├── routes/         # API Endpoint Tanımlamaları (FastAPI Routers)
│   │   ├── services/       # İş Mantığı (Business Logic) Katmanı
│   │   ├── utils/          # Yardımcı Fonksiyonlar
│   │   ├── app_lifespan.py # Uygulama Başlangıç/Bitiş Olayları
│   │   ├── app.py          # FastAPI Uygulama Giriş Noktası
│   │   ├── config.py       # Pydantic-settings ile Konfigürasyon
│   │   └── logger.py       # Loglama Yapılandırması
│   ├── .env                # Çevresel Değişkenler
│   ├── docker-compose.yml  # Yerel Geliştirme için Docker Yapılandırması
│   ├── Dockerfile          # Dağıtım için Docker İmajı
│   └── requirements.txt    # Bağımlılık Listesi
├── docs/                   # Proje Dokümantasyonu
└── docs-raw/               # Ham Toplantı Notları ve Dökümanlar
```

## 2. `src/app` Yapısı
- `(auth)/` -> Kayıt, Giriş ve Şifre İşlemleri.
- `(dashboard)/` -> Partner ve Admin Panelleri.
- `academy/` -> Reels ve Masterclass içerikleri.
- `calendar/` -> Dinamik Etkinlik Takvimi.
- `api/` -> Backend servisleri (Auth, Tenant, Content).

## 3. Tenant Ayrımı
Middleware seviyesinde `hostname` kontrolü yapılarak (`tr.greenleafakademi.com` vb.) `TenantContext` üzerinden uygulama genelinde bölgesel ayarlar (dil, tema, içerik) yönetilir.

# Task 1: Backend Proje Kurulumu

## 🎯 Hedef
`backend/` dizini altında FastAPI tabanlı Python projesinin iskeletini oluşturmak; bağımlılıkları tanımlamak, klasör yapısını `7_project_structure.md`'ye uygun şekilde kurmak, uygulama konfigürasyonunu ve Docker ortamını hazırlamak.

## ⚠️ Ön Koşullar
- Python 3.12+ kurulu olmalı (`python --version` ile kontrol et)
- Docker ve Docker Compose kurulu olmalı
- `.env` dosyası için örnek değerler hazır olmalı (bkz. aşağıdaki ENV listesi)

---

## 📁 Adım 1: Klasör Yapısını Oluştur

`backend/` dizini altında aşağıdaki yapıyı oluştur. Her dizinde `__init__.py` dosyası olmalı:

```
backend/
├── src/
│   ├── datalayer/
│   │   ├── mapper/
│   │   ├── model/
│   │   │   ├── db/
│   │   │   └── dto/
│   │   ├── repository/
│   │   ├── triggers/
│   │   └── database.py
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── middleware/
│   ├── app_lifespan.py
│   ├── app.py
│   ├── config.py
│   └── logger.py
├── tests/
│   └── __init__.py
├── .env
├── .env.example
├── Dockerfile
├── docker-compose.yml
└── requirements.txt
```

---

## 📦 Adım 2: `requirements.txt` Dosyasını Oluştur

```txt
# Web Framework
fastapi==0.115.0
uvicorn[standard]==0.30.6

# Database
sqlmodel==0.0.21
sqlalchemy[asyncio]==2.0.35
asyncpg==0.29.0   # PostgreSQL async driver
alembic==1.13.3

# Configuration
pydantic-settings==2.5.2
python-dotenv==1.0.1

# Authentication
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4

# Cache & Session
redis==5.0.8

# Email
resend==2.3.0

# Image processing
Pillow==10.4.0

# HTTP Client (for Greenleaf Global API verification)
aiohttp==3.13.5

# Background tasks
celery==5.4.0  # ileride kullanılmak üzere, şimdilik FastAPI BackgroundTasks yeterli

# Dev/Testing
pytest==8.3.3
pytest-asyncio==0.24.0
aiohttp==0.27.2  # FastAPI test client için de kullanılır
```

---

## ⚙️ Adım 3: `config.py` – Uygulama Konfigürasyonu

`src/config.py` dosyasını aşağıdaki gibi oluştur:

```python
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # App
    APP_ENV: str = "development"  # "development" | "production"
    APP_SECRET_KEY: str  # JWT imzalamak için, üretimde uzun random string

    # Database
    DATABASE_URL: str  # örn: postgresql+asyncpg://user:pass@localhost:5432/greenleaf

    # Redis
    REDIS_URL: str  # örn: redis://localhost:6379/0

    # JWT
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Email (Resend)
    RESEND_API_KEY: str
    MAIL_FROM_ADDRESS: str = "noreply@greenleafakademi.com"
    MAIL_FROM_NAME: str = "Greenleaf Akademi"

    # Greenleaf Global External API
    GREENLEAF_GLOBAL_API_URL: str = "https://greenleaf-global.com/office/login"

    # File Storage (Render Disk)
    UPLOAD_DIR: str = "/var/data/uploads"  # Render disk mount path

    # Frontend URL (CORS için)
    FRONTEND_URL: str = "http://localhost:3000"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
```

---

## 📋 Adım 4: `logger.py` – Loglama Yapılandırması

`src/logger.py` dosyasını oluştur:

```python
import logging
import sys
from src.config import get_settings

settings = get_settings()


def setup_logging():
    log_level = logging.DEBUG if settings.APP_ENV == "development" else logging.INFO

    logging.basicConfig(
        level=log_level,
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        handlers=[logging.StreamHandler(sys.stdout)],
    )


logger = logging.getLogger("greenleaf")
```

---

## 🗄️ Adım 5: `datalayer/database.py` – Veritabanı Bağlantısı

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlmodel import SQLModel
from src.config import get_settings

settings = get_settings()

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=(settings.APP_ENV == "development"),
    pool_size=10,
    max_overflow=20,
)

AsyncSessionFactory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db_session() -> AsyncSession:
    """FastAPI Depends ile kullanılacak session generator."""
    async with AsyncSessionFactory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def create_tables():
    """Sadece development ortamında tüm tabloları oluşturur. Prod'da Alembic kullan."""
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
```

---

## 🚀 Adım 6: `app_lifespan.py` – Başlangıç/Bitiş Olayları

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from src.datalayer.database import create_tables
from src.logger import setup_logging, logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Uygulama başlarken
    setup_logging()
    logger.info("Greenleaf Backend başlatılıyor...")
    await create_tables()  # sadece geliştirme ortamı için
    logger.info("Veritabanı bağlantısı hazır.")
    yield
    # Uygulama kapanırken
    logger.info("Greenleaf Backend kapatılıyor.")
```

---

## 🌐 Adım 7: `app.py` – Ana FastAPI Uygulaması

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.app_lifespan import lifespan
from src.config import get_settings

settings = get_settings()

app = FastAPI(
    title="Greenleaf Akademi API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.APP_ENV == "development" else None,
    redoc_url=None,
)

# CORS ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health", tags=["System"])
async def health_check():
    return {"status": "ok", "env": settings.APP_ENV}
```

---

## 🐳 Adım 8: `Dockerfile`

```dockerfile
FROM python:3.12-slim

WORKDIR /app

# Sistem bağımlılıkları
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc && \
    rm -rf /var/lib/apt/lists/*

# Python bağımlılıklarını kur
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Uygulama kodunu kopyala
COPY . .

# Uygulama kullanıcısı oluştur (root çalıştırma)
RUN adduser --disabled-password --gecos "" appuser && chown -R appuser /app
USER appuser

EXPOSE 8000

CMD ["uvicorn", "src.app:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 🐳 Adım 9: `docker-compose.yml` (Yerel Geliştirme)

```yaml
version: "3.9"

services:
  backend:
    build: .
    ports:
      - "8000:8000"
    volumes:
      - .:/app
    environment:
      - APP_ENV=development
    env_file:
      - .env
    depends_on:
      - postgres
      - redis
    command: uvicorn src.app:app --host 0.0.0.0 --port 8000 --reload

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: greenleaf
      POSTGRES_PASSWORD: greenleaf_dev
      POSTGRES_DB: greenleaf_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

---

## 📄 Adım 10: `.env.example` Dosyasını Oluştur

```env
APP_ENV=development
APP_SECRET_KEY=change_this_to_a_long_random_string_in_production

DATABASE_URL=postgresql+asyncpg://greenleaf:greenleaf_dev@localhost:5432/greenleaf_db

REDIS_URL=redis://localhost:6379/0

ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=30

RESEND_API_KEY=re_xxxxxxxxxxxx
MAIL_FROM_ADDRESS=noreply@greenleafakademi.com
MAIL_FROM_NAME=Greenleaf Akademi

GREENLEAF_GLOBAL_API_URL=https://greenleaf-global.com/office/login

UPLOAD_DIR=/var/data/uploads

FRONTEND_URL=http://localhost:3000
```

---

## ✅ Kabul Kriterleri

- [ ] `docker-compose up` komutu hatasız çalışıyor
- [ ] `http://localhost:8000/health` endpoint'i `{"status": "ok"}` dönüyor
- [ ] `http://localhost:8000/docs` sayfası açılıyor (development ortamında)
- [ ] Postgres ve Redis container'ları ayakta
- [ ] `.env.example` dosyası repoda mevcut, `.env` dosyası `.gitignore`'da

---

## 📝 Junior Developer Notları

> **Neden `asyncpg`?** FastAPI async desteklidir; senkron sürücü kullanmak performansı düşürür. `asyncpg`, PostgreSQL için en hızlı async Python sürücüsüdür.
>
> **Neden `lru_cache` ile `get_settings()`?** `.env` dosyası her request'te tekrar okunmasın diye settings instance'ı cache'lenir.
>
> **`create_tables()` neden `lifespan`'da?** Üretim ortamında bu satırı kaldır ve Alembic migration'larını kullan. Geliştirme kolaylığı için şimdilik bırakılmıştır.

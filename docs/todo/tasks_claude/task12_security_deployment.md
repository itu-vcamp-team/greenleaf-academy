# Task 12: Güvenlik Sertleştirmesi ve Deployment

## 🎯 Hedef
Redis tabanlı rate limiting, güvenlik HTTP header'ları (HSTS/CSP), hareketsiz hesap temizleme cron job'u, görsel yükleme güvenliği, GitHub Actions CI/CD pipeline ve Render.com deploy yapılandırmasını tamamlamak.

## ⚠️ Ön Koşullar
- Tüm önceki task'lar tamamlanmış olmalı
- Render.com hesabı, GitHub reposu ve Resend domaini hazır (bkz. `tasks_human/task1_accounts_setup.md`)
- `.env` dosyasındaki tüm değerler production değerleriyle doldurulmuş

---

## 🛡️ Adım 1: Redis Rate Limiting Middleware – `src/middleware/rate_limit_middleware.py`

```python
import redis.asyncio as aioredis
import json
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from fastapi import Request, Response
from src.config import get_settings
from src.logger import logger

settings = get_settings()

# Rate limit konfigürasyonu
RATE_LIMIT_CONFIGS = {
    # (endpoint prefix): (max_requests, window_seconds, block_seconds)
    "/auth/login": (5, 900, 900),        # 15 dk'da max 5 istek → 15 dk blok
    "/auth/register": (10, 3600, 1800),  # 1 saatte max 10 istek → 30 dk blok
    "/auth/forgot-password": (3, 3600, 3600),  # 1 saatte max 3 istek → 1 saat blok
    "default": (100, 60, 0),             # Diğer tüm endpoint'ler: 1 dk'da max 100 istek
}

WHITELIST_PATHS = ["/health", "/docs", "/openapi.json"]


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.redis = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True
        )

    async def dispatch(self, request: Request, call_next) -> Response:
        path = request.url.path

        # Whitelist kontrolü
        if path in WHITELIST_PATHS:
            return await call_next(request)

        # IP adresini al (Render'ın proxy başlıklarını destekle)
        ip = request.headers.get("x-forwarded-for", request.client.host)
        ip = ip.split(",")[0].strip()  # "x-forwarded-for" birden fazla IP içerebilir

        # Hangi rate limit konfigürasyonu uygulanacak?
        config = RATE_LIMIT_CONFIGS.get("default")
        for prefix, cfg in RATE_LIMIT_CONFIGS.items():
            if prefix != "default" and path.startswith(prefix):
                config = cfg
                break

        max_requests, window_seconds, block_seconds = config

        # Blok kontrolü
        block_key = f"rl_block:{ip}:{path}"
        if await self.redis.get(block_key):
            return Response(
                content=json.dumps({
                    "detail": f"Çok fazla deneme. {block_seconds // 60} dakika sonra tekrar deneyin.",
                    "code": "RATE_LIMIT_EXCEEDED"
                }),
                status_code=429,
                media_type="application/json",
                headers={"Retry-After": str(block_seconds)},
            )

        # Request sayacını artır
        count_key = f"rl_count:{ip}:{path}"
        current_count = await self.redis.incr(count_key)

        if current_count == 1:
            # İlk istek - pencereyi başlat
            await self.redis.expire(count_key, window_seconds)

        if current_count > max_requests:
            # Limiti aştı - IP'yi engelle
            await self.redis.setex(block_key, block_seconds, "1")
            await self.redis.delete(count_key)
            logger.warning(f"Rate limit aşıldı: {ip} → {path}")
            return Response(
                content=json.dumps({
                    "detail": f"Çok fazla deneme. {block_seconds // 60} dakika sonra tekrar deneyin.",
                    "code": "RATE_LIMIT_EXCEEDED"
                }),
                status_code=429,
                media_type="application/json",
            )

        # İstek devam eder
        response = await call_next(request)

        # Rate limit bilgisini response header'ına ekle (isteğe bağlı, debug kolaylığı)
        if settings.APP_ENV == "development":
            response.headers["X-RateLimit-Remaining"] = str(max_requests - current_count)

        return response
```

---

## 🔒 Adım 2: Güvenlik Header'ları Middleware – `src/middleware/security_headers_middleware.py`

```python
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from fastapi import Request, Response
from src.config import get_settings

settings = get_settings()


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Tarayıcı güvenlik header'larını her response'a ekler.
    XSS, clickjacking ve diğer saldırılara karşı koruma sağlar.
    """
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)

        # HTTPS zorunluluğu (Render production'da otomatik aktif)
        if settings.APP_ENV == "production":
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains"
            )

        # Clickjacking koruması (iframe gömmeyi engeller)
        response.headers["X-Frame-Options"] = "DENY"

        # MIME type sniffing engellemesi
        response.headers["X-Content-Type-Options"] = "nosniff"

        # Referrer politikası
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # İzin verilen harici kaynaklar
        # YouTube embed ve Google Drive için gerekli izinler
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' https://www.youtube.com; "
            "frame-src https://www.youtube.com https://drive.google.com; "
            "img-src 'self' data: https://img.youtube.com https://i.ytimg.com; "
            "style-src 'self' 'unsafe-inline'; "
            "connect-src 'self';"
        )

        # Kamera, mikrofon, konum erişimini engelle
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=()"
        )

        return response
```

---

## 🧹 Adım 3: Hareketsiz Hesap Temizleme – `src/utils/cleanup_jobs.py`

```python
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, delete
from src.datalayer.model.db import User, UserRole, UserSession
from src.logger import logger


async def cleanup_inactive_guest_accounts(db: AsyncSession) -> int:
    """
    GDPR/KVKK gereği: 1 yıl hareketsiz GUEST hesaplarını siler.
    
    Kriter: role=GUEST ve last_active_at (veya created_at) 1 yıldan eski.
    Partner hesapları bu kapsama GİRMEZ.
    
    Bu fonksiyon bir cron job tarafından günlük çağrılır.
    Returns: Silinen hesap sayısı
    """
    one_year_ago = datetime.now(timezone.utc) - timedelta(days=365)

    # Silinecek hesapları bul
    result = await db.execute(
        select(User).where(
            User.role == UserRole.GUEST,
            User.is_active == False,
            # Son aktivite veya hesap oluşturma tarihi 1 yıldan önce
            User.last_active_at < one_year_ago,
        )
    )
    users_to_delete = result.scalars().all()

    count = len(users_to_delete)
    for user in users_to_delete:
        await db.delete(user)

    if count > 0:
        logger.info(f"Temizleme: {count} hareketsiz GUEST hesabı silindi.")

    return count


async def cleanup_expired_sessions(db: AsyncSession) -> int:
    """
    Süresi dolmuş UserSession kayıtlarını siler.
    Veritabanını temiz tutar.
    
    Returns: Silinen session sayısı
    """
    now = datetime.now(timezone.utc)

    result = await db.execute(
        select(UserSession).where(UserSession.expires_at < now)
    )
    expired = result.scalars().all()
    count = len(expired)

    for session in expired:
        await db.delete(session)

    if count > 0:
        logger.info(f"Temizleme: {count} süresi dolmuş oturum silindi.")

    return count
```

### Cleanup Endpoint'i (Admin Triggered veya Scheduled)

```python
# src/routes/admin_maintenance.py
from fastapi import APIRouter, Depends, BackgroundTasks
from src.datalayer.database import get_db_session
from src.utils.auth_deps import get_current_superadmin
from src.utils.cleanup_jobs import cleanup_inactive_guest_accounts, cleanup_expired_sessions

router = APIRouter(prefix="/admin/maintenance", tags=["Maintenance"])


@router.post("/cleanup")
async def run_cleanup(
    background_tasks: BackgroundTasks,
    db=Depends(get_db_session),
    _=Depends(get_current_superadmin),
):
    """
    Manuel temizlik tetikleyicisi (SuperAdmin only).
    Render'da scheduled job yoksa bu endpoint Render Cron ile çağrılabilir.
    
    Render Cron yapılandırması (render.yaml'da):
      - type: cron
        name: cleanup-job
        schedule: "0 2 * * *"  # Her gece 02:00
        startCommand: curl -X POST https://api.greenleafakademi.com/admin/maintenance/cleanup
    """
    background_tasks.add_task(_do_cleanup, db)
    return {"message": "Temizlik işlemi başlatıldı."}


async def _do_cleanup(db):
    deleted_guests = await cleanup_inactive_guest_accounts(db)
    deleted_sessions = await cleanup_expired_sessions(db)
    await db.commit()
```

---

## 🔧 Adım 4: `app.py`'ye Tüm Middleware'leri Kaydet

```python
# src/app.py – Middleware kayıt sırası önemli!
# LIFO (Last In, First Out): Son eklenen önce çalışır.

app.add_middleware(CORSMiddleware, ...)    # En son çalışır
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(TenantMiddleware)       # En önce çalışır

# Tüm router'ları kaydet
from src.routes import auth, academy, progress, favorites, events
from src.routes import announcements, resource_links, waitlist
from src.routes import admin_users, admin_stats, reference_codes, admin_maintenance

app.include_router(auth.router)
app.include_router(academy.router)
app.include_router(progress.router)
app.include_router(favorites.router)
app.include_router(events.router)
app.include_router(announcements.router)
app.include_router(resource_links.router)
app.include_router(waitlist.router)
app.include_router(admin_users.router)
app.include_router(admin_stats.router)
app.include_router(reference_codes.router)
app.include_router(admin_maintenance.router)
```

---

## 🚀 Adım 5: GitHub Actions CI/CD – `.github/workflows/deploy.yml`

```yaml
name: Deploy to Render

on:
  push:
    branches:
      - main        # Production deploy
      - staging     # Staging deploy (opsiyonel)

jobs:
  # ─── BACKEND ───
  lint-backend:
    name: Backend Lint & Test
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./backend

    steps:
      - uses: actions/checkout@v4

      - name: Python Setup
        uses: actions/setup-python@v5
        with:
          python-version: "3.12"
          cache: "pip"

      - name: Install Dependencies
        run: pip install -r requirements.txt

      - name: Run Linter (ruff)
        run: pip install ruff && ruff check src/

      - name: Run Tests
        run: pytest tests/ -v
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
          REDIS_URL: redis://localhost:6379/0
          APP_SECRET_KEY: test-secret-key-not-real
          RESEND_API_KEY: re_test

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: greenleaf_test
        ports: ["5432:5432"]
      redis:
        image: redis:7
        ports: ["6379:6379"]

  # ─── FRONTEND ───
  lint-frontend:
    name: Frontend Lint & Build
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./frontend

    steps:
      - uses: actions/checkout@v4

      - name: Node Setup
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: frontend/package-lock.json

      - name: Install Dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_BACKEND_URL: ${{ secrets.BACKEND_URL }}

  # ─── RENDER DEPLOY (sadece main branch'te) ───
  deploy:
    name: Trigger Render Deploy
    runs-on: ubuntu-latest
    needs: [lint-backend, lint-frontend]
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Deploy Backend to Render
        run: |
          curl -X POST "${{ secrets.RENDER_BACKEND_DEPLOY_HOOK }}" \
            -H "Content-Type: application/json"

      - name: Deploy Frontend to Render
        run: |
          curl -X POST "${{ secrets.RENDER_FRONTEND_DEPLOY_HOOK }}" \
            -H "Content-Type: application/json"
```

---

## 🌐 Adım 6: Render.com Yapılandırması (`render.yaml`)

```yaml
# repo kökünde oluştur: render.yaml
# Render otomatik olarak bu dosyayı okur.

services:
  # ─── BACKEND ───
  - type: web
    name: greenleaf-backend
    runtime: python
    repo: https://github.com/your-repo/greenleaf-website
    branch: main
    rootDir: backend
    buildCommand: pip install -r requirements.txt && alembic upgrade head
    startCommand: uvicorn src.app:app --host 0.0.0.0 --port 10000
    plan: professional
    envVars:
      - key: APP_ENV
        value: production
      - key: APP_SECRET_KEY
        sync: false   # Render dashboard'dan manuel gir
      - key: DATABASE_URL
        fromDatabase:
          name: greenleaf-postgres
          property: connectionString
      - key: REDIS_URL
        fromService:
          name: greenleaf-redis
          type: redis
          property: connectionString
      - key: RESEND_API_KEY
        sync: false
      - key: FRONTEND_URL
        value: https://tr.greenleafakademi.com
    disk:
      name: uploads
      mountPath: /var/data/uploads
      sizeGB: 5

  # ─── FRONTEND ───
  - type: web
    name: greenleaf-frontend
    runtime: node
    repo: https://github.com/your-repo/greenleaf-website
    branch: main
    rootDir: frontend
    buildCommand: npm ci && npm run build
    startCommand: npm start
    plan: professional
    envVars:
      - key: NEXT_PUBLIC_BACKEND_URL
        value: https://greenleaf-backend.onrender.com

  # ─── DATABASE ───
  - type: pserv
    name: greenleaf-postgres
    databaseName: greenleaf_db
    databaseUser: greenleaf
    plan: professional

  # ─── REDIS ───
  - type: redis
    name: greenleaf-redis
    plan: starter
    maxmemoryPolicy: allkeys-lru
```

---

## 🔐 Adım 7: GitHub Secrets Ayarları

Aşağıdaki secret'ları GitHub repo'nun `Settings → Secrets → Actions` kısmına ekle:

| Secret Adı | Değer |
|------------|-------|
| `RENDER_BACKEND_DEPLOY_HOOK` | Render backend service deploy hook URL'si |
| `RENDER_FRONTEND_DEPLOY_HOOK` | Render frontend service deploy hook URL'si |
| `BACKEND_URL` | `https://greenleaf-backend.onrender.com` |
| `TEST_DATABASE_URL` | Test ortamı için PostgreSQL URL |

---

## 📋 Adım 8: Production Checklist

Production'a almadan önce aşağıdakileri kontrol et:

```markdown
### Backend
- [ ] APP_ENV=production olarak set edildi
- [ ] APP_SECRET_KEY güçlü, uzun bir random string (32+ karakter)
- [ ] DATABASE_URL Render PostgreSQL connection string'i
- [ ] RESEND_API_KEY geçerli ve domain doğrulanmış
- [ ] /docs URL'si production'da devre dışı (config.py'de kontrol et)
- [ ] CORS allow_origins sadece production frontend URL'lerini içeriyor
- [ ] Alembic migration'ları en güncel halde (alembic upgrade head)

### Frontend  
- [ ] NEXT_PUBLIC_BACKEND_URL production backend URL'si
- [ ] next.config.ts'de production domain'leri tanımlı

### Render
- [ ] Backend ve Frontend servisleri Professional plan
- [ ] Disk (persistent storage) bağlı (uploads için)
- [ ] Custom domain'ler Render panelinde eklendi (tr.greenleafakademi.com)
- [ ] SSL sertifikası Render tarafından otomatik sağlandı

### GitHub Actions
- [ ] main branch'e push edildiğinde otomatik deploy çalışıyor
- [ ] Backend lint/test geçiyor
- [ ] Frontend build başarılı
```

---

## ✅ Kabul Kriterleri

- [ ] `POST /auth/login` endpoint'ine 6 kez yanlış şifre girince 429 dönüyor
- [ ] 15 dk sonra tekrar istek atılabiliyor
- [ ] Her response'da `X-Frame-Options: DENY` header'ı var
- [ ] Production'da `Strict-Transport-Security` header'ı var
- [ ] `main` branch'e push → GitHub Actions → Render deploy otomatik çalışıyor
- [ ] `alembic upgrade head` build sırasında otomatik çalışıyor
- [ ] `GET /health` endpoint'i production domain'de 200 döndürüyor
- [ ] Disk'e yüklenen görseller Render restart sonrası da mevcut
- [ ] Hareketsiz GUEST hesap temizleme cron job yapılandırılmış

---

## 📝 Junior Developer Notları

> **Rate limit neden middleware'de?** Her endpoint'te ayrı ayrı yazmak yerine tek noktadan yönetim. `RATE_LIMIT_CONFIGS` sözlüğünden endpoint'lere özel limitler kolayca değiştirilebilir.
>
> **`x-forwarded-for` neden kontrol edilmeli?** Render proxy arkasında çalışır. Gerçek kullanıcı IP'si `x-forwarded-for` header'ında gelir. `request.client.host` Render'ın iç IP'si olur, bu yüzden header'a bakmalıyız.
>
> **GitHub Secrets neden?** API key'ler, şifreler ve URL'ler `.yml` dosyasına düz metin yazılmaz. `${{ secrets.KEY_NAME }}` syntax'ı ile GitHub Secrets'tan okunur ve loglara yansımaz.
>
> **Render deploy hook nedir?** Render her servis için bir deploy trigger URL'si verir. Bu URL'e POST atınca manual deploy başlar. GitHub Actions bunu kullanarak Render'ın auto-detect'ini beklemeden anında deploy tetikler.
>
> **`allkeys-lru` Redis politikası neden?** Redis memory dolarsa en az kullanılan key'leri otomatik siler. Rate limit gibi geçici veriler için idealdir.

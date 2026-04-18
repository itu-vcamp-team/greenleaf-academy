# Task 3: Multi-tenancy Middleware ve Tenant Çözümleyici

## 🎯 Hedef
Gelen HTTP isteklerini subdomain bilgisine göre doğru tenant'a yönlendiren FastAPI middleware'ini yazmak, tenant bilgisini Redis'te cache'lemek ve tüm veritabanı sorgularının otomatik olarak `tenant_id` ile filtrelenmesini sağlamak.

## ⚠️ Ön Koşullar
- Task 1 ve Task 2 tamamlanmış olmalı (`Tenant` modeli ve `database.py` hazır)
- Redis container'ı çalışıyor olmalı

---

## 🧠 Çalışma Mantığı

```
İstek gelir: tr.greenleafakademi.com/api/...
     │
     ▼
TenantMiddleware
     │ Host header'dan "tr" slug'ını çıkarır
     │ Redis'te "tenant:tr" key'ini arar
     │   ├─ Cache HIT  → Tenant objesini Request.state.tenant'a ata
     │   └─ Cache MISS → DB'den sorgula → Redis'e yaz → Request.state.tenant'a ata
     │
     ▼
Route Handler
     │ get_current_tenant() Depends ile tenant'a erişir
     │ Repository'de tenant_id otomatik filtrelenir
     ▼
Response döner
```

---

## 📄 Adım 1: `src/middleware/tenant_middleware.py`

```python
import json
import redis.asyncio as aioredis
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from sqlalchemy import select
from src.datalayer.database import AsyncSessionFactory
from src.datalayer.model.db import Tenant
from src.config import get_settings
from src.logger import logger

settings = get_settings()

# Middleware dışında doğrudan istek yapmayan yollar
# (Bu path'ler için tenant çözümlemesi zorunlu değil)
SKIP_PATHS = ["/health", "/docs", "/openapi.json", "/redoc"]

# ÖNEMLİ: Yerel geliştirme ortamında subdomain olmayabilir.
# Bu durumda DEFAULT_TENANT_SLUG kullanılır.
DEFAULT_TENANT_SLUG = "tr"


class TenantMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        # Redis bağlantısını middleware başlarken kur
        self.redis_client = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True
        )

    async def dispatch(self, request: Request, call_next) -> Response:
        # Health check ve docs için tenant çözümleme atla
        if request.url.path in SKIP_PATHS:
            return await call_next(request)

        # Subdomain'i çözümle
        tenant_slug = self._extract_tenant_slug(request)

        # Tenant'ı Redis cache veya DB'den al
        tenant = await self._resolve_tenant(tenant_slug)

        if tenant is None:
            # Bilinmeyen subdomain isteği → 404
            return Response(
                content=json.dumps({
                    "detail": f"Tenant '{tenant_slug}' bulunamadı.",
                    "code": "TENANT_NOT_FOUND"
                }),
                status_code=404,
                media_type="application/json"
            )

        if not tenant["is_active"]:
            return Response(
                content=json.dumps({
                    "detail": "Bu bölge aktif değil.",
                    "code": "TENANT_INACTIVE"
                }),
                status_code=403,
                media_type="application/json"
            )

        # Tenant bilgisini request state'e yaz (route handler'lardan erişilebilir)
        request.state.tenant = tenant
        request.state.tenant_id = tenant["id"]
        request.state.tenant_slug = tenant["slug"]

        return await call_next(request)

    def _extract_tenant_slug(self, request: Request) -> str:
        """
        Host header'dan subdomain'i çıkarır.
        Örnekler:
          tr.greenleafakademi.com  → "tr"
          de.greenleafakademi.com  → "de"
          localhost:8000           → DEFAULT_TENANT_SLUG ("tr")
          greenleafakademi.com     → DEFAULT_TENANT_SLUG ("tr")
        """
        host = request.headers.get("host", "")

        # Port numarasını temizle
        host = host.split(":")[0]  # "tr.greenleafakademi.com:8000" → "tr.greenleafakademi.com"

        parts = host.split(".")
        # greenleafakademi.com → ["greenleafakademi", "com"] → 2 parça, subdomain yok
        # tr.greenleafakademi.com → ["tr", "greenleafakademi", "com"] → 3 parça, subdomain var
        # localhost → ["localhost"] → 1 parça, subdomain yok

        if len(parts) >= 3:
            return parts[0]  # "tr", "de" vs.
        else:
            return DEFAULT_TENANT_SLUG

    async def _resolve_tenant(self, slug: str) -> dict | None:
        """
        Önce Redis cache'e bak. Yoksa DB'den çek ve cache'e yaz.
        Cache süresi: 5 dakika (300 saniye)
        """
        cache_key = f"tenant:{slug}"

        # 1. Redis'e bak
        cached = await self.redis_client.get(cache_key)
        if cached:
            logger.debug(f"Tenant '{slug}' cache'den alındı.")
            return json.loads(cached)

        # 2. DB'den çek
        async with AsyncSessionFactory() as session:
            result = await session.execute(
                select(Tenant).where(Tenant.slug == slug)
            )
            tenant = result.scalar_one_or_none()

        if tenant is None:
            return None

        # Tenant'ı dict'e çevir (JSON serializable)
        tenant_dict = {
            "id": str(tenant.id),
            "slug": tenant.slug,
            "name": tenant.name,
            "is_active": tenant.is_active,
            "config": tenant.config or {},
        }

        # 3. Redis'e yaz (5 dakika TTL)
        await self.redis_client.setex(
            cache_key,
            300,  # saniye
            json.dumps(tenant_dict)
        )
        logger.debug(f"Tenant '{slug}' DB'den alındı ve cache'e yazıldı.")

        return tenant_dict
```

---

## 📄 Adım 2: `src/utils/tenant_deps.py` – FastAPI Dependency'si

Route'larda `Depends(get_current_tenant)` ile tenant bilgisine erişmek için:

```python
from fastapi import Request, HTTPException


def get_current_tenant(request: Request) -> dict:
    """
    Middleware tarafından set edilen tenant bilgisini döner.
    Middleware geçilmişse bu her zaman dolu olur.
    """
    tenant = getattr(request.state, "tenant", None)
    if not tenant:
        raise HTTPException(
            status_code=400,
            detail="Tenant bilgisi bulunamadı. Geçerli bir subdomain kullanın."
        )
    return tenant


def get_tenant_id(request: Request) -> str:
    """Sadece tenant_id string'ini döner."""
    tenant = get_current_tenant(request)
    return tenant["id"]
```

---

## 📄 Adım 3: `src/datalayer/repository/base_repository.py` – Tenant Filtreli Repository

Tüm repository'ler bu sınıfı kalıtır. `tenant_id` otomatik filtrelenir:

```python
import uuid
from typing import TypeVar, Generic, Type, Optional, List
from sqlmodel import SQLModel, select
from sqlalchemy.ext.asyncio import AsyncSession

ModelType = TypeVar("ModelType", bound=SQLModel)


class TenantRepository(Generic[ModelType]):
    """
    tenant_id gerektiren tüm modeller için temel repository sınıfı.
    
    Kullanım:
        class UserRepository(TenantRepository[User]):
            model = User
    """
    model: Type[ModelType]

    def __init__(self, session: AsyncSession, tenant_id: uuid.UUID):
        self.session = session
        self.tenant_id = tenant_id  # Tüm sorguya otomatik eklenir

    async def get_by_id(self, record_id: uuid.UUID) -> Optional[ModelType]:
        result = await self.session.execute(
            select(self.model).where(
                self.model.id == record_id,
                self.model.tenant_id == self.tenant_id  # zorunlu tenant filtresi
            )
        )
        return result.scalar_one_or_none()

    async def get_all(self, limit: int = 50, offset: int = 0) -> List[ModelType]:
        result = await self.session.execute(
            select(self.model)
            .where(self.model.tenant_id == self.tenant_id)
            .limit(limit)
            .offset(offset)
        )
        return result.scalars().all()

    async def create(self, data: dict) -> ModelType:
        # tenant_id'yi otomatik ekle
        data["tenant_id"] = self.tenant_id
        record = self.model(**data)
        self.session.add(record)
        await self.session.flush()  # commit etmeden ID üret
        await self.session.refresh(record)
        return record

    async def delete(self, record_id: uuid.UUID) -> bool:
        record = await self.get_by_id(record_id)
        if not record:
            return False
        await self.session.delete(record)
        return True
```

---

## 📄 Adım 4: `src/utils/tenant_cache.py` – Tenant Cache Temizleme

Admin tenant config'ini güncellediğinde cache'i temizlemek için:

```python
import redis.asyncio as aioredis
from src.config import get_settings

settings = get_settings()


async def invalidate_tenant_cache(slug: str):
    """
    Tenant config güncellendiğinde Redis cache'ini temizler.
    Sonraki istekte DB'den güncel veri çekilir.
    """
    r = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    await r.delete(f"tenant:{slug}")
    await r.aclose()
```

---

## 📄 Adım 5: Middleware'i `app.py`'ye Kaydet

```python
# src/app.py içine ekle:
from src.middleware.tenant_middleware import TenantMiddleware

app.add_middleware(TenantMiddleware)

# ÖNEMLİ: Middleware'ler son eklenen önce çalışır (LIFO).
# TenantMiddleware, CORSMiddleware'den SONRA eklenmelidir.
# Yani CORSMiddleware önce eklenmeli:
app.add_middleware(CORSMiddleware, ...)  # önce
app.add_middleware(TenantMiddleware)     # sonra
```

---

## 📄 Adım 6: Örnek Route'da Kullanım

Middleware kurulduktan sonra herhangi bir route'da tenant bilgisine şöyle erişilir:

```python
from fastapi import APIRouter, Depends
from src.utils.tenant_deps import get_current_tenant, get_tenant_id
from src.datalayer.database import get_db_session

router = APIRouter()

@router.get("/test-tenant")
async def test_tenant(
    tenant: dict = Depends(get_current_tenant),
    db = Depends(get_db_session),
):
    return {
        "tenant_slug": tenant["slug"],
        "tenant_name": tenant["name"],
        "config": tenant["config"],
    }
```

---

## ✅ Kabul Kriterleri

- [ ] `tr.localhost:8000/health` isteği `tenant: "tr"` bilgisini döndürüyor
- [ ] Bilinmeyen subdomain (örn: `xx.localhost:8000`) 404 dönüyor
- [ ] Redis'te `tenant:tr` key'i istek sonrası yazılıyor (`redis-cli GET tenant:tr` ile kontrol)
- [ ] İkinci istek Redis cache'den geliyor (DB sorgusu yok)
- [ ] Pasif tenant (is_active=False) 403 dönüyor
- [ ] `TenantRepository.get_all()` sadece kendi tenant'ına ait kayıtları döndürüyor

---

## 📝 Junior Developer Notları

> **Neden Redis?** Tenant bilgisi her request'te DB'den çekilirse yüksek trafikte veritabanı gereğinden fazla sorgu atar. Redis cache ile bu sorgu kaldırılır.
>
> **`request.state` nedir?** FastAPI/Starlette'de `request.state` her request'e özgü veri taşımak için kullanılır. Middleware'de yazdığın veri, aynı request'teki tüm route handler'larda okunabilir.
>
> **Yerel geliştirmede subdomain nasıl test edilir?** Tarayıcı `tr.localhost` adresini otomatik çözümler (çoğu OS'ta). Yoksa `/etc/hosts` dosyasına `127.0.0.1 tr.localhost` satırı ekle.
>
> **`LIFO` middleware sırası neden önemli?** `app.add_middleware()` çağrıları ters sırada çalışır. En son eklenen middleware önce çalışır. CORS middleware'i her zaman en başta çalışmalı, TenantMiddleware ondan sonra.

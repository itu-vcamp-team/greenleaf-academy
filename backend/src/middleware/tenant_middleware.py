import json
import redis.asyncio as aioredis
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from sqlalchemy import select
from src.datalayer.database import AsyncSessionFactory
from src.datalayer.model.db.tenant import Tenant
from src.config import get_settings
from src.logger import logger

settings = get_settings()

SKIP_PATHS = ["/health", "/docs", "/openapi.json", "/redoc", "/api/tenants"]
DEFAULT_TENANT_SLUG = "tr"


class TenantMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.redis_client = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True
        )

    async def dispatch(self, request: Request, call_next) -> Response:
        # Skip tenant resolution for infrastructure paths and CORS preflight
        if request.method == "OPTIONS" or request.url.path in SKIP_PATHS or request.url.path.startswith("/static"):
            return await call_next(request)

        # 1. Extract tenant slug
        tenant_slug = self._extract_tenant_slug(request)

        # 2. Resolve tenant (Cache -> DB)
        tenant = await self._resolve_tenant(tenant_slug)

        if tenant is None:
            return Response(
                content=json.dumps({
                    "detail": f"Tenant '{tenant_slug}' not found.",
                    "code": "TENANT_NOT_FOUND"
                }),
                status_code=404,
                media_type="application/json"
            )

        if not tenant["is_active"]:
            return Response(
                content=json.dumps({
                    "detail": "This region is currently inactive.",
                    "code": "TENANT_INACTIVE"
                }),
                status_code=403,
                media_type="application/json"
            )

        # 3. Store in request state for later use
        request.state.tenant = tenant
        request.state.tenant_id = tenant["id"]
        request.state.tenant_slug = tenant["slug"]

        return await call_next(request)

    def _extract_tenant_slug(self, request: Request) -> str:
        """
        Extract tenant slug from X-Tenant-ID header or subdomain.
        1. Priority: X-Tenant-ID header (sent by frontend)
        2. Fallback: Subdomain from Host header
        """
        # 1. Header Check
        header_slug = request.headers.get("x-tenant-id")
        if header_slug:
            return header_slug

        # 2. Host Subdomain Check
        host = request.headers.get("host", "")
        host = host.split(":")[0]  # Remove port

        parts = host.split(".")
        
        # Local development or top-level domain
        if len(parts) < 3:
            # Special case for tr.localhost (len=2)
            if len(parts) == 2 and parts[1] == "localhost":
                return parts[0]
            return DEFAULT_TENANT_SLUG
            
        # Ignore platform subdomains (like onrender.com)
        if "onrender.com" in host or "greenleaf-backend" in host:
            return DEFAULT_TENANT_SLUG

        return parts[0]

    async def _resolve_tenant(self, slug: str) -> dict | None:
        cache_key = f"tenant:{slug}"

        # 1. Check Redis
        try:
            cached = await self.redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
        except Exception as e:
            logger.error(f"Redis error in TenantMiddleware: {e}")

        # 2. Check DB
        async with AsyncSessionFactory() as session:
            stmt = select(Tenant).where(Tenant.slug == slug)
            result = await session.execute(stmt)
            tenant = result.scalar_one_or_none()

        if tenant is None:
            return None

        tenant_dict = {
            "id": str(tenant.id),
            "slug": tenant.slug,
            "name": tenant.name,
            "is_active": tenant.is_active,
            "config": tenant.config or {},
        }

        # 3. Write to Redis (300s TTL)
        try:
            await self.redis_client.setex(cache_key, 300, json.dumps(tenant_dict))
        except Exception as e:
            logger.error(f"Redis write error in TenantMiddleware: {e}")

        return tenant_dict

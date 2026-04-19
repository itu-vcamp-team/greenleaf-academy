from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.app_lifespan import lifespan
from src.config import get_settings

# Middleware imports
from src.middleware.tenant_middleware import TenantMiddleware
from src.middleware.rate_limit_middleware import RateLimitMiddleware
from src.middleware.security_headers_middleware import SecurityHeadersMiddleware

# Router imports
from src.routes.auth import router as auth_router
from src.routes.admin_maintenance import router as admin_maintenance_router

settings = get_settings()

app = FastAPI(
    title="Greenleaf Akademi API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.APP_ENV == "development" else None,
    redoc_url=None,
)

# --- Middleware Registration (LIFO Order) ---

# 1. CORS Middleware (Outermost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Security Headers Middleware
app.add_middleware(SecurityHeadersMiddleware)

# 3. Rate Limit Middleware
app.add_middleware(RateLimitMiddleware)

# 4. Tenant Middleware (Innermost - closest to router)
app.add_middleware(TenantMiddleware)


# --- Router Registration ---

# Public & Auth Routes
app.include_router(auth_router, prefix="/api")

# Admin & Maintenance Routes
app.include_router(admin_maintenance_router, prefix="/api")


# --- Health Check ---

@app.get("/health", tags=["System"])
async def health_check():
    """Service health status and environment info."""
    return {
        "status": "ok", 
        "env": settings.APP_ENV,
        "docs_enabled": settings.APP_ENV == "development"
    }

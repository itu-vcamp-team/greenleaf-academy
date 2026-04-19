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
from src.routes.academy import router as academy_router
from src.routes.progress import router as progress_router
from src.routes.favorites import router as favorites_router
from src.routes.events import router as events_router
from src.routes.reference_codes import router as reference_codes_router
from src.routes.admin_users import router as admin_users_router
from src.routes.announcements import router as announcements_router
from src.routes.resource_links import router as resources_router
from src.routes.waitlist import router as waitlist_router
from src.routes.admin_stats import router as admin_stats_router

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

# Academy & Interaction Routes
app.include_router(academy_router, prefix="/api")
app.include_router(progress_router, prefix="/api")
app.include_router(favorites_router, prefix="/api")
app.include_router(events_router, prefix="/api")

# Admin & Maintenance Routes
app.include_router(admin_maintenance_router, prefix="/api")
app.include_router(admin_users_router, prefix="/api")
app.include_router(admin_stats_router, prefix="/api")

# Content & Support Management (Admin Only)
app.include_router(announcements_router, prefix="/api")
app.include_router(resources_router, prefix="/api")
app.include_router(waitlist_router, prefix="/api")
app.include_router(reference_codes_router, prefix="/api")


# --- Health Check ---

@app.get("/health", tags=["System"])
async def health_check():
    """Service health status and environment info."""
    return {
        "status": "ok", 
        "env": settings.APP_ENV,
        "docs_enabled": settings.APP_ENV == "development"
    }

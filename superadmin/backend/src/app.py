"""
Greenleaf Superadmin API
Manages multiple Greenleaf Academy deployments.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.config import get_settings
from src.routes import auth, deployments, proxy

settings = get_settings()

app = FastAPI(
    title="Greenleaf Superadmin API",
    version="1.0.0",
    docs_url="/docs" if settings.APP_ENV == "development" else None,
    redoc_url=None,
)

# CORS — superadmin frontend URL
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(auth.router, prefix="/api")
app.include_router(deployments.router, prefix="/api")
app.include_router(proxy.router, prefix="/api")


@app.get("/health", tags=["System"])
async def health_check():
    return {"status": "ok", "service": "greenleaf-superadmin"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.app:app", host="0.0.0.0", port=9000, reload=True)

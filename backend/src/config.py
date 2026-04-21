from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # App
    APP_ENV: str = "development"  # "development" | "production"
    JWT_SECRET_KEY: str  # JWT imzalamak için, üretimde uzun random string

    # Database
    DATABASE_URL: str  # örn: postgresql+asyncpg://user:pass@localhost:5432/greenleaf
    
    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def fix_database_url_scheme(cls, v: str) -> str:
        """
        Render.com (ve Heroku) varsayılan olarak 'postgres://' formatında bir URL verir.
        SQLAlchemy 2.0+ ve asyncpg için bunu 'postgresql+asyncpg://' formatına çevirmemiz gerekir.
        """
        if v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql+asyncpg://", 1)
        if v.startswith("postgresql://") and "+asyncpg" not in v:
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    # Redis
    REDIS_URL: str  # örn: redis://localhost:6379/0

    # JWT
    JWT_ALGORITHM: str = "HS256"
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
    CORS_ALLOWED_ORIGIN_REGEX: str | None = None  # Production'da tüm subdomain'leri kapsar


@lru_cache()
def get_settings() -> Settings:
    return Settings()

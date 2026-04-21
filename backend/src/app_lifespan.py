import os
import subprocess
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from src.datalayer.database import create_tables
from src.config import get_settings
from src.logger import setup_logging, logger

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Uygulama başlarken
    setup_logging()
    logger.info("Greenleaf Backend başlatılıyor... (env: %s)", settings.APP_ENV)

    # 1. UPLOAD_DIR'i oluştur (Render Disk veya local)
    upload_dir = Path(settings.UPLOAD_DIR)
    try:
        upload_dir.mkdir(parents=True, exist_ok=True)
        logger.info("Upload dizini hazır: %s", upload_dir)
    except OSError as exc:
        # Render Disk production'da mount edilmiş olmalı.
        # Lokal dev'de /var/data yoksa sadece uyarı ver, sunucu başlasın.
        logger.warning(
            "Upload dizini oluşturulamadı (%s): %s — dosya yükleme özelliği çalışmayabilir.",
            upload_dir, exc
        )

    if settings.APP_ENV == "development":
        # Geliştirme ortamında SQLAlchemy ile tabloları oluştur (hızlı iterasyon)
        await create_tables()
        logger.info("Veritabanı tabloları (dev) oluşturuldu/doğrulandı.")
    else:
        # Production: Alembic migration'larını çalıştır
        logger.info("Alembic migration'ları çalıştırılıyor...")
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            logger.error("Alembic migration BAŞARISIZ:\n%s", result.stderr)
            raise RuntimeError(f"Alembic migration failed: {result.stderr}")
        logger.info("Alembic migration tamamlandı.\n%s", result.stdout)

    logger.info("Veritabanı bağlantısı hazır.")
    yield
    # Uygulama kapanırken
    logger.info("Greenleaf Backend kapatılıyor.")

import asyncio
from typing import Any

from arq.connections import RedisSettings

from src.config import get_settings
from src.services.mailing_service import MailingService
from src.logger import logger

settings = get_settings()

async def send_bulk_email_task(
    ctx: dict[str, Any],
    to: list[str],
    subject: str,
    html: str,
    attachments: list[dict] | None = None,
) -> bool:
    """
    ARQ task to send bulk emails using MailingService.
    If it fails, ARQ handles retries automatically.
    """
    logger.info(f"Worker processing bulk email task to {len(to)} recipients. Subject: {subject}")
    success = await MailingService._send_email(to, subject, html, attachments)
    if not success:
        # Raising exception triggers ARQ retry mechanism
        raise Exception(f"Task failed to send bulk email to {len(to)} recipients. Subject: {subject}")
    return True


class WorkerSettings:
    functions = [send_bulk_email_task]
    redis_settings = RedisSettings.from_dsn(settings.REDIS_URL)
    max_tries = 3
    job_timeout = 60

import redis.asyncio as aioredis
from src.config import get_settings
from src.logger import logger

settings = get_settings()


async def invalidate_tenant_cache(slug: str):
    """
    Clears the tenant cache in Redis.
    To be called whenever a tenant's configuration or active status is updated.
    """
    try:
        r = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True
        )
        await r.delete(f"tenant:{slug}")
        await r.aclose()
        logger.info(f"Invalidated cache for tenant: {slug}")
    except Exception as e:
        logger.error(f"Failed to invalidate tenant cache for {slug}: {e}")

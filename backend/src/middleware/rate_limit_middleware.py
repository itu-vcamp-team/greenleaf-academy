import redis.asyncio as aioredis
import json
import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from fastapi import Request, Response
from src.config import get_settings
from src.logger import logger

settings = get_settings()

# Rate limit configurations: (max_requests, window_seconds, block_seconds)
RATE_LIMIT_CONFIGS = {
    "/api/auth/login": (5, 900, 900),           # 5 attempts in 15m -> 15m block                                                  
    "/api/auth/register": (10, 3600, 1800),     # 10 attempts in 1h -> 30m block
    "/api/auth/forgot-password": (3, 3600, 3600),# 3 attempts in 1h -> 1h block
    "default": (100, 60, 0),                    # Default: 100 requests per minute
}

WHITELIST_PATHS = ["/api/health", "/docs", "/openapi.json"]


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Redis-based rate limiting middleware.
    Supports specific rules for sensitive endpoints and block functionality.
    """
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.redis = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
            socket_timeout=1.0,
            socket_connect_timeout=1.0,
            retry_on_timeout=False
        )

    async def dispatch(self, request: Request, call_next) -> Response:
        path = request.url.path

        # 1. Whitelist check
        if path in WHITELIST_PATHS:
            return await call_next(request)

        # 2. Get client IP (handle Render proxy headers)
        ip = request.headers.get("x-forwarded-for", request.client.host)
        ip = ip.split(",")[0].strip()

        # 3. Determine config
        config = RATE_LIMIT_CONFIGS.get("default")
        for prefix, cfg in RATE_LIMIT_CONFIGS.items():
            if prefix != "default" and path.startswith(prefix):
                config = cfg
                break
        
        max_requests, window_seconds, block_seconds = config

        # Rate limiting logic wrapped in try/except to avoid hanging if Redis is down
        try:
            # 4. Check if blocked
            block_key = f"rl_block:{ip}:{path}"
            if await self.redis.get(block_key):
                minutes = block_seconds // 60
                return Response(
                    content=json.dumps({
                        "detail": f"Emniyetiniz için kısa süreliğine kısıtlandınız. Lütfen {minutes} dakika sonra tekrar deneyin.",
                        "code": "RATE_LIMIT_EXCEEDED"
                    }),
                    status_code=429,
                    media_type="application/json",
                    headers={"Retry-After": str(block_seconds)},
                )

            # 5. Increment counter
            count_key = f"rl_count:{ip}:{path}"
            current_count = await self.redis.incr(count_key)

            if current_count == 1:
                await self.redis.expire(count_key, window_seconds)

            # 6. Check limit exceeded
            if current_count > max_requests:
                if block_seconds > 0:
                    await self.redis.setex(block_key, block_seconds, "1")
                
                await self.redis.delete(count_key)
                logger.warning(f"Rate limit exceeded: {ip} -> {path}")
                
                minutes = block_seconds // 60
                return Response(
                    content=json.dumps({
                        "detail": f"Emniyetiniz için kısa süreliğine kısıtlandınız. Lütfen {minutes} dakika sonra tekrar deneyin.",
                        "code": "RATE_LIMIT_EXCEEDED"
                    }),
                    status_code=429,
                    media_type="application/json",
                )
        except (aioredis.RedisError, ConnectionError, Exception) as e:
            logger.error(f"RateLimit Redis error: {e}. Bypassing rate limit for stability.")

        # 7. Proceed to next middleware/route
        response = await call_next(request)

        if settings.APP_ENV == "development":
            response.headers["X-RateLimit-Remaining"] = str(max_requests - current_count)

        return response

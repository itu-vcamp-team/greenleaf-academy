from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from fastapi import Request, Response
from src.config import get_settings

settings = get_settings()


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware that adds security-related HTTP headers to every response.
    Protects against XSS, Clickjacking, and MIME-type sniffing.
    """
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)

        # 1. HSTS (Strict-Transport-Security) - Only in production
        if settings.APP_ENV == "production":
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains"
            )

        # 2. Clickjacking protection
        response.headers["X-Frame-Options"] = "DENY"

        # 3. MIME type sniffing protection
        response.headers["X-Content-Type-Options"] = "nosniff"

        # 4. Referrer Policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # 5. Content Security Policy (CSP)
        # Allows self, YouTube embeds, and basic styles/scripts
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' https://www.youtube.com; "
            "frame-src https://www.youtube.com https://drive.google.com; "
            "img-src 'self' data: https://img.youtube.com https://i.ytimg.com; "
            "style-src 'self' 'unsafe-inline'; "
            "connect-src 'self';"
        )

        # 6. Permissions Policy
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=()"
        )

        return response

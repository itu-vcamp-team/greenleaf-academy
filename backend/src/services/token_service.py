from datetime import datetime, timedelta, timezone
import jwt
from src.config import get_settings

settings = get_settings()


class TokenService:
    """
    Service for JWT generation, verification and decoding.
    Single-tenant: tenant_id removed from tokens.
    """

    @staticmethod
    def create_access_token(user_id: str, role: str, jti: str) -> str:
        """Generates a short-lived access token (60 min)."""
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode = {
            "sub": user_id,
            "role": role,
            "jti": jti,
            "exp": expire,
            "type": "access"
        }
        return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

    @staticmethod
    def create_refresh_token(user_id: str, jti: str) -> str:
        """Generates a long-lived refresh token (30 days)."""
        expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        to_encode = {
            "sub": user_id,
            "jti": jti,
            "exp": expire,
            "type": "refresh"
        }
        return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

    @staticmethod
    def decode_token(token: str) -> dict:
        """Decodes and validates a JWT token."""
        try:
            return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        except jwt.PyJWTError:
            return None

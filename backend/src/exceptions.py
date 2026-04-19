class GreenleafError(Exception):
    """Base exception for all domain-specific errors."""
    def __init__(self, message: str, code: str = "INTERNAL_ERROR"):
        self.message = message
        self.code = code
        super().__init__(self.message)


class NotFoundError(GreenleafError):
    """Raised when a resource is not found."""
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, code="NOT_FOUND")


class ConflictError(GreenleafError):
    """Raised when there is a conflict (e.g., duplicate unique field)."""
    def __init__(self, message: str):
        super().__init__(message, code="CONFLICT")


class UnauthorizedError(GreenleafError):
    """Raised when authentication fails."""
    def __init__(self, message: str = "Unauthorized"):
        super().__init__(message, code="UNAUTHORIZED")


class ForbiddenError(GreenleafError):
    """Raised when user doesn't have enough permissions."""
    def __init__(self, message: str = "Forbidden"):
        super().__init__(message, code="FORBIDDEN")


class RateLimitExceededError(GreenleafError):
    """Raised when rate limit is reached."""
    def __init__(self, message: str, retry_after: int = 0):
        self.retry_after = retry_after
        super().__init__(message, code="RATE_LIMIT_EXCEEDED")

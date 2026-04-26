import hashlib

def hash_gl_username(username: str) -> str:
    """
    Deterministic SHA-256 hash for Greenleaf Global usernames.
    Ensures privacy while maintaining uniqueness checks.
    """
    if not username:
        return ""
    # Normalize username (lowercase) before hashing to prevent case-sensitive duplicates
    normalized = username.strip().lower()
    return hashlib.sha256(normalized.encode()).hexdigest()

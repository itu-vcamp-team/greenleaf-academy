"""
API routes module.
Contains all FastAPI router definitions.
"""

from .auth import router as auth_router
from .academy import router as academy_router
from .progress import router as progress_router
from .favorites import router as favorites_router
from .events import router as events_router
from .admin_maintenance import router as admin_maintenance_router
from .admin_users import router as admin_users_router
from .admin_stats import router as admin_stats_router
from .announcements import router as announcements_router
from .resource_links import router as resources_router
from .reference_codes import router as reference_codes_router

__all__ = [
    "auth_router",
    "academy_router",
    "progress_router",
    "favorites_router",
    "events_router",
    "admin_maintenance_router",
    "admin_users_router",
    "admin_stats_router",
    "announcements_router",
    "resources_router",
    "reference_codes_router",
]

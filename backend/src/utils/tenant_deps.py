import uuid
from fastapi import Request, HTTPException


def get_current_tenant(request: Request) -> dict:
    """
    Returns the tenant object stored in request state by TenantMiddleware.
    """
    tenant = getattr(request.state, "tenant", None)
    if not tenant:
        raise HTTPException(
            status_code=400,
            detail="Tenant context not found. Ensure you are using a valid subdomain/tenant."
        )
    return tenant


def get_current_tenant_id(request: Request) -> uuid.UUID:
    """
    Returns the tenant UUID.
    """
    tenant_id = getattr(request.state, "tenant_id", None)
    if not tenant_id:
        raise HTTPException(
            status_code=400,
            detail="Tenant ID context not found."
        )
    return uuid.UUID(tenant_id)

import uuid
import secrets
from typing import List, Optional
from src.datalayer.model.db.user import User, UserRole
from src.datalayer.repository.user_repository import UserRepository
from src.datalayer.repository.tenant_repository import TenantRepository


class AdminUserService:
    def __init__(
        self, 
        repo: UserRepository, 
        tenant_repo: TenantRepository
    ):
        self.repo = repo
        self.tenant_repo = tenant_repo

    async def get_pending_approvals(self, tenant_id: uuid.UUID) -> List[User]:
        """List verified but inactive guest users who want to be partners."""
        return await self.repo.get_pending_users(tenant_id)

    async def approve_partner(self, user_id: uuid.UUID, tenant_id: uuid.UUID) -> User:
        """
        Approves a guest and makes them a partner.
        Generates a unique Partner ID: GL-[SLUG]-[6-CHAR-HEX]
        """
        user = await self.repo.get_by_id(user_id)
        if not user or user.tenant_id != tenant_id:
            raise ValueError("User not found or access denied")
            
        if user.role == UserRole.PARTNER:
            return user # Already a partner

        tenant = await self.tenant_repo.get_by_id(tenant_id)
        if not tenant:
            raise ValueError("Tenant not found")
            
        slug = tenant.slug.upper()
        
        # Generate partner_id (GL-TR-XXXXXX)
        # We don't have a specific check loop here since partner_id is unique in DB
        # and chance of collision is low, but repository save will catch it.
        # However, for consistency with ReferenceCode, let's do a simple retry logic.
        
        partner_id = ""
        for _ in range(5):
            hex_part = secrets.token_hex(3).upper()
            temp_id = f"GL-{slug}-{hex_part}"
            
            # Check if this partner_id already exists
            existing = await self.repo.find_by(partner_id=temp_id)
            if not existing:
                partner_id = temp_id
                break
        
        if not partner_id:
            raise RuntimeError("Could not generate a unique partner ID")

        user.is_active = True
        user.role = UserRole.PARTNER
        user.partner_id = partner_id
        
        return await self.repo.save(user)

    async def reject_user(self, user_id: uuid.UUID, tenant_id: uuid.UUID) -> None:
        """Rejects a user and deletes the account (or keeps inactive)."""
        user = await self.repo.get_by_id(user_id)
        if not user or user.tenant_id != tenant_id:
            raise ValueError("User not found or access denied")
            
        # For simplicity, we just keep them inactive and unverified
        user.is_active = False
        user.is_verified = False
        await self.repo.save(user)

    async def list_users(
        self, 
        tenant_id: uuid.UUID, 
        role: Optional[UserRole] = None, 
        is_active: Optional[bool] = None
    ) -> List[User]:
        return await self.repo.get_tenant_users(tenant_id, role, is_active)

    async def toggle_user_active(self, user_id: uuid.UUID, tenant_id: uuid.UUID) -> User:
        user = await self.repo.get_by_id(user_id)
        if not user or user.tenant_id != tenant_id:
            raise ValueError("User not found or access denied")
            
        user.is_active = not user.is_active
        return await self.repo.save(user)

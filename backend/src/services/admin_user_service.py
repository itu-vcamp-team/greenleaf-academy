import uuid
import secrets
import math
from typing import List, Optional
from src.datalayer.model.db.user import User, UserRole
from src.datalayer.repository.user_repository import UserRepository


class AdminUserService:
    def __init__(self, repo: UserRepository):
        self.repo = repo

    async def get_pending_approvals(
        self,
        search: Optional[str] = None,
        sort_by: str = "created_at",
        sort_dir: str = "desc",
        page: int = 1,
        size: int = 50
    ) -> dict:
        """List verified but inactive users with inviter details."""
        items, total = await self.repo.get_pending_users(
            search=search, sort_by=sort_by, sort_dir=sort_dir, page=page, size=size
        )
        return {
            "items": items,
            "total": total,
            "page": page,
            "size": size,
            "pages": math.ceil(total / size) if size > 0 else 0
        }

    async def approve_partner(self, user_id: uuid.UUID) -> User:
        """
        Approves a guest and makes them a partner.
        Generates a unique Partner ID: GL-[6-CHAR-HEX]
        """
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise ValueError("User not found")

        if user.role == UserRole.PARTNER:
            return user  # Already a partner

        partner_id = ""
        for _ in range(5):
            hex_part = secrets.token_hex(3).upper()
            temp_id = f"GL-{hex_part}"

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

    async def reject_user(self, user_id: uuid.UUID) -> None:
        """Rejects a user and keeps them inactive."""
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise ValueError("User not found")

        user.is_active = False
        user.is_verified = False
        await self.repo.save(user)

    async def list_users(
        self,
        search: Optional[str] = None,
        role: Optional[UserRole] = None,
        is_active: Optional[bool] = None,
        sort_by: str = "created_at",
        sort_dir: str = "desc",
        page: int = 1,
        size: int = 50
    ) -> dict:
        """List all users with optional filtering."""
        items, total = await self.repo.get_users_paginated(
            search=search, role=role, is_active=is_active,
            sort_by=sort_by, sort_dir=sort_dir, page=page, size=size
        )
        return {
            "items": items,
            "total": total,
            "page": page,
            "size": size,
            "pages": math.ceil(total / size) if size > 0 else 0
        }

    async def list_event_guests(
        self,
        search: Optional[str] = None,
        sort_by: str = "created_at",
        sort_dir: str = "desc",
        page: int = 1,
        size: int = 50
    ) -> dict:
        """List unauthenticated event RSVP guests (people who filled name/email for event calendar invites)."""
        items, total = await self.repo.get_event_guests_paginated(
            search=search, sort_by=sort_by, sort_dir=sort_dir, page=page, size=size
        )
        return {
            "items": items,
            "total": total,
            "page": page,
            "size": size,
            "pages": math.ceil(total / size) if size > 0 else 0
        }

    async def toggle_user_active(self, user_id: uuid.UUID) -> User:
        """Toggle a user's active status."""
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise ValueError("User not found")

        user.is_active = not user.is_active
        return await self.repo.save(user)
    async def create_user(self, data: 'AdminCreateUserSchema') -> User:
        """
        Creates a new user directly (Admin or Partner).
        Used by local ADMINs.
        """
        from src.services.password_service import PasswordService
        import uuid

        # Check for existing user
        if await self.repo.get_by_email(data.email):
            raise ValueError("Email already in use")
        if await self.repo.get_by_username(data.username):
            raise ValueError("Username already in use")

        partner_id = None
        if data.role == UserRole.PARTNER:
            # Generate Partner ID
            for _ in range(5):
                hex_part = secrets.token_hex(3).upper()
                temp_id = f"GL-{hex_part}"
                existing = await self.repo.find_by(partner_id=temp_id)
                if not existing:
                    partner_id = temp_id
                    break
            if not partner_id:
                raise RuntimeError("Could not generate a unique partner ID")

        new_user = User(
            id=uuid.uuid4(),
            username=data.username,
            email=data.email,
            full_name=data.full_name,
            phone=data.phone,
            password_hash=PasswordService.hash_password(data.password),
            role=data.role,
            is_active=True,
            is_verified=True,
            partner_id=partner_id
        )

        return await self.repo.save(new_user)

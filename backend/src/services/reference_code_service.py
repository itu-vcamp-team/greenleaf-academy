import secrets
import uuid
from typing import List, Optional
from src.datalayer.model.db.reference_code import ReferenceCode
from src.datalayer.repository.reference_code_repository import ReferenceCodeRepository
from src.datalayer.repository.tenant_repository import TenantRepository


class ReferenceCodeService:
    def __init__(
        self, 
        repo: ReferenceCodeRepository, 
        tenant_repo: TenantRepository
    ):
        self.repo = repo
        self.tenant_repo = tenant_repo

    async def generate_code(self, user_id: uuid.UUID) -> ReferenceCode:
        """
        Generates a one-time invitation code: GL-[SLUG]-[6-CHAR-HEX]
        Retries up to 5 times if a collision occurs.
        """
        tenant = await self.tenant_repo.get_by_id(self.repo.tenant_id)
        if not tenant:
            raise ValueError("Tenant not found")
            
        slug = tenant.slug.upper()
        
        for _ in range(5):
            # 3 bytes hex = 6 characters
            random_part = secrets.token_hex(3).upper()
            code_str = f"GL-{slug}-{random_part}"
            
            # Check for collision
            existing = await self.repo.get_by_code(code_str)
            if not existing:
                new_code = ReferenceCode(
                    tenant_id=self.repo.tenant_id,
                    code=code_str,
                    created_by=user_id,
                    is_used=False
                )
                return await self.repo.save(new_code)
                
        raise RuntimeError("Failed to generate a unique reference code after 5 attempts")

    async def get_my_codes(self, user_id: uuid.UUID) -> List[ReferenceCode]:
        """Get codes created by the current partner."""
        return await self.repo.find_by(created_by=user_id)

    async def validate_code(self, code_str: str) -> Optional[ReferenceCode]:
        """Check if a code is valid and unused."""
        return await self.repo.get_unused_by_code(code_str)

from typing import List
from src.datalayer.model.db.tenant import Tenant
from src.datalayer.model.dto.tenant_dto import TenantResponse, TenantCreate


class TenantMapper:
    @staticmethod
    def model_to_dto(tenant: Tenant) -> TenantResponse:
        return TenantResponse.model_validate(tenant)

    @staticmethod
    def dto_to_model(dto: TenantCreate) -> Tenant:
        return Tenant(
            slug=dto.slug,
            name=dto.name,
            is_active=dto.is_active,
            config=dto.config
        )

    @staticmethod
    def models_to_dto_list(tenants: List[Tenant]) -> List[TenantResponse]:
        return [TenantMapper.model_to_dto(t) for t in tenants]

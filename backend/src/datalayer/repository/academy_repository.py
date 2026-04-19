from typing import List, Optional
from uuid import UUID
from sqlalchemy import select
from src.datalayer.model.db.academy_content import AcademyContent, ContentType
from src.datalayer.repository._base_repository import AsyncBaseRepository


class AcademyRepository(AsyncBaseRepository[AcademyContent]):
    def __init__(self, session):
        super().__init__(session, AcademyContent)

    async def get_by_type_and_locale(
        self, tenant_id: UUID, content_type: ContentType, locale: str
    ) -> List[AcademyContent]:
        stmt = (
            select(self.model_class)
            .where(
                self.model_class.tenant_id == tenant_id,
                self.model_class.type == content_type,
                self.model_class.locale == locale,
            )
            .order_by(self.model_class.order)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

from typing import Optional
from sqlalchemy import select
from src.datalayer.model.db.user import User
from src.datalayer.repository._base_repository import AsyncBaseRepository


class UserRepository(AsyncBaseRepository[User]):
    def __init__(self, session):
        super().__init__(session, User)

    async def get_by_email(self, email: str) -> Optional[User]:
        stmt = select(self.model_class).where(self.model_class.email == email)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_username(self, username: str) -> Optional[User]:
        stmt = select(self.model_class).where(self.model_class.username == username)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

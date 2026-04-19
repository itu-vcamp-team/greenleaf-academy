from typing import List
from src.datalayer.model.db.user import User
from src.datalayer.model.dto.user_dto import UserResponse, UserCreate


class UserMapper:
    @staticmethod
    def model_to_dto(user: User) -> UserResponse:
        return UserResponse.model_validate(user)

    @staticmethod
    def dto_to_model(dto: UserCreate, password_hash: str) -> User:
        return User(
            tenant_id=dto.tenant_id,
            role=dto.role,
            username=dto.username,
            email=dto.email,
            password_hash=password_hash,
            full_name=dto.full_name,
            phone=dto.phone,
            partner_id=dto.partner_id,
            inviter_id=dto.inviter_id
        )

    @staticmethod
    def models_to_dto_list(users: List[User]) -> List[UserResponse]:
        return [UserMapper.model_to_dto(u) for u in users]

from typing import List, Optional, Tuple
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from src.auth.db.models import UserModel

class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: str) -> Optional[UserModel]:
        result = await self.db.execute(select(UserModel).where(UserModel.id == user_id))
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Optional[UserModel]:
        result = await self.db.execute(select(UserModel).where(UserModel.email == email.lower().strip()))
        return result.scalar_one_or_none()

    async def list_users(
        self,
        role: Optional[str] = None,
        search: Optional[str] = None,
        offset: int = 0,
        limit: int = 20,
    ) -> Tuple[List[UserModel], int]:
        query = select(UserModel)
        count_query = select(func.count(UserModel.id))

        if role:
            query = query.where(UserModel.role == role)
            count_query = count_query.where(UserModel.role == role)

        if search:
            s = f"%{search.strip()}%"
            query = query.where((UserModel.name.ilike(s)) | (UserModel.email.ilike(s)) | (UserModel.phone.ilike(s)))
            count_query = count_query.where((UserModel.name.ilike(s)) | (UserModel.email.ilike(s)) | (UserModel.phone.ilike(s)))

        total_res = await self.db.execute(count_query)
        total = total_res.scalar_one() or 0

        res = await self.db.execute(query.order_by(UserModel.created_at.desc()).offset(offset).limit(limit))
        items = list(res.scalars().all())

        return items, total

    async def create(self, user: UserModel) -> UserModel:
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def update(self, user: UserModel) -> UserModel:
        await self.db.commit()
        await self.db.refresh(user)
        return user

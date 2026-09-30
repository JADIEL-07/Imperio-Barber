from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.catalog.db.models import ComboModel, ServiceModel

class CatalogRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    # Service operations
    async def get_service_by_id(self, service_id: str) -> Optional[ServiceModel]:
        result = await self.db.execute(select(ServiceModel).where(ServiceModel.id == service_id))
        return result.scalar_one_or_none()

    async def get_services_by_ids(self, service_ids: List[str]) -> List[ServiceModel]:
        result = await self.db.execute(select(ServiceModel).where(ServiceModel.id.in_(service_ids)))
        return list(result.scalars().all())

    async def list_services(self, active_only: bool = True) -> List[ServiceModel]:
        query = select(ServiceModel)
        if active_only:
            query = query.where(ServiceModel.is_active.is_(True))
        result = await self.db.execute(query.order_by(ServiceModel.name.asc()))
        return list(result.scalars().all())

    async def create_service(self, service: ServiceModel) -> ServiceModel:
        self.db.add(service)
        await self.db.commit()
        await self.db.refresh(service)
        return service

    async def update_service(self, service: ServiceModel) -> ServiceModel:
        await self.db.commit()
        await self.db.refresh(service)
        return service

    # Combo operations
    async def get_combo_by_id(self, combo_id: str) -> Optional[ComboModel]:
        result = await self.db.execute(select(ComboModel).where(ComboModel.id == combo_id))
        return result.scalar_one_or_none()

    async def list_combos(self, active_only: bool = True) -> List[ComboModel]:
        query = select(ComboModel)
        if active_only:
            query = query.where(ComboModel.is_active.is_(True))
        result = await self.db.execute(query.order_by(ComboModel.name.asc()))
        return list(result.scalars().all())

    async def create_combo(self, combo: ComboModel) -> ComboModel:
        self.db.add(combo)
        await self.db.commit()
        await self.db.refresh(combo)
        return combo

    async def update_combo(self, combo: ComboModel) -> ComboModel:
        await self.db.commit()
        await self.db.refresh(combo)
        return combo

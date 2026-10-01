from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from libs.common.errors import NotFoundError, ValidationError
from src.catalog.db.models import ComboModel, ServiceModel
from src.catalog.db.repository import CatalogRepository
from src.catalog.schemas.catalog import (
    ComboSchema,
    CreateComboPayload,
    CreateServicePayload,
    ServiceSchema,
    UpdateComboPayload,
    UpdateServicePayload,
)

class CatalogDomainService:
    def __init__(self, db: AsyncSession):
        self.repo = CatalogRepository(db)

    def _build_combo_schema(self, combo: ComboModel) -> ComboSchema:
        services_schemas = [ServiceSchema.model_validate(s) for s in combo.services]
        total_duration = sum(s.duration_minutes for s in services_schemas)
        original_price_sum = sum(s.price for s in services_schemas)
        savings = max(0, original_price_sum - combo.price)

        return ComboSchema(
            id=combo.id,
            name=combo.name,
            description=combo.description,
            services=services_schemas,
            price=combo.price,
            duration_minutes=total_duration,
            savings=savings,
            image_url=combo.image_url,
            is_active=combo.is_active,
        )

    # Services
    async def list_services(self, active_only: bool = True) -> List[ServiceSchema]:
        models = await self.repo.list_services(active_only=active_only)
        return [ServiceSchema.model_validate(m) for m in models]

    async def get_service(self, service_id: str) -> ServiceSchema:
        model = await self.repo.get_service_by_id(service_id)
        if not model:
            raise NotFoundError(f"Servicio con ID {service_id} no encontrado")
        return ServiceSchema.model_validate(model)

    async def create_service(self, payload: CreateServicePayload) -> ServiceSchema:
        model = ServiceModel(
            name=payload.name.strip(),
            description=payload.description.strip(),
            duration_minutes=payload.duration_minutes,
            price=payload.price,
            image_url=payload.image_url,
            is_active=payload.is_active,
        )
        saved = await self.repo.create_service(model)
        return ServiceSchema.model_validate(saved)

    async def update_service(self, service_id: str, payload: UpdateServicePayload) -> ServiceSchema:
        model = await self.repo.get_service_by_id(service_id)
        if not model:
            raise NotFoundError(f"Servicio con ID {service_id} no encontrado")

        if payload.name is not None:
            model.name = payload.name.strip()
        if payload.description is not None:
            model.description = payload.description.strip()
        if payload.duration_minutes is not None:
            model.duration_minutes = payload.duration_minutes
        if payload.price is not None:
            model.price = payload.price
        if payload.image_url is not None:
            model.image_url = payload.image_url
        if payload.is_active is not None:
            model.is_active = payload.is_active

        updated = await self.repo.update_service(model)
        return ServiceSchema.model_validate(updated)

    # Combos
    async def list_combos(self, active_only: bool = True) -> List[ComboSchema]:
        models = await self.repo.list_combos(active_only=active_only)
        return [self._build_combo_schema(m) for m in models]

    async def get_combo(self, combo_id: str) -> ComboSchema:
        model = await self.repo.get_combo_by_id(combo_id)
        if not model:
            raise NotFoundError(f"Combo con ID {combo_id} no encontrado")
        return self._build_combo_schema(model)

    async def create_combo(self, payload: CreateComboPayload) -> ComboSchema:
        services = await self.repo.get_services_by_ids(payload.service_ids)
        if len(services) != len(payload.service_ids):
            raise NotFoundError("Uno o más servicios especificados para el combo no existen")

        sum_price = sum(s.price for s in services)
        if payload.price > sum_price:
            raise ValidationError(
                f"El precio del combo (${payload.price}) no puede ser mayor que la suma de sus servicios individuales (${sum_price})"
            )

        combo_model = ComboModel(
            name=payload.name.strip(),
            description=payload.description.strip(),
            price=payload.price,
            image_url=payload.image_url,
            is_active=payload.is_active,
            services=services,
        )
        saved = await self.repo.create_combo(combo_model)
        return self._build_combo_schema(saved)

    async def update_combo(self, combo_id: str, payload: UpdateComboPayload) -> ComboSchema:
        combo = await self.repo.get_combo_by_id(combo_id)
        if not combo:
            raise NotFoundError(f"Combo con ID {combo_id} no encontrado")

        if payload.service_ids is not None:
            services = await self.repo.get_services_by_ids(payload.service_ids)
            if len(services) != len(payload.service_ids):
                raise NotFoundError("Uno o más servicios especificados no existen")
            combo.services = services

        if payload.name is not None:
            combo.name = payload.name.strip()
        if payload.description is not None:
            combo.description = payload.description.strip()
        if payload.price is not None:
            combo.price = payload.price
        if payload.image_url is not None:
            combo.image_url = payload.image_url
        if payload.is_active is not None:
            combo.is_active = payload.is_active

        # Validate price vs sum
        services_sum = sum(s.price for s in combo.services)
        if combo.price > services_sum:
            raise ValidationError(
                f"El precio del combo (${combo.price}) supera la suma de sus servicios (${services_sum})"
            )

        updated = await self.repo.update_combo(combo)
        return self._build_combo_schema(updated)

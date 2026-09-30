from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from libs.common.security import CurrentUser, get_optional_user, require_role
from src.catalog.db.session import get_db
from src.catalog.domain.catalog_service import CatalogDomainService
from src.catalog.schemas.catalog import (
    ComboSchema,
    CreateComboPayload,
    CreateServicePayload,
    ServiceSchema,
    UpdateComboPayload,
    UpdateServicePayload,
)

router = APIRouter(prefix="/catalog", tags=["catalog"])

# Services
@router.get("/services", response_model=List[ServiceSchema])
async def list_services(
    all: bool = Query(False),
    user: Optional[CurrentUser] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    active_only = True
    if all and user and user.role == "admin":
        active_only = False

    service = CatalogDomainService(db)
    return await service.list_services(active_only=active_only)

@router.post("/services", response_model=ServiceSchema, status_code=status.HTTP_201_CREATED)
async def create_service(
    payload: CreateServicePayload,
    current_user: CurrentUser = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db),
):
    service = CatalogDomainService(db)
    return await service.create_service(payload)

@router.patch("/services/{service_id}", response_model=ServiceSchema)
async def update_service(
    service_id: str,
    payload: UpdateServicePayload,
    current_user: CurrentUser = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db),
):
    service = CatalogDomainService(db)
    return await service.update_service(service_id, payload)

# Combos
@router.get("/combos", response_model=List[ComboSchema])
async def list_combos(
    all: bool = Query(False),
    user: Optional[CurrentUser] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    active_only = True
    if all and user and user.role == "admin":
        active_only = False

    service = CatalogDomainService(db)
    return await service.list_combos(active_only=active_only)

@router.post("/combos", response_model=ComboSchema, status_code=status.HTTP_201_CREATED)
async def create_combo(
    payload: CreateComboPayload,
    current_user: CurrentUser = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db),
):
    service = CatalogDomainService(db)
    return await service.create_combo(payload)

@router.patch("/combos/{combo_id}", response_model=ComboSchema)
async def update_combo(
    combo_id: str,
    payload: UpdateComboPayload,
    current_user: CurrentUser = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db),
):
    service = CatalogDomainService(db)
    return await service.update_combo(combo_id, payload)

import pytest
from libs.common.errors import ValidationError
from src.catalog.domain.catalog_service import CatalogDomainService
from src.catalog.schemas.catalog import CreateComboPayload, CreateServicePayload

@pytest.mark.unit
@pytest.mark.asyncio
async def test_create_services_and_combo_with_savings_calculation(db_session):
    service = CatalogDomainService(db_session)

    s1 = await service.create_service(CreateServicePayload(
        name="Corte Signature Aura",
        description="Diagnóstico capilar + fade",
        duration_minutes=45,
        price=75000,
    ))

    s2 = await service.create_service(CreateServicePayload(
        name="Ritual Afeitado Imperial",
        description="Vapor ozono + navaja",
        duration_minutes=40,
        price=60000,
    ))

    combo = await service.create_combo(CreateComboPayload(
        name="Combo Presidencial Black",
        description="Corte + Barba spa",
        service_ids=[s1.id, s2.id],
        price=120000,
    ))

    assert combo.duration_minutes == 85
    assert combo.price == 120000
    assert combo.savings == 15000 # (75000 + 60000) - 120000
    assert len(combo.services) == 2

@pytest.mark.unit
@pytest.mark.asyncio
async def test_combo_price_exceeding_sum_raises_validation_error(db_session):
    service = CatalogDomainService(db_session)

    s1 = await service.create_service(CreateServicePayload(
        name="Corte Simple",
        duration_minutes=30,
        price=40000,
    ))

    with pytest.raises(ValidationError):
        await service.create_combo(CreateComboPayload(
            name="Combo Invalido",
            service_ids=[s1.id],
            price=50000, # mayor que 40000
        ))

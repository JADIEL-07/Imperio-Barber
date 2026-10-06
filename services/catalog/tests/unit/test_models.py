import pytest
from sqlalchemy import select

from src.catalog.db.models import ComboModel, ServiceModel


def _service(name: str, price: int, duration: int = 45) -> ServiceModel:
    return ServiceModel(name=name, duration_minutes=duration, price=price)


@pytest.mark.unit
@pytest.mark.asyncio
async def test_service_model_defaults(db_session):
    svc = ServiceModel(name="Corte", duration_minutes=30, price=35000)
    db_session.add(svc)
    await db_session.commit()

    assert svc.description == ""
    assert svc.is_active is True
    assert svc.image_url is None
    assert len(svc.id) == 36


@pytest.mark.unit
@pytest.mark.asyncio
async def test_combo_links_services_many_to_many(db_session):
    corte = _service("Corte", 35000)
    barba = _service("Barba", 20000, duration=20)
    combo = ComboModel(name="Ritual", price=50000, services=[corte, barba])
    db_session.add(combo)
    await db_session.commit()

    result = await db_session.execute(select(ComboModel).where(ComboModel.id == combo.id))
    loaded = result.scalar_one()
    assert {s.name for s in loaded.services} == {"Corte", "Barba"}

    # Un servicio puede pertenecer a varios combos.
    otro = ComboModel(name="Express", price=30000, services=[corte])
    db_session.add(otro)
    await db_session.commit()
    await db_session.refresh(corte, attribute_names=["combos"])
    assert {c.name for c in corte.combos} == {"Ritual", "Express"}


@pytest.mark.unit
@pytest.mark.asyncio
async def test_deleting_combo_keeps_its_services(db_session):
    corte = _service("Corte", 35000)
    combo = ComboModel(name="Ritual", price=35000, services=[corte])
    db_session.add(combo)
    await db_session.commit()

    await db_session.delete(combo)
    await db_session.commit()

    remaining = (await db_session.execute(select(ServiceModel))).scalars().all()
    assert [s.name for s in remaining] == ["Corte"]


@pytest.mark.unit
@pytest.mark.asyncio
async def test_combo_model_defaults(db_session):
    combo = ComboModel(name="Básico", price=10000, services=[_service("Corte", 10000)])
    db_session.add(combo)
    await db_session.commit()

    assert combo.description == ""
    assert combo.is_active is True

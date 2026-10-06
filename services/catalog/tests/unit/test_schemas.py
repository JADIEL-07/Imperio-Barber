import pytest
from pydantic import ValidationError

from src.catalog.schemas.catalog import (
    CreateComboPayload,
    CreateServicePayload,
    UpdateServicePayload,
)


@pytest.mark.unit
def test_create_service_accepts_valid_payload():
    payload = CreateServicePayload(name="Corte Signature", duration_minutes=45, price=75000)
    assert payload.is_active is True
    assert payload.description == ""


@pytest.mark.unit
@pytest.mark.parametrize("duration", [0, -5, 481])
def test_create_service_rejects_duration_out_of_range(duration):
    with pytest.raises(ValidationError):
        CreateServicePayload(name="Corte", duration_minutes=duration, price=1000)


@pytest.mark.unit
def test_create_service_accepts_maximum_duration():
    assert CreateServicePayload(name="Ritual largo", duration_minutes=480, price=1000).duration_minutes == 480


@pytest.mark.unit
def test_create_service_rejects_negative_price():
    with pytest.raises(ValidationError):
        CreateServicePayload(name="Corte", duration_minutes=30, price=-1)


@pytest.mark.unit
def test_create_service_rejects_single_character_name():
    with pytest.raises(ValidationError):
        CreateServicePayload(name="C", duration_minutes=30, price=1000)


@pytest.mark.unit
def test_update_service_allows_empty_payload():
    payload = UpdateServicePayload()
    assert payload.model_dump(exclude_none=True) == {}


@pytest.mark.unit
def test_create_combo_requires_at_least_one_service():
    with pytest.raises(ValidationError):
        CreateComboPayload(name="Ritual", service_ids=[], price=10000)


@pytest.mark.unit
def test_create_combo_accepts_service_ids():
    payload = CreateComboPayload(name="Ritual", service_ids=["a", "b"], price=10000)
    assert payload.service_ids == ["a", "b"]

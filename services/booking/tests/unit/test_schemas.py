import pytest
from pydantic import ValidationError

from src.booking.schemas.booking import (
    BarberScheduleSchema,
    CreateAppointmentPayload,
    UpdateAppointmentPayload,
    UpdateBarberPayload,
    UpdateBookingSettingsPayload,
)


@pytest.mark.unit
def test_schedule_accepts_hh_mm_format():
    horario = BarberScheduleSchema(weekday=0, start="08:00", end="20:00")
    assert horario.start == "08:00"


@pytest.mark.unit
@pytest.mark.parametrize("hora", ["8:00", "08-00", "0800", "08:0"])
def test_schedule_rejects_wrong_time_format(hora):
    with pytest.raises(ValidationError):
        BarberScheduleSchema(weekday=0, start=hora, end="20:00")


@pytest.mark.unit
@pytest.mark.parametrize("dia", [-1, 7])
def test_schedule_rejects_weekday_out_of_range(dia):
    with pytest.raises(ValidationError):
        BarberScheduleSchema(weekday=dia, start="08:00", end="20:00")


@pytest.mark.unit
@pytest.mark.parametrize("tasa", [-0.1, 1.5])
def test_barber_commission_must_be_a_fraction(tasa):
    with pytest.raises(ValidationError):
        UpdateBarberPayload(commission_rate=tasa)


@pytest.mark.unit
def test_barber_commission_accepts_valid_fraction():
    assert UpdateBarberPayload(commission_rate=0.4).commission_rate == 0.4


@pytest.mark.unit
@pytest.mark.parametrize("minutos", [4, 61])
def test_slot_minutes_must_be_between_5_and_60(minutos):
    with pytest.raises(ValidationError):
        UpdateBookingSettingsPayload(slot_minutes=minutos)


@pytest.mark.unit
def test_cancel_min_hours_must_be_between_0_and_48():
    with pytest.raises(ValidationError):
        UpdateBookingSettingsPayload(cancel_min_hours=49)
    assert UpdateBookingSettingsPayload(cancel_min_hours=0).cancel_min_hours == 0


@pytest.mark.unit
def test_create_appointment_parses_iso_datetime_with_offset():
    cita = CreateAppointmentPayload(start="2026-12-01T10:00:00-05:00", service_ids=["svc-1"])
    assert cita.start.utcoffset().total_seconds() == -5 * 3600


@pytest.mark.unit
def test_update_appointment_rejects_unknown_status():
    with pytest.raises(ValidationError):
        UpdateAppointmentPayload(status="eliminada")


@pytest.mark.unit
def test_update_appointment_accepts_each_valid_status():
    for estado in ["pending", "confirmed", "completed", "cancelled", "no_show"]:
        assert UpdateAppointmentPayload(status=estado).status == estado

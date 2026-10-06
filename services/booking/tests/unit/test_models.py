from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import select

from src.booking.db.models import (
    AppointmentItemModel,
    AppointmentModel,
    BarberModel,
    BarberScheduleModel,
    BookingSettingsModel,
    CommissionPayoutModel,
)

INICIO = datetime(2026, 12, 1, 15, 0, tzinfo=timezone.utc)


def _cita(barber_id: str, **overrides) -> AppointmentModel:
    datos = {
        "client_id": "cliente-1",
        "client_name": "Ana Lopez",
        "client_phone": "3001234567",
        "barber_id": barber_id,
        "barber_name": "Carlos",
        "start_time": INICIO,
        "end_time": INICIO + timedelta(minutes=45),
        "total_price": 75000,
    }
    datos.update(overrides)
    return AppointmentModel(**datos)


@pytest.mark.unit
@pytest.mark.asyncio
async def test_barber_model_defaults(db_session):
    barber = BarberModel(name="Mateo Silva")
    db_session.add(barber)
    await db_session.commit()

    assert barber.commission_rate == 0.0
    assert barber.is_active is True
    assert barber.phone == ""
    assert barber.avatar_url is None


@pytest.mark.unit
@pytest.mark.asyncio
async def test_deleting_barber_removes_its_schedules(db_session):
    barber = BarberModel(name="Mateo Silva")
    barber.schedules = [
        BarberScheduleModel(weekday=0, start_time="08:00", end_time="20:00"),
        BarberScheduleModel(weekday=1, start_time="08:00", end_time="20:00"),
    ]
    db_session.add(barber)
    await db_session.commit()

    await db_session.delete(barber)
    await db_session.commit()

    restantes = (await db_session.execute(select(BarberScheduleModel))).scalars().all()
    assert restantes == []


@pytest.mark.unit
@pytest.mark.asyncio
async def test_appointment_defaults_and_snapshot_fields(db_session):
    barber = BarberModel(name="Carlos King")
    db_session.add(barber)
    await db_session.commit()

    cita = _cita(barber.id)
    db_session.add(cita)
    await db_session.commit()

    assert cita.status == "confirmed"
    assert cita.checked_in_at is None
    assert cita.commission_amount is None
    assert cita.commission_paid is False


@pytest.mark.unit
@pytest.mark.asyncio
async def test_deleting_appointment_removes_its_items(db_session):
    barber = BarberModel(name="Carlos King")
    db_session.add(barber)
    await db_session.commit()

    cita = _cita(barber.id)
    cita.items = [AppointmentItemModel(name="Corte", duration_minutes=45, price=75000)]
    db_session.add(cita)
    await db_session.commit()

    await db_session.delete(cita)
    await db_session.commit()

    assert (await db_session.execute(select(AppointmentItemModel))).scalars().all() == []


@pytest.mark.unit
@pytest.mark.asyncio
async def test_commission_payout_belongs_to_barber(db_session):
    barber = BarberModel(name="Carlos King", commission_rate=0.4)
    db_session.add(barber)
    await db_session.commit()

    pago = CommissionPayoutModel(barber_id=barber.id, amount=30000, appointments_count=1)
    db_session.add(pago)
    await db_session.commit()

    await db_session.refresh(barber, attribute_names=["commission_payouts"])
    assert [p.amount for p in barber.commission_payouts] == [30000]


@pytest.mark.unit
@pytest.mark.asyncio
async def test_booking_settings_defaults(db_session):
    settings = BookingSettingsModel()
    db_session.add(settings)
    await db_session.commit()

    assert settings.cancel_min_hours == 2
    assert settings.slot_minutes == 15
    assert set(settings.opening_hours) == {"0", "1", "2", "3", "4", "5", "6"}
    assert settings.opening_hours["6"] == {"open": "10:00", "close": "18:00"}

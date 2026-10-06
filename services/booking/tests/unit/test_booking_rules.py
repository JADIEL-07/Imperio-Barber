from datetime import date, datetime, timedelta, timezone

import pytest

from src.booking.db.models import AppointmentModel, BarberModel, BarberTimeOffModel, BookingSettingsModel
from src.booking.domain.booking_service import BOGOTA_TZ, BookingDomainService


def _cita(status: str, horas_hasta_inicio: float) -> AppointmentModel:
    inicio = datetime.now(timezone.utc) + timedelta(hours=horas_hasta_inicio)
    # Sin base de datos: los valores por defecto de la columna (id, commission_paid)
    # no se asignan hasta insertar, así que se pasan explícitamente.
    return AppointmentModel(
        id="cita-1",
        client_id="cliente-1",
        client_name="Ana Lopez",
        client_phone="",
        barber_id="barbero-1",
        barber_name="Carlos",
        start_time=inicio,
        end_time=inicio + timedelta(minutes=45),
        total_price=75000,
        status=status,
        commission_paid=False,
    )


def _dominio(db) -> BookingDomainService:
    return BookingDomainService(db)


# --- Cancelación: se bloquea a menos de cancel_min_hours (2 por defecto) ---

@pytest.mark.unit
def test_appointment_can_be_cancelled_with_more_than_two_hours_notice(db_session):
    cita = _cita("confirmed", horas_hasta_inicio=5)
    assert _dominio(db_session)._to_schema(cita, cancel_min_hours=2).can_cancel is True


@pytest.mark.unit
def test_appointment_cannot_be_cancelled_with_less_than_two_hours_notice(db_session):
    cita = _cita("confirmed", horas_hasta_inicio=1)
    assert _dominio(db_session)._to_schema(cita, cancel_min_hours=2).can_cancel is False


@pytest.mark.unit
def test_completed_appointment_cannot_be_cancelled(db_session):
    cita = _cita("completed", horas_hasta_inicio=10)
    assert _dominio(db_session)._to_schema(cita, cancel_min_hours=2).can_cancel is False


@pytest.mark.unit
def test_cancellation_window_is_configurable(db_session):
    cita = _cita("pending", horas_hasta_inicio=3)
    assert _dominio(db_session)._to_schema(cita, cancel_min_hours=2).can_cancel is True
    assert _dominio(db_session)._to_schema(cita, cancel_min_hours=4).can_cancel is False


# --- Disponibilidad: citas activas y bloqueos ocupan turnos ---

def _proximo_lunes() -> date:
    """Un lunes a 3+ días de hoy: el horario de lunes (08:00-21:00) es estable para las pruebas."""
    fecha = (datetime.now(BOGOTA_TZ) + timedelta(days=3)).date()
    while fecha.weekday() != 0:
        fecha += timedelta(days=1)
    return fecha


async def _barbero(db, nombre: str = "Mateo Silva") -> BarberModel:
    return await BookingDomainService(db).repo.create_barber(BarberModel(name=nombre, is_active=True))


def _horas(slots) -> set:
    return {datetime.fromisoformat(s.start).strftime("%H:%M") for s in slots}


@pytest.mark.unit
@pytest.mark.asyncio
async def test_availability_lists_slots_within_opening_hours(db_session):
    barbero = await _barbero(db_session)
    fecha = _proximo_lunes()

    slots = await BookingDomainService(db_session).get_availability(fecha, barbero.id, duration_minutes=45)

    horas = _horas(slots)
    assert "08:00" in horas
    assert "20:30" not in horas  # 45 min no caben después del cierre de las 21:00
    assert all(s.barber_id == barbero.id for s in slots)


@pytest.mark.unit
@pytest.mark.asyncio
async def test_existing_appointment_blocks_overlapping_slots(db_session):
    barbero = await _barbero(db_session)
    fecha = _proximo_lunes()
    inicio = datetime(fecha.year, fecha.month, fecha.day, 10, 0, tzinfo=BOGOTA_TZ)
    db_session.add(
        AppointmentModel(
            client_id="cliente-1",
            client_name="Ana Lopez",
            client_phone="",
            barber_id=barbero.id,
            barber_name=barbero.name,
            start_time=inicio,
            end_time=inicio + timedelta(minutes=45),
            total_price=75000,
            status="confirmed",
        )
    )
    await db_session.commit()

    slots = await BookingDomainService(db_session).get_availability(fecha, barbero.id, duration_minutes=45)
    horas = _horas(slots)

    assert "10:00" not in horas
    assert "10:15" not in horas
    assert "10:30" not in horas
    assert "10:45" in horas  # empieza justo cuando termina la cita


@pytest.mark.unit
@pytest.mark.asyncio
async def test_cancelled_appointment_frees_its_slot(db_session):
    barbero = await _barbero(db_session)
    fecha = _proximo_lunes()
    inicio = datetime(fecha.year, fecha.month, fecha.day, 10, 0, tzinfo=BOGOTA_TZ)
    db_session.add(
        AppointmentModel(
            client_id="cliente-1",
            client_name="Ana Lopez",
            client_phone="",
            barber_id=barbero.id,
            barber_name=barbero.name,
            start_time=inicio,
            end_time=inicio + timedelta(minutes=45),
            total_price=75000,
            status="cancelled",
        )
    )
    await db_session.commit()

    slots = await BookingDomainService(db_session).get_availability(fecha, barbero.id, duration_minutes=45)
    assert "10:00" in _horas(slots)


@pytest.mark.unit
@pytest.mark.asyncio
async def test_time_off_blocks_slots(db_session):
    barbero = await _barbero(db_session)
    fecha = _proximo_lunes()
    inicio = datetime(fecha.year, fecha.month, fecha.day, 14, 0, tzinfo=BOGOTA_TZ)
    db_session.add(
        BarberTimeOffModel(
            barber_id=barbero.id,
            start_time=inicio,
            end_time=inicio + timedelta(hours=2),
            reason="Permiso",
        )
    )
    await db_session.commit()

    slots = await BookingDomainService(db_session).get_availability(fecha, barbero.id, duration_minutes=45)
    horas = _horas(slots)

    assert "14:00" not in horas
    assert "15:30" not in horas
    assert "16:00" in horas


@pytest.mark.unit
@pytest.mark.asyncio
async def test_inactive_barber_has_no_availability(db_session):
    barbero = await BookingDomainService(db_session).repo.create_barber(
        BarberModel(name="Inactivo", is_active=False)
    )
    slots = await BookingDomainService(db_session).get_availability(_proximo_lunes(), barbero.id, duration_minutes=45)
    assert slots == []


@pytest.mark.unit
@pytest.mark.asyncio
async def test_default_settings_are_created_on_first_use(db_session):
    service = BookingDomainService(db_session)
    settings = await service.repo.get_or_create_settings()
    assert settings.slot_minutes == 15
    assert settings.cancel_min_hours == 2
    assert (await service.repo.get_or_create_settings()).id == settings.id


# --- Comisión: se congela al completar la cita ---

@pytest.mark.unit
@pytest.mark.asyncio
async def test_commission_rate_change_does_not_alter_completed_snapshot(db_session):
    barbero = await BookingDomainService(db_session).repo.create_barber(
        BarberModel(name="Carlos King", commission_rate=0.4, is_active=True)
    )
    cita = AppointmentModel(
        client_id="cliente-1",
        client_name="Ana Lopez",
        client_phone="",
        barber_id=barbero.id,
        barber_name=barbero.name,
        start_time=datetime(2026, 12, 1, 15, 0, tzinfo=timezone.utc),
        end_time=datetime(2026, 12, 1, 15, 45, tzinfo=timezone.utc),
        total_price=75000,
        status="completed",
        commission_amount=30000,
    )
    db_session.add(cita)
    await db_session.commit()

    barbero.commission_rate = 0.6
    await db_session.commit()

    resumen = await BookingDomainService(db_session).get_barber_commissions(barbero.id)
    assert resumen.pending_amount == 30000

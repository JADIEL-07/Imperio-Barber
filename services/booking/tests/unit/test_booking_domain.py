from datetime import date, datetime, timedelta, timezone
import pytest
from libs.common.errors import ConflictError
from libs.common.security import CurrentUser
from src.booking.db.models import BarberModel
from src.booking.domain.booking_service import BookingDomainService
from src.booking.schemas.booking import CreateAppointmentPayload

BOGOTA_TZ = timezone(timedelta(hours=-5))

FAKE_SERVICES = [
    {"id": "svc-1", "name": "Corte Signature Aura", "duration_minutes": 45, "price": 75000, "is_active": True},
]

def _mock_catalog(monkeypatch, services=None, combos=None):
    """booking resuelve service_ids/combo_id llamando por HTTP al microservicio
    catalog; en pruebas unitarias se reemplaza esa llamada por datos fijos."""

    async def fake_list_services(self):
        return services if services is not None else FAKE_SERVICES

    async def fake_list_combos(self):
        return combos if combos is not None else []

    monkeypatch.setattr(
        "src.booking.domain.booking_service.CatalogClient.list_services", fake_list_services
    )
    monkeypatch.setattr(
        "src.booking.domain.booking_service.CatalogClient.list_combos", fake_list_combos
    )

@pytest.mark.unit
@pytest.mark.asyncio
async def test_booking_creation_and_slot_conflict_prevention(db_session, monkeypatch):
    _mock_catalog(monkeypatch)
    service = BookingDomainService(db_session)
    barber = await service.repo.create_barber(BarberModel(name="Mateo Silva", phone="3001234567", is_active=True))

    user = CurrentUser(id="user-1", name="Juan Perez", email="juan@test.com", phone="3009998877", role="client", is_active=True)
    future_start = datetime(2026, 10, 24, 11, 15, tzinfo=BOGOTA_TZ)

    appt = await service.create_appointment(
        current_user=user,
        payload=CreateAppointmentPayload(barber_id=barber.id, start=future_start, service_ids=["svc-1"]),
    )

    assert appt.id is not None
    assert appt.total_price == 75000
    assert appt.status == "confirmed"

    # Attempting duplicate booking in the same slot MUST raise 409 Conflict
    user2 = CurrentUser(id="user-2", name="Pedro Gomez", email="pedro@test.com", phone="3001112233", role="client", is_active=True)
    with pytest.raises(ConflictError):
        await service.create_appointment(
            current_user=user2,
            payload=CreateAppointmentPayload(barber_id=barber.id, start=future_start, service_ids=["svc-1"]),
        )

@pytest.mark.unit
@pytest.mark.asyncio
async def test_completing_appointment_snapshots_commission(db_session, monkeypatch):
    _mock_catalog(monkeypatch)
    service = BookingDomainService(db_session)
    barber = await service.repo.create_barber(
        BarberModel(name="Carlos King", phone="3001234567", is_active=True, commission_rate=0.4)
    )

    user = CurrentUser(id="user-3", name="Ana Diaz", email="ana@test.com", phone="3005554433", role="client", is_active=True)
    start = datetime(2026, 10, 25, 9, 0, tzinfo=BOGOTA_TZ)

    appt = await service.create_appointment(
        current_user=user,
        payload=CreateAppointmentPayload(barber_id=barber.id, start=start, service_ids=["svc-1"]),
    )
    assert appt.commission_amount is None

    from src.booking.schemas.booking import UpdateAppointmentPayload

    admin = CurrentUser(id="admin-1", name="Admin", email="admin@test.com", phone="", role="admin", is_active=True)
    updated = await service.update_appointment(
        appt.id, current_user=admin, payload=UpdateAppointmentPayload(status="completed")
    )

    assert updated.status == "completed"
    assert updated.commission_amount == 30000  # 75000 * 0.4
    assert updated.commission_paid is False

    summary = await service.get_barber_commissions(barber.id)
    assert summary.pending_amount == 30000
    assert summary.pending_count == 1
    assert summary.paid_amount == 0

    payout = await service.pay_barber_commissions(barber.id)
    assert payout.amount == 30000
    assert payout.appointments_count == 1

    summary_after = await service.get_barber_commissions(barber.id)
    assert summary_after.pending_amount == 0
    assert summary_after.paid_amount == 30000

@pytest.mark.unit
@pytest.mark.asyncio
async def test_check_in_appointment(db_session, monkeypatch):
    _mock_catalog(monkeypatch)
    service = BookingDomainService(db_session)
    barber = await service.repo.create_barber(BarberModel(name="Andres Razor", phone="3001234567", is_active=True))

    user = CurrentUser(id="user-4", name="Luis Soto", email="luis@test.com", phone="3002223311", role="client", is_active=True)
    start = datetime(2026, 10, 26, 14, 0, tzinfo=BOGOTA_TZ)

    appt = await service.create_appointment(
        current_user=user,
        payload=CreateAppointmentPayload(barber_id=barber.id, start=start, service_ids=["svc-1"]),
    )
    assert appt.checked_in_at is None

    checked = await service.check_in_appointment(appt.id, user)
    assert checked.checked_in_at is not None

    with pytest.raises(Exception):
        await service.check_in_appointment(appt.id, user)

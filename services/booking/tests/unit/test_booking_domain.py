from datetime import date, datetime, timedelta, timezone
import pytest
from libs.common.errors import ConflictError
from libs.common.security import CurrentUser
from src.booking.db.models import BarberModel
from src.booking.domain.booking_service import BookingDomainService
from src.booking.schemas.booking import CreateAppointmentPayload

BOGOTA_TZ = timezone(timedelta(hours=-5))

@pytest.mark.unit
@pytest.mark.asyncio
async def test_booking_creation_and_slot_conflict_prevention(db_session):
    service = BookingDomainService(db_session)
    barber = await service.repo.create_barber(BarberModel(name="Mateo Silva", phone="3001234567", is_active=True))

    user = CurrentUser(id="user-1", name="Juan Perez", email="juan@test.com", phone="3009998877", role="client", is_active=True)
    future_start = datetime(2026, 10, 24, 11, 15, tzinfo=BOGOTA_TZ)

    items = [{"name": "Corte Signature Aura", "duration_minutes": 45, "price": 75000}]
    appt = await service.create_appointment(
        current_user=user,
        payload=CreateAppointmentPayload(barber_id=barber.id, start=future_start),
        items=items,
        total_price=75000,
        total_duration=45,
    )

    assert appt.id is not None
    assert appt.total_price == 75000
    assert appt.status == "confirmed"

    # Attempting duplicate booking in the same slot MUST raise 409 Conflict
    user2 = CurrentUser(id="user-2", name="Pedro Gomez", email="pedro@test.com", phone="3001112233", role="client", is_active=True)
    with pytest.raises(ConflictError):
        await service.create_appointment(
            current_user=user2,
            payload=CreateAppointmentPayload(barber_id=barber.id, start=future_start),
            items=items,
            total_price=75000,
            total_duration=45,
        )

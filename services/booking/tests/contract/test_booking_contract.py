from datetime import datetime, timedelta, timezone
import pytest
from libs.common.security import CurrentUser, create_session_token

BOGOTA_TZ = timezone(timedelta(hours=-5))

FAKE_SERVICES = [
    {"id": "svc-contract-1", "name": "Corte Signature Aura", "duration_minutes": 45, "price": 75000, "is_active": True},
    {"id": "svc-contract-2", "name": "Ritual Afeitado Imperial", "duration_minutes": 40, "price": 60000, "is_active": True},
]

@pytest.mark.contract
@pytest.mark.asyncio
async def test_booking_contract_endpoints(client, monkeypatch):
    # booking resuelve service_ids contra el microservicio catalog por HTTP;
    # en el test de contrato se reemplaza esa llamada por datos fijos.
    async def fake_list_services(self):
        return FAKE_SERVICES

    monkeypatch.setattr(
        "src.booking.domain.booking_service.CatalogClient.list_services", fake_list_services
    )

    # 1. Barbers list
    barbers_resp = await client.get("/bookings/barbers")
    assert barbers_resp.status_code == 200
    barbers = barbers_resp.json()
    assert len(barbers) >= 1

    barber_id = barbers[0]["id"]

    # 2. Availability query
    avail_resp = await client.get(f"/bookings/availability?date=2026-10-24&barber_id={barber_id}&duration_minutes=45")
    assert avail_resp.status_code == 200
    avail_data = avail_resp.json()
    assert "slots" in avail_data

    # 3. Create appointment with authenticated client
    user_token = create_session_token(CurrentUser(
        id="client-uuid-1",
        name="Cliente VIP",
        email="vip@cliente.com",
        phone="3001112233",
        role="client",
        is_active=True,
    ))
    headers = {"Authorization": f"Bearer {user_token}"}

    slot_time = "2026-10-24T15:00:00-05:00"
    booking_resp = await client.post(
        "/bookings/appointments",
        headers=headers,
        json={"barber_id": barber_id, "start": slot_time, "service_ids": ["svc-contract-1", "svc-contract-2"]},
    )
    assert booking_resp.status_code == 201
    appt_data = booking_resp.json()
    assert "id" in appt_data
    assert appt_data["client"]["id"] == "client-uuid-1"
    assert appt_data["total_price"] == 135000
    assert appt_data["can_cancel"] is True
    assert appt_data["checked_in_at"] is None

    # 4. Check-in del propio cliente
    checkin_resp = await client.post(f"/bookings/appointments/{appt_data['id']}/check-in", headers=headers)
    assert checkin_resp.status_code == 200
    assert checkin_resp.json()["checked_in_at"] is not None

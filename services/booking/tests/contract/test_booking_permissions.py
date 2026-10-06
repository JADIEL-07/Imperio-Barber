import pytest
from libs.common.security import CurrentUser, create_session_token


def _auth(role: str, user_id: str = "user-1") -> dict:
    user = CurrentUser(
        id=user_id,
        name="Usuario Prueba",
        email=f"{role}-{user_id}@example.com",
        phone="",
        role=role,
        is_active=True,
    )
    return {"Authorization": f"Bearer {create_session_token(user)}"}


@pytest.mark.contract
@pytest.mark.asyncio
async def test_public_can_list_barbers(client):
    resp = await client.get("/bookings/barbers")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.contract
@pytest.mark.asyncio
async def test_public_can_query_availability(client):
    resp = await client.get("/bookings/availability", params={"date": "2026-12-07", "duration_minutes": 45})
    assert resp.status_code == 200
    assert "slots" in resp.json()


@pytest.mark.contract
@pytest.mark.asyncio
async def test_anonymous_cannot_create_appointment(client):
    resp = await client.post(
        "/bookings/appointments",
        json={"start": "2026-12-07T10:00:00-05:00", "service_ids": ["svc-1"]},
    )
    assert resp.status_code == 401


@pytest.mark.contract
@pytest.mark.asyncio
async def test_appointment_requires_services_or_combo(client):
    resp = await client.post(
        "/bookings/appointments",
        json={"start": "2026-12-07T10:00:00-05:00"},
        headers=_auth("client"),
    )
    assert resp.status_code == 422


@pytest.mark.contract
@pytest.mark.asyncio
async def test_appointment_rejects_services_and_combo_together(client):
    resp = await client.post(
        "/bookings/appointments",
        json={"start": "2026-12-07T10:00:00-05:00", "service_ids": ["svc-1"], "combo_id": "combo-1"},
        headers=_auth("client"),
    )
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "VALIDATION_ERROR"


@pytest.mark.contract
@pytest.mark.asyncio
async def test_client_cannot_update_barber(client):
    resp = await client.patch(
        "/bookings/barbers/barbero-1",
        json={"commission_rate": 0.5},
        headers=_auth("client"),
    )
    assert resp.status_code == 403


@pytest.mark.contract
@pytest.mark.asyncio
async def test_employee_cannot_see_stats(client):
    resp = await client.get("/bookings/stats", headers=_auth("employee"))
    assert resp.status_code == 403


@pytest.mark.contract
@pytest.mark.asyncio
async def test_admin_stats_have_dashboard_fields(client):
    resp = await client.get("/bookings/stats", headers=_auth("admin"))
    assert resp.status_code == 200
    assert set(resp.json()) >= {
        "today_appointments",
        "status_counts",
        "month_revenue",
        "top_services",
        "revenue_by_service",
        "revenue_by_day",
        "total_commissions_paid",
    }


@pytest.mark.contract
@pytest.mark.asyncio
async def test_client_cannot_change_booking_settings(client):
    resp = await client.put("/bookings/settings", json={"slot_minutes": 30}, headers=_auth("client"))
    assert resp.status_code == 403


@pytest.mark.contract
@pytest.mark.asyncio
async def test_client_cannot_see_commissions(client):
    resp = await client.get("/bookings/barbers/barbero-1/commissions", headers=_auth("client"))
    assert resp.status_code == 403


@pytest.mark.contract
@pytest.mark.asyncio
async def test_admin_settings_validation_returns_422(client):
    resp = await client.put("/bookings/settings", json={"slot_minutes": 2}, headers=_auth("admin"))
    assert resp.status_code == 422

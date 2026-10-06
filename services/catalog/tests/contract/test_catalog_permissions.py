import pytest
from libs.common.security import CurrentUser, create_session_token


def _auth(role: str, user_id: str = "user-1") -> dict:
    user = CurrentUser(
        id=user_id,
        name="Usuario Prueba",
        email=f"{role}@example.com",
        phone="",
        role=role,
        is_active=True,
    )
    return {"Authorization": f"Bearer {create_session_token(user)}"}


SERVICIO_VALIDO = {
    "name": "Corte Signature",
    "description": "Corte con diagnóstico",
    "duration_minutes": 45,
    "price": 75000,
    "is_active": True,
}


async def _crear_servicio(client, headers, **overrides):
    return await client.post("/catalog/services", json={**SERVICIO_VALIDO, **overrides}, headers=headers)


@pytest.mark.contract
@pytest.mark.asyncio
async def test_public_can_list_active_services(client):
    resp = await client.get("/catalog/services")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.contract
@pytest.mark.asyncio
async def test_anonymous_cannot_create_service(client):
    resp = await _crear_servicio(client, headers={})
    assert resp.status_code == 401


@pytest.mark.contract
@pytest.mark.asyncio
async def test_client_cannot_create_service(client):
    resp = await _crear_servicio(client, headers=_auth("client"))
    assert resp.status_code == 403


@pytest.mark.contract
@pytest.mark.asyncio
async def test_employee_cannot_create_service(client):
    resp = await _crear_servicio(client, headers=_auth("employee"))
    assert resp.status_code == 403


@pytest.mark.contract
@pytest.mark.asyncio
async def test_admin_creates_service_with_response_schema(client):
    resp = await _crear_servicio(client, headers=_auth("admin"))
    assert resp.status_code == 201
    body = resp.json()
    assert set(body) == {"id", "name", "description", "duration_minutes", "price", "image_url", "is_active"}
    assert body["price"] == 75000
    assert body["duration_minutes"] == 45


@pytest.mark.contract
@pytest.mark.asyncio
async def test_admin_invalid_duration_returns_422(client):
    resp = await _crear_servicio(client, headers=_auth("admin"), duration_minutes=0)
    assert resp.status_code == 422


@pytest.mark.contract
@pytest.mark.asyncio
async def test_inactive_services_are_hidden_from_public_list(client):
    admin = _auth("admin")
    activo = (await _crear_servicio(client, headers=admin, name="Servicio activo")).json()
    inactivo = (await _crear_servicio(client, headers=admin, name="Servicio oculto", is_active=False)).json()

    publico = (await client.get("/catalog/services")).json()
    ids_publicos = {s["id"] for s in publico}
    assert activo["id"] in ids_publicos
    assert inactivo["id"] not in ids_publicos


@pytest.mark.contract
@pytest.mark.asyncio
async def test_all_flag_shows_inactive_only_to_admin(client):
    admin = _auth("admin")
    inactivo = (await _crear_servicio(client, headers=admin, name="Oculto admin", is_active=False)).json()

    como_admin = (await client.get("/catalog/services?all=true", headers=admin)).json()
    assert inactivo["id"] in {s["id"] for s in como_admin}

    como_cliente = (await client.get("/catalog/services?all=true", headers=_auth("client"))).json()
    assert inactivo["id"] not in {s["id"] for s in como_cliente}


@pytest.mark.contract
@pytest.mark.asyncio
async def test_combo_cannot_cost_more_than_its_services(client):
    admin = _auth("admin")
    corte = (await _crear_servicio(client, headers=admin, price=35000)).json()

    resp = await client.post(
        "/catalog/combos",
        json={"name": "Ritual caro", "service_ids": [corte["id"]], "price": 50000},
        headers=admin,
    )
    assert resp.status_code == 422
    assert resp.json()["error"]["code"]


@pytest.mark.contract
@pytest.mark.asyncio
async def test_combo_reports_savings_against_services(client):
    admin = _auth("admin")
    corte = (await _crear_servicio(client, headers=admin, price=35000, duration_minutes=30)).json()
    barba = (await _crear_servicio(client, headers=admin, name="Barba", price=20000, duration_minutes=20)).json()

    resp = await client.post(
        "/catalog/combos",
        json={"name": "Ritual", "service_ids": [corte["id"], barba["id"]], "price": 50000},
        headers=admin,
    )
    assert resp.status_code == 201
    combo = resp.json()
    assert combo["savings"] == 5000
    assert combo["duration_minutes"] == 50
    assert {s["id"] for s in combo["services"]} == {corte["id"], barba["id"]}

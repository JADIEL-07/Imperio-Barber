import pytest
from libs.common.security import CurrentUser, create_session_token


def _token(role: str, is_active: bool = True, user_id: str = "user-1") -> str:
    user = CurrentUser(
        id=user_id,
        name="Usuario Prueba",
        email=f"{role}-{user_id}@example.com",
        phone="",
        role=role,
        is_active=is_active,
    )
    return create_session_token(user)


def _bearer(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


async def _register(client, email: str = "nuevo@example.com", password: str = "secreto1"):
    return await client.post(
        "/auth/register",
        json={"name": "Nuevo Cliente", "email": email, "phone": "3001234567", "password": password},
    )


@pytest.mark.contract
@pytest.mark.asyncio
async def test_me_without_session_returns_401(client):
    resp = await client.get("/auth/me")
    assert resp.status_code == 401


@pytest.mark.contract
@pytest.mark.asyncio
async def test_invalid_token_returns_401(client):
    resp = await client.get("/auth/me", headers=_bearer("token-falso"))
    assert resp.status_code == 401


@pytest.mark.contract
@pytest.mark.asyncio
async def test_inactive_user_token_returns_401(client):
    resp = await client.get("/auth/me", headers=_bearer(_token("client", is_active=False)))
    assert resp.status_code == 401


@pytest.mark.contract
@pytest.mark.asyncio
async def test_client_cannot_list_users(client):
    resp = await client.get("/auth/users", headers=_bearer(_token("client")))
    assert resp.status_code == 403


@pytest.mark.contract
@pytest.mark.asyncio
async def test_employee_cannot_list_users(client):
    resp = await client.get("/auth/users", headers=_bearer(_token("employee")))
    assert resp.status_code == 403


@pytest.mark.contract
@pytest.mark.asyncio
async def test_admin_can_list_users_with_page_envelope(client):
    resp = await client.get("/auth/users", headers=_bearer(_token("admin")))
    assert resp.status_code == 200
    body = resp.json()
    assert set(body) >= {"items", "total", "page", "page_size"}


@pytest.mark.contract
@pytest.mark.asyncio
async def test_register_duplicate_email_returns_409(client):
    assert (await _register(client)).status_code == 201
    resp = await _register(client)
    assert resp.status_code == 409
    assert resp.json()["error"]["code"]


@pytest.mark.contract
@pytest.mark.asyncio
async def test_register_with_short_password_returns_422(client):
    resp = await _register(client, email="corta@example.com", password="123")
    assert resp.status_code == 422


@pytest.mark.contract
@pytest.mark.asyncio
async def test_login_with_wrong_password_returns_error_envelope(client):
    await _register(client, email="login@example.com")
    resp = await client.post("/auth/login", json={"email": "login@example.com", "password": "incorrecta"})
    assert resp.status_code == 401
    assert resp.json()["error"]["code"]
    assert "session_token" not in resp.cookies


@pytest.mark.contract
@pytest.mark.asyncio
async def test_register_never_returns_password_hash(client):
    resp = await _register(client, email="privado@example.com")
    assert resp.status_code == 201
    body = resp.json()
    assert "password" not in body
    assert "password_hash" not in body

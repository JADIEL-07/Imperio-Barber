import pytest
from libs.common.security import CurrentUser, create_session_token

@pytest.mark.contract
@pytest.mark.asyncio
async def test_auth_endpoints_contract(client):
    # 1. Register endpoint /auth/register
    reg_resp = await client.post(
        "/auth/register",
        json={
            "name": "David Barber",
            "email": "david@barber.com",
            "phone": "3109876543",
            "password": "securepassword123",
        },
    )
    assert reg_resp.status_code == 201
    data = reg_resp.json()
    assert "id" in data
    assert data["name"] == "David Barber"
    assert data["email"] == "david@barber.com"
    assert data["role"] == "client"
    assert data["is_active"] is True
    assert "session_token" in reg_resp.cookies

    # 2. Login endpoint /auth/login
    login_resp = await client.post(
        "/auth/login",
        json={"email": "david@barber.com", "password": "securepassword123"},
    )
    assert login_resp.status_code == 200
    assert "session_token" in login_resp.cookies

    # 3. Get /auth/me with session token
    user_token = create_session_token(CurrentUser(id=data["id"], name=data["name"], email=data["email"], phone=data["phone"], role="client", is_active=True))
    me_resp = await client.get("/auth/me", headers={"Authorization": f"Bearer {user_token}"})
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["id"] == data["id"]

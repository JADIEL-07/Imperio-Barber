import pytest
from libs.common.security import CurrentUser, create_session_token

@pytest.mark.contract
@pytest.mark.asyncio
async def test_catalog_contract_endpoints(client):
    admin_token = create_session_token(CurrentUser(
        id="admin-123",
        name="Admin User",
        email="admin@barber.com",
        role="admin",
        is_active=True
    ))
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Create service
    s_resp = await client.post(
        "/catalog/services",
        headers=headers,
        json={
            "name": "Camuflaje de Canas",
            "description": "Pigmentación sutil",
            "duration_minutes": 30,
            "price": 55000,
            "is_active": True,
        }
    )
    assert s_resp.status_code == 201
    s_data = s_resp.json()
    assert s_data["name"] == "Camuflaje de Canas"
    assert s_data["price"] == 55000
    assert s_data["duration_minutes"] == 30

    # 2. List public services (no auth required)
    list_resp = await client.get("/catalog/services")
    assert list_resp.status_code == 200
    items = list_resp.json()
    assert len(items) >= 1
    assert items[0]["name"] == "Camuflaje de Canas"

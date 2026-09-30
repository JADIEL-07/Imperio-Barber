import pytest
from libs.common.errors import ConflictError, UnauthorizedError
from src.auth.domain.auth_service import AuthDomainService
from src.auth.schemas.user import LoginPayload, RegisterPayload

@pytest.mark.unit
@pytest.mark.asyncio
async def test_register_and_login_success(db_session):
    service = AuthDomainService(db_session)
    reg_payload = RegisterPayload(
        name="Carlos Perez",
        email="carlos@example.com",
        phone="3001234567",
        password="password123",
    )
    user, token = await service.register(reg_payload)
    assert user.name == "Carlos Perez"
    assert user.email == "carlos@example.com"
    assert user.role == "client"
    assert token is not None

    login_payload = LoginPayload(email="carlos@example.com", password="password123")
    logged_user, login_token = await service.login(login_payload)
    assert logged_user.id == user.id
    assert login_token is not None

@pytest.mark.unit
@pytest.mark.asyncio
async def test_register_duplicate_email_fails(db_session):
    service = AuthDomainService(db_session)
    reg_payload = RegisterPayload(
        name="Carlos Perez",
        email="duplicate@example.com",
        phone="3001234567",
        password="password123",
    )
    await service.register(reg_payload)

    with pytest.raises(ConflictError):
        await service.register(reg_payload)

@pytest.mark.unit
@pytest.mark.asyncio
async def test_login_invalid_password_fails(db_session):
    service = AuthDomainService(db_session)
    reg_payload = RegisterPayload(
        name="Carlos Perez",
        email="wrongpass@example.com",
        phone="3001234567",
        password="password123",
    )
    await service.register(reg_payload)

    with pytest.raises(UnauthorizedError):
        await service.login(LoginPayload(email="wrongpass@example.com", password="incorrectpassword"))

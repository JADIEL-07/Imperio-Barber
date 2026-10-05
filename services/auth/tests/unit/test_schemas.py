import pytest
from pydantic import ValidationError

from libs.common.security import CurrentUser, create_session_token, decode_session_token, hash_password, verify_password
from src.auth.schemas.user import CreateUserPayload, LoginPayload, RegisterPayload, UpdateMePayload


@pytest.mark.unit
def test_register_payload_accepts_valid_data():
    payload = RegisterPayload(name="Ana Lopez", email="ana@example.com", phone="3001234567", password="secreto1")
    assert payload.phone == "3001234567"


@pytest.mark.unit
@pytest.mark.parametrize(
    "overrides",
    [
        {"email": "no-es-correo"},
        {"password": "corta"},
        {"name": "A"},
    ],
)
def test_register_payload_rejects_invalid_data(overrides):
    data = {"name": "Ana Lopez", "email": "ana@example.com", "phone": "", "password": "secreto1", **overrides}
    with pytest.raises(ValidationError):
        RegisterPayload(**data)


@pytest.mark.unit
def test_login_payload_requires_valid_email():
    with pytest.raises(ValidationError):
        LoginPayload(email="sin-arroba", password="x")


@pytest.mark.unit
def test_create_user_payload_defaults_to_client_role():
    payload = CreateUserPayload(name="Carlos Perez", email="c@example.com", password="secreto1")
    assert payload.role == "client"


@pytest.mark.unit
def test_create_user_payload_rejects_unknown_role():
    with pytest.raises(ValidationError):
        CreateUserPayload(name="Carlos Perez", email="c@example.com", password="secreto1", role="superadmin")


@pytest.mark.unit
def test_update_me_payload_allows_partial_updates():
    payload = UpdateMePayload(phone="3110000000")
    assert payload.name is None
    assert payload.password is None


@pytest.mark.unit
def test_password_hash_verifies_only_the_same_password():
    hashed = hash_password("secreto1")
    assert verify_password("secreto1", hashed)
    assert not verify_password("otra-clave", hashed)


@pytest.mark.unit
def test_session_token_roundtrip_keeps_user_data():
    user = CurrentUser(id="u1", name="Ana", email="ana@example.com", phone="300", role="admin", is_active=True)
    decoded = decode_session_token(create_session_token(user))
    assert decoded is not None
    assert decoded.id == "u1"
    assert decoded.role == "admin"


@pytest.mark.unit
def test_invalid_session_token_returns_none():
    assert decode_session_token("token-invalido") is None

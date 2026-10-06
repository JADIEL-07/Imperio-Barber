import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select

from src.auth.db.models import UserModel


@pytest.mark.unit
@pytest.mark.asyncio
async def test_user_model_defaults(db_session):
    user = UserModel(name="Ana Lopez", email="ana@example.com", password_hash="hash")
    db_session.add(user)
    await db_session.commit()

    assert user.role == "client"
    assert user.is_active is True
    assert user.phone == ""
    assert len(user.id) == 36
    assert user.created_at is not None
    assert user.updated_at is not None


@pytest.mark.unit
@pytest.mark.asyncio
async def test_user_email_is_unique(db_session):
    db_session.add(UserModel(name="Uno Dos", email="dup@example.com", password_hash="h1"))
    await db_session.commit()

    db_session.add(UserModel(name="Tres Cuatro", email="dup@example.com", password_hash="h2"))
    with pytest.raises(IntegrityError):
        await db_session.commit()
    await db_session.rollback()


@pytest.mark.unit
@pytest.mark.asyncio
async def test_user_ids_are_unique_uuids(db_session):
    a = UserModel(name="Ana Uno", email="a@example.com", password_hash="h")
    b = UserModel(name="Beto Dos", email="b@example.com", password_hash="h")
    db_session.add_all([a, b])
    await db_session.commit()

    assert a.id != b.id
    result = await db_session.execute(select(UserModel).where(UserModel.email == "a@example.com"))
    assert result.scalar_one().id == a.id

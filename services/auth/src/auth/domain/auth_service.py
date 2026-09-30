from typing import List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from libs.common.errors import ConflictError, NotFoundError, UnauthorizedError
from libs.common.security import CurrentUser, create_session_token, hash_password, verify_password
from src.auth.db.models import UserModel
from src.auth.db.repository import UserRepository
from src.auth.schemas.user import (
    CreateUserPayload,
    LoginPayload,
    RegisterPayload,
    UpdateMePayload,
    UpdateUserPayload,
    UserSchema,
)

class AuthDomainService:
    def __init__(self, db: AsyncSession):
        self.repo = UserRepository(db)

    async def register(self, payload: RegisterPayload) -> Tuple[UserSchema, str]:
        existing = await self.repo.get_by_email(payload.email)
        if existing:
            raise ConflictError("Ya existe una cuenta registrada con este correo electrónico")

        user_model = UserModel(
            name=payload.name.strip(),
            email=payload.email.lower().strip(),
            phone=payload.phone.strip(),
            password_hash=hash_password(payload.password),
            role="client",
            is_active=True,
        )
        saved = await self.repo.create(user_model)
        user_schema = UserSchema.model_validate(saved)
        token = create_session_token(CurrentUser(**user_schema.model_dump()))
        return user_schema, token

    async def login(self, payload: LoginPayload) -> Tuple[UserSchema, str]:
        user = await self.repo.get_by_email(payload.email)
        if not user or not verify_password(payload.password, user.password_hash):
            raise UnauthorizedError("Credenciales inválidas: correo o contraseña incorrectos")

        if not user.is_active:
            raise UnauthorizedError("Esta cuenta ha sido desactivada. Comunícate con administración.")

        user_schema = UserSchema.model_validate(user)
        token = create_session_token(CurrentUser(**user_schema.model_dump()))
        return user_schema, token

    async def get_me(self, current_user: CurrentUser) -> UserSchema:
        user = await self.repo.get_by_id(current_user.id)
        if not user:
            raise NotFoundError("Usuario no encontrado")
        return UserSchema.model_validate(user)

    async def update_me(self, current_user: CurrentUser, payload: UpdateMePayload) -> UserSchema:
        user = await self.repo.get_by_id(current_user.id)
        if not user:
            raise NotFoundError("Usuario no encontrado")

        if payload.name is not None:
            user.name = payload.name.strip()
        if payload.phone is not None:
            user.phone = payload.phone.strip()
        if payload.password is not None:
            user.password_hash = hash_password(payload.password)

        updated = await self.repo.update(user)
        return UserSchema.model_validate(updated)

    async def list_users(
        self, role: Optional[str], search: Optional[str], page: int, page_size: int
    ) -> Tuple[List[UserSchema], int]:
        offset = (page - 1) * page_size
        models, total = await self.repo.list_users(role=role, search=search, offset=offset, limit=page_size)
        return [UserSchema.model_validate(m) for m in models], total

    async def create_user_admin(self, payload: CreateUserPayload) -> UserSchema:
        existing = await self.repo.get_by_email(payload.email)
        if existing:
            raise ConflictError("Ya existe un usuario con este correo electrónico")

        user_model = UserModel(
            name=payload.name.strip(),
            email=payload.email.lower().strip(),
            phone=payload.phone.strip(),
            password_hash=hash_password(payload.password),
            role=payload.role,
            is_active=True,
        )
        saved = await self.repo.create(user_model)
        return UserSchema.model_validate(saved)

    async def update_user_admin(self, user_id: str, payload: UpdateUserPayload) -> UserSchema:
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise NotFoundError(f"No se encontró el usuario con id {user_id}")

        if payload.name is not None:
            user.name = payload.name.strip()
        if payload.phone is not None:
            user.phone = payload.phone.strip()
        if payload.role is not None:
            user.role = payload.role
        if payload.is_active is not None:
            user.is_active = payload.is_active

        updated = await self.repo.update(user)
        return UserSchema.model_validate(updated)

from typing import Optional
from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from libs.common.pagination import PageResponse
from libs.common.security import (
    CurrentUser,
    clear_session_cookie,
    get_current_user,
    require_role,
    set_session_cookie,
)
from src.auth.db.session import get_db
from src.auth.domain.auth_service import AuthDomainService
from src.auth.schemas.user import (
    CreateUserPayload,
    LoginPayload,
    RegisterPayload,
    UpdateMePayload,
    UpdateUserPayload,
    UserSchema,
)

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterPayload, response: Response, db: AsyncSession = Depends(get_db)):
    service = AuthDomainService(db)
    user, token = await service.register(payload)
    set_session_cookie(response, token)
    return user

@router.post("/login", response_model=UserSchema)
async def login(payload: LoginPayload, response: Response, db: AsyncSession = Depends(get_db)):
    service = AuthDomainService(db)
    user, token = await service.login(payload)
    set_session_cookie(response, token)
    return user

@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(response: Response):
    clear_session_cookie(response)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.get("/me", response_model=UserSchema)
async def get_me(current_user: CurrentUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    service = AuthDomainService(db)
    return await service.get_me(current_user)

@router.patch("/me", response_model=UserSchema)
async def update_me(
    payload: UpdateMePayload,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AuthDomainService(db)
    return await service.update_me(current_user, payload)

@router.get("/users", response_model=PageResponse[UserSchema])
async def list_users(
    role: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: CurrentUser = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db),
):
    service = AuthDomainService(db)
    items, total = await service.list_users(role=role, search=search, page=page, page_size=page_size)
    return PageResponse(items=items, total=total, page=page, page_size=page_size)

@router.post("/users", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
async def create_user_admin(
    payload: CreateUserPayload,
    current_user: CurrentUser = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db),
):
    service = AuthDomainService(db)
    return await service.create_user_admin(payload)

@router.patch("/users/{user_id}", response_model=UserSchema)
async def update_user_admin(
    user_id: str,
    payload: UpdateUserPayload,
    current_user: CurrentUser = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db),
):
    service = AuthDomainService(db)
    return await service.update_user_admin(user_id, payload)

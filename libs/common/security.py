import os
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
import jwt
from fastapi import Cookie, Depends, Header, Response
from pydantic import BaseModel
import hashlib

SESSION_COOKIE_NAME = "session_token"
JWT_ALGORITHM = "HS256"
SESSION_SECRET = os.getenv("SESSION_SECRET", "supersecretkey32charactersminimum!")

class CurrentUser(BaseModel):
    id: str
    name: str
    email: str
    phone: str = ""
    role: str
    is_active: bool = True

def hash_password(password: str) -> str:
    salt = os.getenv("PASSWORD_SALT", "imperio_barber_salt_key")
    return hashlib.sha256(f"{salt}_{password}".encode("utf-8")).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password

def create_session_token(user: CurrentUser, expires_delta: Optional[timedelta] = None) -> str:
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(days=7))
    payload = {
        "sub": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "role": user.role,
        "is_active": user.is_active,
        "exp": expire,
    }
    return jwt.encode(payload, SESSION_SECRET, algorithm=JWT_ALGORITHM)

def decode_session_token(token: str) -> Optional[CurrentUser]:
    try:
        payload = jwt.decode(token, SESSION_SECRET, algorithms=[JWT_ALGORITHM])
        return CurrentUser(
            id=payload["sub"],
            name=payload.get("name", ""),
            email=payload.get("email", ""),
            phone=payload.get("phone", ""),
            role=payload.get("role", "client"),
            is_active=payload.get("is_active", True),
        )
    except (jwt.PyJWTError, KeyError):
        return None

def _session_cookie_attrs() -> Dict[str, Any]:
    """
    En producción, frontend y backend pueden vivir en dominios distintos
    (ej. app.midominio.com / api.midominio.com), así que la cookie debe
    viajar cross-site: eso exige SameSite=None, y los navegadores solo
    aceptan SameSite=None si la cookie además es Secure (HTTPS).
    En desarrollo local (mismo origen, HTTP) usamos Lax, que no requiere HTTPS.
    """
    is_production = os.getenv("ENVIRONMENT") == "production"
    return {
        "secure": is_production,
        "samesite": "none" if is_production else "lax",
    }

def set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        httponly=True,
        max_age=7 * 24 * 3600,
        path="/",
        **_session_cookie_attrs(),
    )

def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        httponly=True,
        path="/",
        **_session_cookie_attrs(),
    )

from libs.common.errors import ForbiddenError, UnauthorizedError

async def get_optional_user(
    session_token: Optional[str] = Cookie(None, alias=SESSION_COOKIE_NAME),
    authorization: Optional[str] = Header(None),
) -> Optional[CurrentUser]:
    token = session_token
    if not token and authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
    
    if not token:
        return None
    return decode_session_token(token)

async def get_current_user(
    user: Optional[CurrentUser] = Depends(get_optional_user),
) -> CurrentUser:
    if not user or not user.is_active:
        raise UnauthorizedError("Sesion no valida o usuario inactivo")
    return user

def require_role(allowed_roles: List[str]):
    async def role_checker(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if user.role not in allowed_roles:
            raise ForbiddenError("No tienes permisos suficientes para acceder a este recurso")
        return user
    return role_checker

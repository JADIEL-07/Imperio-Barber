from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field

class UserSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    email: str
    phone: str
    role: Literal["admin", "employee", "client"]
    is_active: bool

class RegisterPayload(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    phone: str = Field("", max_length=30)
    password: str = Field(..., min_length=6)

class LoginPayload(BaseModel):
    email: EmailStr
    password: str

class UpdateMePayload(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=120)
    phone: Optional[str] = Field(None, max_length=30)
    password: Optional[str] = Field(None, min_length=6)

class CreateUserPayload(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    phone: str = Field("", max_length=30)
    password: str = Field(..., min_length=6)
    role: Literal["admin", "employee", "client"] = "client"

class UpdateUserPayload(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=120)
    phone: Optional[str] = Field(None, max_length=30)
    role: Optional[Literal["admin", "employee", "client"]] = None
    is_active: Optional[bool] = None

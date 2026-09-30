from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field

class ServiceSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: str
    duration_minutes: int
    price: int
    is_active: bool

class CreateServicePayload(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    description: str = Field("", max_length=500)
    duration_minutes: int = Field(..., gt=0, le=480)
    price: int = Field(..., ge=0)
    is_active: bool = True

class UpdateServicePayload(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=120)
    description: Optional[str] = Field(None, max_length=500)
    duration_minutes: Optional[int] = Field(None, gt=0, le=480)
    price: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None

class ComboSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: str
    services: List[ServiceSchema]
    price: int
    duration_minutes: int
    savings: int
    is_active: bool

class CreateComboPayload(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    description: str = Field("", max_length=500)
    service_ids: List[str] = Field(..., min_length=1)
    price: int = Field(..., ge=0)
    is_active: bool = True

class UpdateComboPayload(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=120)
    description: Optional[str] = Field(None, max_length=500)
    service_ids: Optional[List[str]] = Field(None, min_length=1)
    price: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None

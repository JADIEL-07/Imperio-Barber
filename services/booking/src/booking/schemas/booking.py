from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field

class BarberScheduleSchema(BaseModel):
    weekday: int = Field(..., ge=0, le=6)
    start: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    end: str = Field(..., pattern=r"^\d{2}:\d{2}$")

class BarberTimeOffSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    from_time: datetime = Field(..., alias="from")
    to_time: datetime = Field(..., alias="to")
    reason: str

class CreateTimeOffPayload(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    from_time: datetime = Field(..., alias="from")
    to_time: datetime = Field(..., alias="to")
    reason: str = Field("Permiso / Vacaciones", max_length=255)

class BarberSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    phone: str
    is_active: bool

class SlotSchema(BaseModel):
    start: str
    end: str
    barber_id: str

class AvailabilityResponse(BaseModel):
    slots: List[SlotSchema]

class AppointmentItemSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    duration_minutes: int
    price: int

class ClientRef(BaseModel):
    id: str
    name: str
    phone: str

class BarberRef(BaseModel):
    id: str
    name: str

class AppointmentSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    client: ClientRef
    barber: BarberRef
    items: List[AppointmentItemSchema]
    start: str
    end: str
    total_price: int
    status: Literal["pending", "confirmed", "completed", "cancelled", "no_show"]
    can_cancel: bool

class CreateAppointmentPayload(BaseModel):
    barber_id: Optional[str] = None
    start: datetime
    service_ids: Optional[List[str]] = None
    combo_id: Optional[str] = None

class UpdateAppointmentPayload(BaseModel):
    status: Optional[Literal["pending", "confirmed", "completed", "cancelled", "no_show"]] = None
    start: Optional[datetime] = None

class BookingSettingsSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    opening_hours: Dict[str, Any]
    cancel_min_hours: int
    slot_minutes: int

class UpdateBookingSettingsPayload(BaseModel):
    opening_hours: Optional[Dict[str, Any]] = None
    cancel_min_hours: Optional[int] = Field(None, ge=0, le=48)
    slot_minutes: Optional[int] = Field(None, ge=5, le=60)

class StatsResponse(BaseModel):
    today_appointments: int
    status_counts: Dict[str, int]
    month_revenue: int
    top_services: List[Dict[str, Any]]

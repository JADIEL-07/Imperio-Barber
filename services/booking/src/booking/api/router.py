from datetime import date, datetime
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from libs.common.pagination import PageResponse
from libs.common.security import CurrentUser, get_current_user, require_role
from src.booking.db.session import get_db
from src.booking.domain.booking_service import BookingDomainService
from src.booking.schemas.booking import (
    AppointmentSchema,
    AvailabilityResponse,
    BarberScheduleSchema,
    BarberSchema,
    BarberTimeOffSchema,
    BookingSettingsSchema,
    CreateAppointmentPayload,
    CreateTimeOffPayload,
    StatsResponse,
    UpdateAppointmentPayload,
    UpdateBarberPayload,
    UpdateBookingSettingsPayload,
)

router = APIRouter(prefix="/bookings", tags=["bookings"])

# 1. Barbers list
@router.get("/barbers", response_model=List[BarberSchema])
async def list_barbers(db: AsyncSession = Depends(get_db)):
    service = BookingDomainService(db)
    return await service.list_barbers()

@router.patch("/barbers/{barber_id}", response_model=BarberSchema)
async def update_barber(
    barber_id: str,
    payload: UpdateBarberPayload,
    current_user: CurrentUser = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db),
):
    service = BookingDomainService(db)
    return await service.update_barber(barber_id, payload)

# 2. Availability
@router.get("/availability", response_model=AvailabilityResponse)
async def get_availability(
    date: date = Query(...),
    barber_id: Optional[str] = Query(None),
    service_ids: Optional[str] = Query(None),
    combo_id: Optional[str] = Query(None),
    duration_minutes: int = Query(45),
    db: AsyncSession = Depends(get_db),
):
    service = BookingDomainService(db)
    slots = await service.get_availability(
        target_date=date,
        barber_id=barber_id,
        duration_minutes=duration_minutes,
    )
    return AvailabilityResponse(slots=slots)

# 3. Create Appointment
@router.post("/appointments", response_model=AppointmentSchema, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    payload: CreateAppointmentPayload,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = BookingDomainService(db)
    # Default items and pricing calculation
    items = [
        {"name": "Corte Signature Aura", "duration_minutes": 45, "price": 75000},
        {"name": "Ritual Afeitado Imperial", "duration_minutes": 40, "price": 60000},
    ]
    total_price = 135000
    total_duration = 85

    return await service.create_appointment(
        current_user=current_user,
        payload=payload,
        items=items,
        total_price=total_price,
        total_duration=total_duration,
    )

# 4. List Appointments
@router.get("/appointments", response_model=PageResponse[AppointmentSchema])
async def list_appointments(
    scope: str = Query("mine", pattern=r"^(mine|barber|all)$"),
    status: Optional[str] = Query(None),
    from_date: Optional[datetime] = Query(None, alias="from"),
    to_date: Optional[datetime] = Query(None, alias="to"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = BookingDomainService(db)
    items, total = await service.list_appointments(
        current_user=current_user,
        scope=scope,
        status=status,
        from_date=from_date,
        to_date=to_date,
        page=page,
        page_size=page_size,
    )
    return PageResponse(items=items, total=total, page=page, page_size=page_size)

# 5. Update / Cancel / Reschedule Appointment
@router.patch("/appointments/{appointment_id}", response_model=AppointmentSchema)
async def update_appointment(
    appointment_id: str,
    payload: UpdateAppointmentPayload,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = BookingDomainService(db)
    return await service.update_appointment(
        appointment_id=appointment_id,
        current_user=current_user,
        payload=payload,
    )

# 6. Barber Weekly Schedules
@router.get("/barbers/{barber_id}/schedule", response_model=List[BarberScheduleSchema])
async def get_barber_schedule(barber_id: str, db: AsyncSession = Depends(get_db)):
    service = BookingDomainService(db)
    return await service.get_barber_schedule(barber_id)

@router.put("/barbers/{barber_id}/schedule", response_model=List[BarberScheduleSchema])
async def update_barber_schedule(
    barber_id: str,
    schedules: List[BarberScheduleSchema],
    current_user: CurrentUser = Depends(require_role(["admin", "employee"])),
    db: AsyncSession = Depends(get_db),
):
    service = BookingDomainService(db)
    return await service.update_barber_schedule(barber_id, schedules)

# 7. Barber Time-offs
@router.get("/barbers/{barber_id}/time-off", response_model=List[BarberTimeOffSchema])
async def list_barber_time_offs(barber_id: str, db: AsyncSession = Depends(get_db)):
    service = BookingDomainService(db)
    return await service.list_time_offs(barber_id)

@router.post("/barbers/{barber_id}/time-off", response_model=BarberTimeOffSchema, status_code=status.HTTP_201_CREATED)
async def add_time_off(
    barber_id: str,
    payload: CreateTimeOffPayload,
    current_user: CurrentUser = Depends(require_role(["admin", "employee"])),
    db: AsyncSession = Depends(get_db),
):
    service = BookingDomainService(db)
    return await service.add_time_off(barber_id, payload)

@router.delete("/barbers/{barber_id}/time-off/{time_off_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_time_off(
    barber_id: str,
    time_off_id: str,
    current_user: CurrentUser = Depends(require_role(["admin", "employee"])),
    db: AsyncSession = Depends(get_db),
):
    service = BookingDomainService(db)
    await service.delete_time_off(time_off_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

# 8. Business Settings
@router.get("/settings", response_model=BookingSettingsSchema)
async def get_settings(db: AsyncSession = Depends(get_db)):
    service = BookingDomainService(db)
    return await service.get_settings()

@router.put("/settings", response_model=BookingSettingsSchema)
async def update_settings(
    payload: UpdateBookingSettingsPayload,
    current_user: CurrentUser = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db),
):
    service = BookingDomainService(db)
    return await service.update_settings(payload)

# 9. Dashboard Stats
@router.get("/stats", response_model=StatsResponse)
async def get_stats(
    current_user: CurrentUser = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db),
):
    service = BookingDomainService(db)
    return await service.get_stats()

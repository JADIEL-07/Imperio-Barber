from datetime import datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from src.booking.db.models import (
    AppointmentItemModel,
    AppointmentModel,
    BarberModel,
    BarberScheduleModel,
    BarberTimeOffModel,
    BookingSettingsModel,
)

class BookingRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    # Barber Operations
    async def get_barber_by_id(self, barber_id: str) -> Optional[BarberModel]:
        res = await self.db.execute(select(BarberModel).where(BarberModel.id == barber_id))
        return res.scalar_one_or_none()

    async def list_barbers(self, active_only: bool = True) -> List[BarberModel]:
        q = select(BarberModel)
        if active_only:
            q = q.where(BarberModel.is_active.is_(True))
        res = await self.db.execute(q.order_by(BarberModel.name.asc()))
        return list(res.scalars().all())

    async def create_barber(self, barber: BarberModel) -> BarberModel:
        self.db.add(barber)
        await self.db.commit()
        await self.db.refresh(barber)
        return barber

    async def update_barber(self, barber: BarberModel) -> BarberModel:
        await self.db.commit()
        await self.db.refresh(barber)
        return barber

    # Schedule operations
    async def get_barber_schedules(self, barber_id: str) -> List[BarberScheduleModel]:
        res = await self.db.execute(
            select(BarberScheduleModel).where(BarberScheduleModel.barber_id == barber_id).order_by(BarberScheduleModel.weekday.asc())
        )
        return list(res.scalars().all())

    async def set_barber_schedules(self, barber_id: str, schedules: List[BarberScheduleModel]) -> List[BarberScheduleModel]:
        existing = await self.get_barber_schedules(barber_id)
        for e in existing:
            await self.db.delete(e)
        for s in schedules:
            self.db.add(s)
        await self.db.commit()
        return schedules

    # Time-Off operations
    async def list_barber_time_offs(self, barber_id: str) -> List[BarberTimeOffModel]:
        res = await self.db.execute(
            select(BarberTimeOffModel).where(BarberTimeOffModel.barber_id == barber_id).order_by(BarberTimeOffModel.start_time.asc())
        )
        return list(res.scalars().all())

    async def add_time_off(self, time_off: BarberTimeOffModel) -> BarberTimeOffModel:
        self.db.add(time_off)
        await self.db.commit()
        await self.db.refresh(time_off)
        return time_off

    async def delete_time_off(self, time_off_id: str) -> bool:
        res = await self.db.execute(select(BarberTimeOffModel).where(BarberTimeOffModel.id == time_off_id))
        item = res.scalar_one_or_none()
        if item:
            await self.db.delete(item)
            await self.db.commit()
            return True
        return False

    # Appointment operations
    async def get_appointment_by_id(self, appointment_id: str) -> Optional[AppointmentModel]:
        res = await self.db.execute(select(AppointmentModel).where(AppointmentModel.id == appointment_id))
        return res.scalar_one_or_none()

    async def get_conflicting_appointment(
        self, barber_id: str, start: datetime, end: datetime, exclude_id: Optional[str] = None
    ) -> Optional[AppointmentModel]:
        q = select(AppointmentModel).where(
            AppointmentModel.barber_id == barber_id,
            AppointmentModel.status.in_(["pending", "confirmed"]),
            AppointmentModel.start_time < end,
            AppointmentModel.end_time > start,
        )
        if exclude_id:
            q = q.where(AppointmentModel.id != exclude_id)
        res = await self.db.execute(q)
        return res.scalar_one_or_none()

    async def list_appointments(
        self,
        client_id: Optional[str] = None,
        barber_id: Optional[str] = None,
        status: Optional[str] = None,
        from_date: Optional[datetime] = None,
        to_date: Optional[datetime] = None,
        offset: int = 0,
        limit: int = 20,
    ) -> Tuple[List[AppointmentModel], int]:
        q = select(AppointmentModel)
        cq = select(func.count(AppointmentModel.id))

        if client_id:
            q = q.where(AppointmentModel.client_id == client_id)
            cq = cq.where(AppointmentModel.client_id == client_id)
        if barber_id:
            q = q.where(AppointmentModel.barber_id == barber_id)
            cq = cq.where(AppointmentModel.barber_id == barber_id)
        if status:
            q = q.where(AppointmentModel.status == status)
            cq = cq.where(AppointmentModel.status == status)
        if from_date:
            q = q.where(AppointmentModel.start_time >= from_date)
            cq = cq.where(AppointmentModel.start_time >= from_date)
        if to_date:
            q = q.where(AppointmentModel.start_time <= to_date)
            cq = cq.where(AppointmentModel.start_time <= to_date)

        total_res = await self.db.execute(cq)
        total = total_res.scalar_one() or 0

        res = await self.db.execute(q.order_by(AppointmentModel.start_time.asc()).offset(offset).limit(limit))
        items = list(res.scalars().all())

        return items, total

    async def create_appointment(self, appointment: AppointmentModel) -> AppointmentModel:
        self.db.add(appointment)
        await self.db.commit()
        await self.db.refresh(appointment)
        return appointment

    async def update_appointment(self, appointment: AppointmentModel) -> AppointmentModel:
        await self.db.commit()
        await self.db.refresh(appointment)
        return appointment

    # Settings
    async def get_or_create_settings(self) -> BookingSettingsModel:
        res = await self.db.execute(select(BookingSettingsModel))
        settings = res.scalar_one_or_none()
        if not settings:
            settings = BookingSettingsModel()
            self.db.add(settings)
            await self.db.commit()
            await self.db.refresh(settings)
        return settings

    async def update_settings(self, settings: BookingSettingsModel) -> BookingSettingsModel:
        await self.db.commit()
        await self.db.refresh(settings)
        return settings

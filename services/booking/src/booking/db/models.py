from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, JSON, String, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship
from libs.common.database import Base, BaseModel

barber_services_table = Table(
    "barber_services",
    Base.metadata,
    Column("barber_id", String(36), ForeignKey("barbers.id", ondelete="CASCADE"), primary_key=True),
    Column("service_id", String(36), primary_key=True),
)

class BarberModel(BaseModel):
    __tablename__ = "barbers"

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    phone: Mapped[str] = mapped_column(String(30), default="", nullable=False)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    # Fracción 0.0-1.0 (ej. 0.4 = 40%) que el barbero recibe de cada cita completada.
    commission_rate: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    schedules: Mapped[List["BarberScheduleModel"]] = relationship(
        "BarberScheduleModel", back_populates="barber", cascade="all, delete-orphan", lazy="selectin"
    )
    time_offs: Mapped[List["BarberTimeOffModel"]] = relationship(
        "BarberTimeOffModel", back_populates="barber", cascade="all, delete-orphan", lazy="selectin"
    )
    appointments: Mapped[List["AppointmentModel"]] = relationship(
        "AppointmentModel", back_populates="barber", lazy="selectin"
    )
    commission_payouts: Mapped[List["CommissionPayoutModel"]] = relationship(
        "CommissionPayoutModel", back_populates="barber", cascade="all, delete-orphan", lazy="selectin"
    )

class BarberScheduleModel(BaseModel):
    __tablename__ = "barber_schedules"

    barber_id: Mapped[str] = mapped_column(String(36), ForeignKey("barbers.id", ondelete="CASCADE"), nullable=False)
    weekday: Mapped[int] = mapped_column(Integer, nullable=False) # 0=Monday, 6=Sunday
    start_time: Mapped[str] = mapped_column(String(5), nullable=False) # "08:00"
    end_time: Mapped[str] = mapped_column(String(5), nullable=False)   # "20:00"

    barber: Mapped[BarberModel] = relationship("BarberModel", back_populates="schedules")

class BarberTimeOffModel(BaseModel):
    __tablename__ = "barber_time_offs"

    barber_id: Mapped[str] = mapped_column(String(36), ForeignKey("barbers.id", ondelete="CASCADE"), nullable=False)
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    reason: Mapped[str] = mapped_column(String(255), default="Permiso / Vacaciones", nullable=False)

    barber: Mapped[BarberModel] = relationship("BarberModel", back_populates="time_offs")

class AppointmentModel(BaseModel):
    __tablename__ = "appointments"

    client_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    client_name: Mapped[str] = mapped_column(String(120), nullable=False)
    client_phone: Mapped[str] = mapped_column(String(30), default="", nullable=False)

    barber_id: Mapped[str] = mapped_column(String(36), ForeignKey("barbers.id"), nullable=False, index=True)
    barber_name: Mapped[str] = mapped_column(String(120), nullable=False)

    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    total_price: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="confirmed", nullable=False) # pending, confirmed, completed, cancelled, no_show

    # Check-in (boleto QR): cuando el cliente llega, o el personal lo marca manualmente.
    checked_in_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Comisión del barbero para esta cita. Se calcula y congela (snapshot) con la
    # commission_rate vigente del barbero en el momento en que la cita pasa a
    # "completed", para que cambios futuros a la tarifa no alteren el historico.
    commission_amount: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    commission_paid: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    barber: Mapped[BarberModel] = relationship("BarberModel", back_populates="appointments")
    items: Mapped[List["AppointmentItemModel"]] = relationship(
        "AppointmentItemModel", back_populates="appointment", cascade="all, delete-orphan", lazy="selectin"
    )

class AppointmentItemModel(BaseModel):
    __tablename__ = "appointment_items"

    appointment_id: Mapped[str] = mapped_column(String(36), ForeignKey("appointments.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    price: Mapped[int] = mapped_column(Integer, nullable=False)

    appointment: Mapped[AppointmentModel] = relationship("AppointmentModel", back_populates="items")

class CommissionPayoutModel(BaseModel):
    """Registro historico de pagos de comision realizados a un barbero.
    `created_at` (heredado de BaseModel) es la fecha del pago."""
    __tablename__ = "commission_payouts"

    barber_id: Mapped[str] = mapped_column(String(36), ForeignKey("barbers.id", ondelete="CASCADE"), nullable=False, index=True)
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    appointments_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    barber: Mapped[BarberModel] = relationship("BarberModel", back_populates="commission_payouts")

class BookingSettingsModel(BaseModel):
    __tablename__ = "booking_settings"

    cancel_min_hours: Mapped[int] = mapped_column(Integer, default=2, nullable=False)
    slot_minutes: Mapped[int] = mapped_column(Integer, default=15, nullable=False)
    opening_hours: Mapped[dict] = mapped_column(
        JSON,
        default=lambda: {
            "0": {"open": "08:00", "close": "21:00"},
            "1": {"open": "08:00", "close": "21:00"},
            "2": {"open": "08:00", "close": "21:00"},
            "3": {"open": "08:00", "close": "21:00"},
            "4": {"open": "08:00", "close": "21:00"},
            "5": {"open": "08:00", "close": "20:00"},
            "6": {"open": "10:00", "close": "18:00"},
        },
        nullable=False
    )

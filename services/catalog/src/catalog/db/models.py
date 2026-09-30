from typing import List
from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship
from libs.common.database import Base, BaseModel

combo_services_table = Table(
    "combo_services",
    Base.metadata,
    Column("combo_id", String(36), ForeignKey("combos.id", ondelete="CASCADE"), primary_key=True),
    Column("service_id", String(36), ForeignKey("services.id", ondelete="CASCADE"), primary_key=True),
)

class ServiceModel(BaseModel):
    __tablename__ = "services"

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(String(500), default="", nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    price: Mapped[int] = mapped_column(Integer, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    combos: Mapped[List["ComboModel"]] = relationship(
        "ComboModel",
        secondary=combo_services_table,
        back_populates="services",
        lazy="selectin",
    )

class ComboModel(BaseModel):
    __tablename__ = "combos"

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(String(500), default="", nullable=False)
    price: Mapped[int] = mapped_column(Integer, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    services: Mapped[List[ServiceModel]] = relationship(
        "ServiceModel",
        secondary=combo_services_table,
        back_populates="combos",
        lazy="selectin",
    )

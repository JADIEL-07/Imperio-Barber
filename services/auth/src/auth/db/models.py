from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column
from libs.common.database import BaseModel

class UserModel(BaseModel):
    __tablename__ = "users"

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    phone: Mapped[str] = mapped_column(String(30), default="", nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), default="client", nullable=False) # admin, employee, client
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

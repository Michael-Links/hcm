import enum
from sqlalchemy import Column, Integer, String, Enum, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

DEFAULT_LANGUAGE_PREFERENCE = "en"

class Role(str, enum.Enum):
    HR = "HR"
    MANAGER = "MANAGER"
    EMPLOYEE = "EMPLOYEE"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(Role), nullable=False, default=Role.EMPLOYEE)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    language_preference = Column(String, nullable=False, default=DEFAULT_LANGUAGE_PREFERENCE, server_default=DEFAULT_LANGUAGE_PREFERENCE)

    employee = relationship("Employee", back_populates="user", foreign_keys=[employee_id])

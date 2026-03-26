import enum
from sqlalchemy import Column, Integer, String, Enum, ForeignKey, Date
from sqlalchemy.orm import relationship
from app.database import Base

class EmployeeStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    TERMINATED = "TERMINATED"

class Employee(Base):
    __tablename__ = "employees"
    id = Column(Integer, primary_key=True, index=True)
    employee_number = Column(String, unique=True, nullable=False, index=True)
    position_id = Column(Integer, ForeignKey("positions.id"), nullable=False)
    hire_date = Column(Date, nullable=False)
    status = Column(Enum(EmployeeStatus), nullable=False, default=EmployeeStatus.ACTIVE)
    position = relationship("Position", back_populates="employees")
    personal_info = relationship("PersonalInfo", back_populates="employee", uselist=False, cascade="all, delete-orphan")
    user = relationship("User", back_populates="employee", uselist=False, foreign_keys="[User.employee_id]")
    compensation_packages = relationship("CompensationPackage", back_populates="employee", cascade="all, delete-orphan")

class PersonalInfo(Base):
    __tablename__ = "personal_info"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), unique=True, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    gender = Column(String, nullable=True)
    date_of_birth = Column(Date, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address_line1 = Column(String, nullable=True)
    address_line2 = Column(String, nullable=True)
    city = Column(String, nullable=True)
    country = Column(String, nullable=True)
    employee = relationship("Employee", back_populates="personal_info")

import enum
from sqlalchemy import Column, Integer, String, Enum, ForeignKey, Date, Float
from sqlalchemy.orm import relationship
from app.database import Base

class RecurringPaymentType(str, enum.Enum):
    SALARY = "SALARY"
    ALLOWANCE = "ALLOWANCE"
    DEDUCTION = "DEDUCTION"

class OneTimePaymentType(str, enum.Enum):
    BONUS = "BONUS"
    REIMBURSEMENT = "REIMBURSEMENT"

class CompensationPackage(Base):
    __tablename__ = "compensation_packages"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    name = Column(String, nullable=False)
    effective_date = Column(Date, nullable=False)
    employee = relationship("Employee", back_populates="compensation_packages")
    recurring_payments = relationship("RecurringPayment", back_populates="package", cascade="all, delete-orphan")
    one_time_payments = relationship("OneTimePayment", back_populates="package", cascade="all, delete-orphan")

class RecurringPayment(Base):
    __tablename__ = "recurring_payments"
    id = Column(Integer, primary_key=True, index=True)
    package_id = Column(Integer, ForeignKey("compensation_packages.id"), nullable=False)
    type = Column(Enum(RecurringPaymentType), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String, nullable=False, default="USD")
    frequency = Column(String, nullable=False, default="MONTHLY")
    package = relationship("CompensationPackage", back_populates="recurring_payments")

class OneTimePayment(Base):
    __tablename__ = "one_time_payments"
    id = Column(Integer, primary_key=True, index=True)
    package_id = Column(Integer, ForeignKey("compensation_packages.id"), nullable=False)
    type = Column(Enum(OneTimePaymentType), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String, nullable=False, default="USD")
    payment_date = Column(Date, nullable=False)
    package = relationship("CompensationPackage", back_populates="one_time_payments")

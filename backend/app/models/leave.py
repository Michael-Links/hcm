import enum
from sqlalchemy import Column, Integer, String, Enum, ForeignKey, Date, Boolean, Float, Text, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base

class LeaveType(Base):
    __tablename__ = "leave_types"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    code = Column(String, nullable=False, unique=True)
    default_balance = Column(Float, nullable=False, default=0)
    is_paid = Column(Boolean, default=True)
    requires_approval = Column(Boolean, default=True)
    max_consecutive_days = Column(Integer, nullable=True)

class LeaveRequestStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"

class LeaveBalance(Base):
    __tablename__ = "leave_balances"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    leave_type_id = Column(Integer, ForeignKey("leave_types.id"), nullable=False)
    year = Column(Integer, nullable=False)
    entitled = Column(Float, nullable=False, default=0)
    used = Column(Float, nullable=False, default=0)
    pending = Column(Float, nullable=False, default=0)
    employee = relationship("Employee", backref="leave_balances")
    leave_type = relationship("LeaveType")

class LeaveRequest(Base):
    __tablename__ = "leave_requests"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    leave_type_id = Column(Integer, ForeignKey("leave_types.id"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    days = Column(Float, nullable=False)
    reason = Column(Text, nullable=True)
    status = Column(Enum(LeaveRequestStatus), default=LeaveRequestStatus.PENDING, nullable=False)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    employee = relationship("Employee", backref="leave_requests")
    leave_type = relationship("LeaveType")

import enum
from sqlalchemy import Column, Integer, String, Enum, ForeignKey, Date, Text
from sqlalchemy.orm import relationship
from app.database import Base


class EventType(str, enum.Enum):
    HIRE = "HIRE"
    TRANSFER = "TRANSFER"
    PROMOTE = "PROMOTE"
    STATUS_CHANGE = "STATUS_CHANGE"
    TERMINATE = "TERMINATE"


class EmploymentEvent(Base):
    __tablename__ = "employment_events"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    event_type = Column(Enum(EventType), nullable=False)
    effective_date = Column(Date, nullable=False)
    description = Column(Text, nullable=True)
    # For transfers/promotions
    old_position_id = Column(Integer, ForeignKey("positions.id"), nullable=True)
    new_position_id = Column(Integer, ForeignKey("positions.id"), nullable=True)
    # For status changes
    old_status = Column(String, nullable=True)
    new_status = Column(String, nullable=True)
    # For compensation changes (promotions)
    new_salary = Column(String, nullable=True)
    reason = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    employee = relationship("Employee", backref="employment_events")

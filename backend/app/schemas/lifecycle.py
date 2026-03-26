from pydantic import BaseModel
from datetime import date
from app.models.employment_event import EventType


class StatusChangeRequest(BaseModel):
    new_status: str  # ACTIVE, INACTIVE, TERMINATED
    reason: str
    effective_date: date


class TransferRequest(BaseModel):
    new_position_id: int
    reason: str
    effective_date: date


class PromoteRequest(BaseModel):
    new_position_id: int
    new_salary: float | None = None
    reason: str
    effective_date: date


class EmploymentEventOut(BaseModel):
    id: int
    event_type: EventType
    effective_date: date
    description: str | None = None
    old_position_id: int | None = None
    new_position_id: int | None = None
    old_status: str | None = None
    new_status: str | None = None
    reason: str | None = None

    class Config:
        from_attributes = True

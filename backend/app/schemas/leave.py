from pydantic import BaseModel
from datetime import date, datetime
from app.models.leave import LeaveRequestStatus

class LeaveTypeCreate(BaseModel):
    name: str
    code: str
    default_balance: float = 0
    is_paid: bool = True
    requires_approval: bool = True
    max_consecutive_days: int | None = None

class LeaveTypeOut(BaseModel):
    id: int
    name: str
    code: str
    default_balance: float
    is_paid: bool
    requires_approval: bool
    max_consecutive_days: int | None = None
    class Config:
        from_attributes = True

class LeaveBalanceOut(BaseModel):
    id: int
    leave_type_id: int
    leave_type_name: str
    year: int
    entitled: float
    used: float
    pending: float
    balance: float
    class Config:
        from_attributes = True

class LeaveRequestCreate(BaseModel):
    leave_type_id: int
    start_date: date
    end_date: date
    reason: str | None = None

class LeaveRequestOut(BaseModel):
    id: int
    employee_id: int
    leave_type_id: int
    leave_type_name: str
    employee_name: str
    start_date: date
    end_date: date
    days: float
    reason: str | None = None
    status: LeaveRequestStatus
    approved_by: int | None = None
    created_at: datetime
    class Config:
        from_attributes = True

class LeaveTypeUpdate(BaseModel):
    name: str | None = None
    code: str | None = None
    default_balance: float | None = None
    is_paid: bool | None = None
    requires_approval: bool | None = None
    max_consecutive_days: int | None = None

class LeaveBalanceAdjust(BaseModel):
    leave_type_id: int
    adjustment: float
    reason: str

class LeaveApprovalRequest(BaseModel):
    status: str  # APPROVED or REJECTED
    reason: str | None = None

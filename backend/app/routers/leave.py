from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import require_role, get_current_user
from app.models.user import User, Role
from app.models.leave import LeaveType, LeaveBalance, LeaveRequest
from app.schemas.leave import LeaveTypeCreate, LeaveTypeOut, LeaveTypeUpdate, LeaveBalanceOut, LeaveBalanceAdjust, LeaveRequestCreate, LeaveRequestOut, LeaveApprovalRequest
from app.services.leave_service import (
    create_leave_type, get_leave_types, get_employee_balances,
    submit_leave_request, get_employee_requests, get_team_requests,
    get_all_requests, approve_or_reject, cancel_request, _request_to_dict,
)
from datetime import date

router = APIRouter(tags=["leave"])

# --- Leave Types (HR) ---
@router.get("/api/leave-types", response_model=list[LeaveTypeOut])
def list_leave_types(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_leave_types(db)

@router.post("/api/leave-types", response_model=LeaveTypeOut, status_code=201)
def add_leave_type(data: LeaveTypeCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role(Role.HR))):
    return create_leave_type(db, data)

@router.put("/api/leave-types/{type_id}", response_model=LeaveTypeOut)
def update_leave_type(type_id: int, data: LeaveTypeUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_role(Role.HR))):
    lt = db.query(LeaveType).filter(LeaveType.id == type_id).first()
    if not lt:
        raise HTTPException(404, "Leave type not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(lt, field, value)
    db.commit()
    db.refresh(lt)
    return lt

@router.delete("/api/leave-types/{type_id}", status_code=204)
def delete_leave_type(type_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role(Role.HR))):
    lt = db.query(LeaveType).filter(LeaveType.id == type_id).first()
    if not lt:
        raise HTTPException(404, "Leave type not found")
    in_use = (
        db.query(LeaveBalance).filter(LeaveBalance.leave_type_id == type_id).first() is not None
        or db.query(LeaveRequest).filter(LeaveRequest.leave_type_id == type_id).first() is not None
    )
    if in_use:
        raise HTTPException(400, "Cannot delete leave type that is in use")
    db.delete(lt)
    db.commit()

# --- Self-service leave ---
@router.get("/api/me/leave-balances")
def my_balances(year: int | None = Query(None), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.employee_id:
        raise HTTPException(404, "No employee profile")
    return get_employee_balances(db, current_user.employee_id, year)

@router.post("/api/me/leave-requests", status_code=201)
def submit_request(data: LeaveRequestCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.employee_id:
        raise HTTPException(404, "No employee profile")
    try:
        req = submit_leave_request(db, current_user.employee_id, data)
        return _request_to_dict(req, db)
    except ValueError as e:
        raise HTTPException(400, str(e))

@router.get("/api/me/leave-requests")
def my_requests(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.employee_id:
        raise HTTPException(404, "No employee profile")
    return get_employee_requests(db, current_user.employee_id)

@router.post("/api/me/leave-requests/{request_id}/cancel")
def cancel_my_request(request_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.employee_id:
        raise HTTPException(404, "No employee profile")
    try:
        req = cancel_request(db, request_id, current_user.employee_id)
        return _request_to_dict(req, db)
    except ValueError as e:
        raise HTTPException(400, str(e))

# --- Manager team leave ---
@router.get("/api/me/team/leave-requests")
def team_requests(status: str | None = Query(None), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in (Role.MANAGER, Role.HR):
        raise HTTPException(403, "Not a manager")
    if not current_user.employee_id:
        raise HTTPException(404, "No employee profile")
    return get_team_requests(db, current_user.employee_id, status)

@router.patch("/api/me/team/leave-requests/{request_id}")
def approve_reject(request_id: int, data: LeaveApprovalRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in (Role.MANAGER, Role.HR):
        raise HTTPException(403, "Not a manager")
    try:
        req = approve_or_reject(db, request_id, current_user.id, data.status)
        return _request_to_dict(req, db)
    except ValueError as e:
        raise HTTPException(400, str(e))

# --- HR overview ---
@router.get("/api/leave-requests")
def all_requests(status: str | None = Query(None), db: Session = Depends(get_db), current_user: User = Depends(require_role(Role.HR))):
    return get_all_requests(db, status)

# --- HR view employee balances ---
@router.get("/api/employees/{employee_id}/leave-balances")
def employee_balances(employee_id: int, year: int | None = Query(None), db: Session = Depends(get_db), current_user: User = Depends(require_role(Role.HR))):
    return get_employee_balances(db, employee_id, year)

@router.post("/api/employees/{employee_id}/leave-balances/adjust")
def adjust_leave_balance(employee_id: int, data: LeaveBalanceAdjust, db: Session = Depends(get_db), current_user: User = Depends(require_role(Role.HR))):
    lt = db.query(LeaveType).filter(LeaveType.id == data.leave_type_id).first()
    if not lt:
        raise HTTPException(404, "Leave type not found")
    year = date.today().year
    balance = db.query(LeaveBalance).filter(
        LeaveBalance.employee_id == employee_id,
        LeaveBalance.leave_type_id == data.leave_type_id,
        LeaveBalance.year == year,
    ).first()
    if not balance:
        balance = LeaveBalance(employee_id=employee_id, leave_type_id=data.leave_type_id, year=year, entitled=lt.default_balance)
        db.add(balance)
        db.flush()
    balance.entitled = balance.entitled + data.adjustment
    db.commit()
    db.refresh(balance)
    return {
        "id": balance.id, "leave_type_id": balance.leave_type_id,
        "leave_type_name": balance.leave_type.name if balance.leave_type else "",
        "year": balance.year, "entitled": balance.entitled, "used": balance.used,
        "pending": balance.pending, "balance": balance.entitled - balance.used - balance.pending,
        "reason": data.reason,
    }

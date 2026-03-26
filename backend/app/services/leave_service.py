from datetime import date, datetime, timezone, timedelta
from sqlalchemy.orm import Session
from app.models.leave import LeaveType, LeaveBalance, LeaveRequest, LeaveRequestStatus
from app.models.employee import Employee

def create_leave_type(db: Session, data) -> LeaveType:
    lt = LeaveType(name=data.name, code=data.code, default_balance=data.default_balance,
                   is_paid=data.is_paid, requires_approval=data.requires_approval,
                   max_consecutive_days=data.max_consecutive_days)
    db.add(lt)
    db.commit()
    db.refresh(lt)
    return lt

def get_leave_types(db: Session) -> list[LeaveType]:
    return db.query(LeaveType).all()

def initialize_balances(db: Session, employee_id: int, year: int | None = None):
    """Create leave balances for all leave types for an employee."""
    if year is None:
        year = date.today().year
    leave_types = db.query(LeaveType).all()
    for lt in leave_types:
        existing = db.query(LeaveBalance).filter(
            LeaveBalance.employee_id == employee_id,
            LeaveBalance.leave_type_id == lt.id,
            LeaveBalance.year == year
        ).first()
        if not existing:
            bal = LeaveBalance(employee_id=employee_id, leave_type_id=lt.id, year=year, entitled=lt.default_balance)
            db.add(bal)
    db.commit()

def get_employee_balances(db: Session, employee_id: int, year: int | None = None) -> list[dict]:
    if year is None:
        year = date.today().year
    initialize_balances(db, employee_id, year)
    balances = db.query(LeaveBalance).filter(
        LeaveBalance.employee_id == employee_id, LeaveBalance.year == year
    ).all()
    result = []
    for b in balances:
        result.append({
            "id": b.id, "leave_type_id": b.leave_type_id,
            "leave_type_name": b.leave_type.name if b.leave_type else "",
            "year": b.year, "entitled": b.entitled, "used": b.used, "pending": b.pending,
            "balance": b.entitled - b.used - b.pending,
        })
    return result

def submit_leave_request(db: Session, employee_id: int, data) -> LeaveRequest:
    days = _count_business_days(data.start_date, data.end_date)
    if days <= 0:
        raise ValueError("End date must be after start date")

    # Check for overlapping requests
    overlap = db.query(LeaveRequest).filter(
        LeaveRequest.employee_id == employee_id,
        LeaveRequest.status.in_([LeaveRequestStatus.PENDING, LeaveRequestStatus.APPROVED]),
        LeaveRequest.start_date <= data.end_date,
        LeaveRequest.end_date >= data.start_date,
    ).first()
    if overlap:
        raise ValueError("Overlapping leave request exists")

    # Check balance
    year = data.start_date.year
    initialize_balances(db, employee_id, year)
    balance = db.query(LeaveBalance).filter(
        LeaveBalance.employee_id == employee_id,
        LeaveBalance.leave_type_id == data.leave_type_id,
        LeaveBalance.year == year,
    ).first()
    if balance and (balance.entitled - balance.used - balance.pending) < days:
        raise ValueError("Insufficient leave balance")

    req = LeaveRequest(employee_id=employee_id, leave_type_id=data.leave_type_id,
                       start_date=data.start_date, end_date=data.end_date, days=days, reason=data.reason)
    db.add(req)

    if balance:
        balance.pending += days

    db.commit()
    db.refresh(req)
    return req

def get_employee_requests(db: Session, employee_id: int) -> list[dict]:
    requests = db.query(LeaveRequest).filter(LeaveRequest.employee_id == employee_id).order_by(LeaveRequest.created_at.desc()).all()
    return [_request_to_dict(r, db) for r in requests]

def get_team_requests(db: Session, manager_employee_id: int, status_filter: str | None = None) -> list[dict]:
    """Get leave requests from employees who report to this manager."""
    from app.models.organization import Position
    manager = db.query(Employee).filter(Employee.id == manager_employee_id).first()
    if not manager:
        return []
    sub_positions = db.query(Position).filter(Position.reports_to_id == manager.position_id).all()
    sub_pos_ids = [p.id for p in sub_positions]
    if not sub_pos_ids:
        return []
    query = db.query(LeaveRequest).join(Employee).filter(Employee.position_id.in_(sub_pos_ids))
    if status_filter:
        query = query.filter(LeaveRequest.status == status_filter)
    requests = query.order_by(LeaveRequest.created_at.desc()).all()
    return [_request_to_dict(r, db) for r in requests]

def get_all_requests(db: Session, status_filter: str | None = None) -> list[dict]:
    query = db.query(LeaveRequest)
    if status_filter:
        query = query.filter(LeaveRequest.status == status_filter)
    requests = query.order_by(LeaveRequest.created_at.desc()).all()
    return [_request_to_dict(r, db) for r in requests]

def approve_or_reject(db: Session, request_id: int, approver_id: int, new_status: str) -> LeaveRequest:
    req = db.query(LeaveRequest).filter(LeaveRequest.id == request_id).first()
    if not req:
        raise ValueError("Request not found")
    if req.status != LeaveRequestStatus.PENDING:
        raise ValueError("Only pending requests can be approved/rejected")

    balance = db.query(LeaveBalance).filter(
        LeaveBalance.employee_id == req.employee_id,
        LeaveBalance.leave_type_id == req.leave_type_id,
        LeaveBalance.year == req.start_date.year,
    ).first()

    if new_status == "APPROVED":
        req.status = LeaveRequestStatus.APPROVED
        if balance:
            balance.pending -= req.days
            balance.used += req.days
    elif new_status == "REJECTED":
        req.status = LeaveRequestStatus.REJECTED
        if balance:
            balance.pending -= req.days
    else:
        raise ValueError("Status must be APPROVED or REJECTED")

    req.approved_by = approver_id
    req.approved_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(req)
    return req

def cancel_request(db: Session, request_id: int, employee_id: int) -> LeaveRequest:
    req = db.query(LeaveRequest).filter(LeaveRequest.id == request_id, LeaveRequest.employee_id == employee_id).first()
    if not req:
        raise ValueError("Request not found")
    if req.status != LeaveRequestStatus.PENDING:
        raise ValueError("Only pending requests can be cancelled")

    req.status = LeaveRequestStatus.CANCELLED
    balance = db.query(LeaveBalance).filter(
        LeaveBalance.employee_id == employee_id,
        LeaveBalance.leave_type_id == req.leave_type_id,
        LeaveBalance.year == req.start_date.year,
    ).first()
    if balance:
        balance.pending -= req.days

    db.commit()
    db.refresh(req)
    return req

def _count_business_days(start: date, end: date) -> float:
    count = 0
    current = start
    while current <= end:
        if current.weekday() < 5:  # Mon-Fri
            count += 1
        current += timedelta(days=1)
    return float(count)

def _request_to_dict(r: LeaveRequest, db: Session) -> dict:
    emp = db.query(Employee).filter(Employee.id == r.employee_id).first()
    pi = emp.personal_info if emp else None
    emp_name = f"{pi.first_name} {pi.last_name}" if pi else f"EMP-{r.employee_id}"
    return {
        "id": r.id, "employee_id": r.employee_id, "leave_type_id": r.leave_type_id,
        "leave_type_name": r.leave_type.name if r.leave_type else "",
        "employee_name": emp_name,
        "start_date": r.start_date, "end_date": r.end_date, "days": r.days,
        "reason": r.reason, "status": r.status, "approved_by": r.approved_by,
        "created_at": r.created_at,
    }

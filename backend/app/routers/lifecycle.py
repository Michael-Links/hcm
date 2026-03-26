from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import require_role, get_current_user
from app.models.user import User, Role
from app.schemas.lifecycle import StatusChangeRequest, TransferRequest, PromoteRequest, EmploymentEventOut
from app.schemas.employee import EmployeeOut
from app.services.lifecycle_service import change_status, transfer_employee, promote_employee, get_employee_history
from app.services.audit_service import log_action

router = APIRouter(prefix="/api/employees", tags=["lifecycle"])


@router.post("/{employee_id}/status-change", response_model=EmployeeOut)
def status_change(employee_id: int, data: StatusChangeRequest, db: Session = Depends(get_db), current_user: User = Depends(require_role(Role.HR))):
    try:
        result = change_status(db, employee_id, data.new_status, data.reason, data.effective_date, current_user.id)
        log_action(db, current_user.id, current_user.email, "UPDATE", "Employee", str(employee_id), f"Status: {data.new_status} - {data.reason}")
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{employee_id}/transfer", response_model=EmployeeOut)
def transfer(employee_id: int, data: TransferRequest, db: Session = Depends(get_db), current_user: User = Depends(require_role(Role.HR))):
    try:
        result = transfer_employee(db, employee_id, data.new_position_id, data.reason, data.effective_date, current_user.id)
        log_action(db, current_user.id, current_user.email, "UPDATE", "Employee", str(employee_id), f"Transferred - {data.reason}")
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{employee_id}/promote", response_model=EmployeeOut)
def promote(employee_id: int, data: PromoteRequest, db: Session = Depends(get_db), current_user: User = Depends(require_role(Role.HR))):
    try:
        result = promote_employee(db, employee_id, data.new_position_id, data.new_salary, data.reason, data.effective_date, current_user.id)
        log_action(db, current_user.id, current_user.email, "UPDATE", "Employee", str(employee_id), f"Promoted - {data.reason}")
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{employee_id}/history", response_model=list[EmploymentEventOut])
def history(employee_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role(Role.HR, Role.MANAGER))):
    return get_employee_history(db, employee_id)

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.dependencies import require_role, get_current_user
from app.models.user import User, Role
from app.models.employee import Employee, PersonalInfo
from app.schemas.employee import OnboardRequest, EmployeeOut, EmployeeListOut, EmployeeUpdate
from app.services.employee_service import onboard_employee, get_employee, list_employees, update_employee, list_employees_paginated
from app.services.audit_service import log_action

router = APIRouter(prefix="/api/employees", tags=["employees"])

@router.post("/onboard", response_model=EmployeeOut, status_code=201)
def onboard(data: OnboardRequest, db: Session = Depends(get_db), current_user: User = Depends(require_role(Role.HR))):
    try:
        employee = onboard_employee(db, data)
        log_action(db, current_user.id, current_user.email, "CREATE", "Employee", str(employee.employee_number), f"Onboarded {employee.employee_number}")
        return employee
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("")
def list_all(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    status: str | None = Query(None),
    department_id: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(Role.HR)),
):
    return list_employees_paginated(db, page, per_page, search, status, department_id)

@router.put("/{employee_id}", response_model=EmployeeOut)
def update(employee_id: int, data: EmployeeUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_role(Role.HR))):
    result = update_employee(db, employee_id, data.model_dump(exclude_unset=True))
    if not result:
        raise HTTPException(status_code=404, detail="Employee not found")
    return result

@router.get("/{employee_id}", response_model=EmployeeOut)
def get_by_id(employee_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role(Role.HR, Role.MANAGER))):
    emp = get_employee(db, employee_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp

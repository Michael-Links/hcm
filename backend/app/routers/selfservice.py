from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User, Role
from app.schemas.auth import UserPreferencesOut, UserPreferencesUpdate
from app.schemas.employee import EmployeeOut, PersonalInfoUpdate, EmployeeListOut
from app.schemas.compensation import CompensationPackageOut
from app.services.employee_service import get_employee, get_direct_reports

router = APIRouter(prefix="/api/me", tags=["self-service"])

@router.get("", response_model=EmployeeOut)
def my_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.employee_id:
        raise HTTPException(status_code=404, detail="No employee profile linked")
    emp = get_employee(db, current_user.employee_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp

@router.patch("", response_model=EmployeeOut)
def update_my_profile(data: PersonalInfoUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.employee_id:
        raise HTTPException(status_code=404, detail="No employee profile linked")
    emp = get_employee(db, current_user.employee_id)
    if not emp or not emp.personal_info:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(emp.personal_info, field, value)
    db.commit()
    db.refresh(emp)
    return emp

@router.get("/team", response_model=list[EmployeeListOut])
def my_team(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in (Role.MANAGER, Role.HR):
        raise HTTPException(status_code=403, detail="Not a manager")
    if not current_user.employee_id:
        raise HTTPException(status_code=404, detail="No employee profile linked")
    return get_direct_reports(db, current_user.employee_id)


@router.get("/compensation", response_model=list[CompensationPackageOut])
def my_compensation(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.employee_id:
        raise HTTPException(status_code=404, detail="No employee profile")
    from app.services.compensation_service import get_employee_compensation
    return get_employee_compensation(db, current_user.employee_id)


@router.get("/preferences", response_model=UserPreferencesOut)
def my_preferences(current_user: User = Depends(get_current_user)):
    return UserPreferencesOut(language_preference=current_user.language_preference)


@router.patch("/preferences", response_model=UserPreferencesOut)
def update_my_preferences(
    data: UserPreferencesUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_user.language_preference = data.language_preference
    db.commit()
    db.refresh(current_user)
    return UserPreferencesOut(language_preference=current_user.language_preference)

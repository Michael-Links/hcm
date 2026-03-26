from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.employee import Employee, PersonalInfo

router = APIRouter(tags=["directory"])


@router.get("/api/directory")
def directory(
    search: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Public employee directory — returns non-sensitive info for all authenticated users."""
    query = db.query(Employee).options(
        joinedload(Employee.personal_info),
        joinedload(Employee.position),
    )
    if search:
        query = query.join(PersonalInfo).filter(
            (PersonalInfo.first_name.ilike(f"%{search}%"))
            | (PersonalInfo.last_name.ilike(f"%{search}%"))
        )
    employees = query.filter(Employee.status == "ACTIVE").all()
    return [
        {
            "id": e.id,
            "employee_number": e.employee_number,
            "first_name": e.personal_info.first_name if e.personal_info else "",
            "last_name": e.personal_info.last_name if e.personal_info else "",
            "email": e.personal_info.email if e.personal_info else "",
            "phone": e.personal_info.phone if e.personal_info else "",
            "position_title": e.position.title if e.position else "",
            "department_name": e.position.department.name if e.position and e.position.department else "",
        }
        for e in employees
    ]

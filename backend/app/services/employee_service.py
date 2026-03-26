from datetime import date
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.models.employee import Employee, PersonalInfo, EmployeeStatus
from app.models.compensation import CompensationPackage, RecurringPayment, RecurringPaymentType
from app.models.organization import Position
from app.schemas.employee import OnboardRequest

def _generate_employee_number(db: Session) -> str:
    max_emp = db.query(func.count(Employee.id)).scalar()
    return f"EMP-{(max_emp + 1):06d}"

def onboard_employee(db: Session, data: OnboardRequest) -> Employee:
    # Verify position exists and is active
    position = db.query(Position).filter(Position.id == data.position_id, Position.is_active == True).first()
    if not position:
        raise ValueError("Position not found or inactive")

    employee_number = _generate_employee_number(db)

    employee = Employee(
        employee_number=employee_number,
        position_id=data.position_id,
        hire_date=data.hire_date,
        status=EmployeeStatus.ACTIVE,
    )
    db.add(employee)
    db.flush()

    personal_info = PersonalInfo(
        employee_id=employee.id,
        first_name=data.personal_info.first_name,
        last_name=data.personal_info.last_name,
        gender=data.personal_info.gender,
        date_of_birth=data.personal_info.date_of_birth,
        email=data.personal_info.email,
        phone=data.personal_info.phone,
        address_line1=data.personal_info.address_line1,
        address_line2=data.personal_info.address_line2,
        city=data.personal_info.city,
        country=data.personal_info.country,
    )
    db.add(personal_info)

    if data.compensation and data.compensation.salary_amount:
        package = CompensationPackage(
            employee_id=employee.id,
            name=data.compensation.package_name,
            effective_date=data.hire_date,
        )
        db.add(package)
        db.flush()

        salary = RecurringPayment(
            package_id=package.id,
            type=RecurringPaymentType.SALARY,
            amount=data.compensation.salary_amount,
            currency=data.compensation.salary_currency,
            frequency="MONTHLY",
        )
        db.add(salary)

    db.commit()
    db.refresh(employee)
    return employee

def get_employee(db: Session, employee_id: int) -> Employee | None:
    return db.query(Employee).options(
        joinedload(Employee.personal_info),
        joinedload(Employee.position),
    ).filter(Employee.id == employee_id).first()

def list_employees(db: Session) -> list[dict]:
    employees = db.query(Employee).options(
        joinedload(Employee.personal_info),
        joinedload(Employee.position),
    ).all()
    result = []
    for emp in employees:
        pi = emp.personal_info
        result.append({
            "id": emp.id,
            "employee_number": emp.employee_number,
            "hire_date": emp.hire_date,
            "status": emp.status,
            "first_name": pi.first_name if pi else "",
            "last_name": pi.last_name if pi else "",
            "position_title": emp.position.title if emp.position else "",
            "department_name": emp.position.department.name if emp.position and emp.position.department else "",
        })
    return result

def update_employee(db: Session, employee_id: int, data: dict) -> Employee | None:
    employee = get_employee(db, employee_id)
    if not employee:
        return None
    if 'personal_info' in data and employee.personal_info:
        for field, value in data['personal_info'].items():
            if hasattr(employee.personal_info, field):
                setattr(employee.personal_info, field, value)
    if 'position_id' in data:
        employee.position_id = data['position_id']
    db.commit()
    db.refresh(employee)
    return employee

def list_employees_paginated(db: Session, page: int = 1, per_page: int = 20, search: str | None = None, status: str | None = None, department_id: int | None = None) -> dict:
    query = db.query(Employee).options(
        joinedload(Employee.personal_info),
        joinedload(Employee.position),
    )

    if search:
        query = query.join(PersonalInfo).filter(
            (PersonalInfo.first_name.ilike(f"%{search}%")) |
            (PersonalInfo.last_name.ilike(f"%{search}%")) |
            (Employee.employee_number.ilike(f"%{search}%"))
        )

    if status:
        query = query.filter(Employee.status == status)

    if department_id:
        query = query.join(Position).filter(Position.department_id == department_id)

    total = query.count()
    employees = query.offset((page - 1) * per_page).limit(per_page).all()

    items = []
    for emp in employees:
        pi = emp.personal_info
        items.append({
            "id": emp.id,
            "employee_number": emp.employee_number,
            "hire_date": emp.hire_date,
            "status": emp.status,
            "first_name": pi.first_name if pi else "",
            "last_name": pi.last_name if pi else "",
            "position_title": emp.position.title if emp.position else "",
            "department_name": emp.position.department.name if emp.position and emp.position.department else "",
        })

    import math
    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": math.ceil(total / per_page) if total > 0 else 1,
    }


def get_direct_reports(db: Session, employee_id: int) -> list[dict]:
    """Get employees whose position reports to the position of the given employee."""
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        return []
    
    subordinate_positions = db.query(Position).filter(Position.reports_to_id == employee.position_id).all()
    sub_position_ids = [p.id for p in subordinate_positions]
    
    if not sub_position_ids:
        return []
    
    reports = db.query(Employee).options(
        joinedload(Employee.personal_info),
        joinedload(Employee.position),
    ).filter(Employee.position_id.in_(sub_position_ids)).all()
    
    result = []
    for emp in reports:
        pi = emp.personal_info
        result.append({
            "id": emp.id,
            "employee_number": emp.employee_number,
            "hire_date": emp.hire_date,
            "status": emp.status,
            "first_name": pi.first_name if pi else "",
            "last_name": pi.last_name if pi else "",
            "position_title": emp.position.title if emp.position else "",
            "department_name": emp.position.department.name if emp.position and emp.position.department else "",
        })
    return result

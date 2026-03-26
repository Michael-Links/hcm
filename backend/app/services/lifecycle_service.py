from datetime import date
from sqlalchemy.orm import Session
from app.models.employee import Employee, EmployeeStatus
from app.models.employment_event import EmploymentEvent, EventType
from app.models.organization import Position
from app.models.compensation import CompensationPackage, RecurringPayment, RecurringPaymentType


def change_status(db: Session, employee_id: int, new_status: str, reason: str, effective_date: date, user_id: int) -> Employee:
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise ValueError("Employee not found")

    old_status = employee.status.value if isinstance(employee.status, EmployeeStatus) else str(employee.status)

    valid_transitions = {
        "ACTIVE": ["INACTIVE", "TERMINATED"],
        "INACTIVE": ["ACTIVE", "TERMINATED"],
        "TERMINATED": [],
    }
    if new_status not in valid_transitions.get(old_status, []):
        raise ValueError(f"Invalid status transition from {old_status} to {new_status}")

    employee.status = new_status

    event = EmploymentEvent(
        employee_id=employee_id,
        event_type=EventType.STATUS_CHANGE if new_status != "TERMINATED" else EventType.TERMINATE,
        effective_date=effective_date,
        old_status=old_status,
        new_status=new_status,
        reason=reason,
        description=f"Status changed from {old_status} to {new_status}",
        created_by=user_id,
    )
    db.add(event)
    db.commit()
    db.refresh(employee)
    return employee


def transfer_employee(db: Session, employee_id: int, new_position_id: int, reason: str, effective_date: date, user_id: int) -> Employee:
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise ValueError("Employee not found")

    new_position = db.query(Position).filter(Position.id == new_position_id, Position.is_active == True).first()
    if not new_position:
        raise ValueError("Target position not found or inactive")

    old_position_id = employee.position_id
    employee.position_id = new_position_id

    event = EmploymentEvent(
        employee_id=employee_id,
        event_type=EventType.TRANSFER,
        effective_date=effective_date,
        old_position_id=old_position_id,
        new_position_id=new_position_id,
        reason=reason,
        description=f"Transferred to {new_position.title}",
        created_by=user_id,
    )
    db.add(event)
    db.commit()
    db.refresh(employee)
    return employee


def promote_employee(db: Session, employee_id: int, new_position_id: int, new_salary: float | None, reason: str, effective_date: date, user_id: int) -> Employee:
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise ValueError("Employee not found")

    new_position = db.query(Position).filter(Position.id == new_position_id, Position.is_active == True).first()
    if not new_position:
        raise ValueError("Target position not found or inactive")

    old_position_id = employee.position_id
    employee.position_id = new_position_id

    if new_salary:
        package = CompensationPackage(
            employee_id=employee_id,
            name=f"Promotion - {new_position.title}",
            effective_date=effective_date,
        )
        db.add(package)
        db.flush()
        salary = RecurringPayment(
            package_id=package.id,
            type=RecurringPaymentType.SALARY,
            amount=new_salary,
            currency="USD",
            frequency="MONTHLY",
        )
        db.add(salary)

    event = EmploymentEvent(
        employee_id=employee_id,
        event_type=EventType.PROMOTE,
        effective_date=effective_date,
        old_position_id=old_position_id,
        new_position_id=new_position_id,
        new_salary=str(new_salary) if new_salary else None,
        reason=reason,
        description=f"Promoted to {new_position.title}",
        created_by=user_id,
    )
    db.add(event)
    db.commit()
    db.refresh(employee)
    return employee


def get_employee_history(db: Session, employee_id: int) -> list[EmploymentEvent]:
    return db.query(EmploymentEvent).filter(
        EmploymentEvent.employee_id == employee_id
    ).order_by(EmploymentEvent.effective_date.desc()).all()

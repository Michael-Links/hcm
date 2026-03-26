from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.models.user import User, Role
from app.models.contacts import EmergencyContact, Dependent
from app.schemas.contacts import (
    EmergencyContactCreate,
    EmergencyContactOut,
    DependentCreate,
    DependentOut,
)

router = APIRouter(tags=["contacts"])


# --------------- helpers ---------------

def _require_employee(user: User) -> int:
    if not user.employee_id:
        raise HTTPException(status_code=404, detail="No employee profile linked")
    return user.employee_id


def _own_contact(db: Session, contact_id: int, employee_id: int) -> EmergencyContact:
    contact = db.query(EmergencyContact).filter(EmergencyContact.id == contact_id).first()
    if not contact or contact.employee_id != employee_id:
        raise HTTPException(status_code=404, detail="Emergency contact not found")
    return contact


def _own_dependent(db: Session, dependent_id: int, employee_id: int) -> Dependent:
    dep = db.query(Dependent).filter(Dependent.id == dependent_id).first()
    if not dep or dep.employee_id != employee_id:
        raise HTTPException(status_code=404, detail="Dependent not found")
    return dep


# ======== Self-service: Emergency Contacts ========

@router.get("/api/me/emergency-contacts", response_model=list[EmergencyContactOut])
def list_my_contacts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    emp_id = _require_employee(current_user)
    return db.query(EmergencyContact).filter(EmergencyContact.employee_id == emp_id).all()


@router.post("/api/me/emergency-contacts", response_model=EmergencyContactOut, status_code=201)
def create_my_contact(
    data: EmergencyContactCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    emp_id = _require_employee(current_user)
    contact = EmergencyContact(employee_id=emp_id, **data.model_dump())
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact


@router.put("/api/me/emergency-contacts/{contact_id}", response_model=EmergencyContactOut)
def update_my_contact(
    contact_id: int,
    data: EmergencyContactCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    emp_id = _require_employee(current_user)
    contact = _own_contact(db, contact_id, emp_id)
    for field, value in data.model_dump().items():
        setattr(contact, field, value)
    db.commit()
    db.refresh(contact)
    return contact


@router.delete("/api/me/emergency-contacts/{contact_id}", status_code=204)
def delete_my_contact(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    emp_id = _require_employee(current_user)
    contact = _own_contact(db, contact_id, emp_id)
    db.delete(contact)
    db.commit()


# ======== Self-service: Dependents ========

@router.get("/api/me/dependents", response_model=list[DependentOut])
def list_my_dependents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    emp_id = _require_employee(current_user)
    return db.query(Dependent).filter(Dependent.employee_id == emp_id).all()


@router.post("/api/me/dependents", response_model=DependentOut, status_code=201)
def create_my_dependent(
    data: DependentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    emp_id = _require_employee(current_user)
    dep = Dependent(employee_id=emp_id, **data.model_dump())
    db.add(dep)
    db.commit()
    db.refresh(dep)
    return dep


@router.put("/api/me/dependents/{dependent_id}", response_model=DependentOut)
def update_my_dependent(
    dependent_id: int,
    data: DependentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    emp_id = _require_employee(current_user)
    dep = _own_dependent(db, dependent_id, emp_id)
    for field, value in data.model_dump().items():
        setattr(dep, field, value)
    db.commit()
    db.refresh(dep)
    return dep


@router.delete("/api/me/dependents/{dependent_id}", status_code=204)
def delete_my_dependent(
    dependent_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    emp_id = _require_employee(current_user)
    dep = _own_dependent(db, dependent_id, emp_id)
    db.delete(dep)
    db.commit()


# ======== HR endpoints ========

@router.get(
    "/api/employees/{employee_id}/emergency-contacts",
    response_model=list[EmergencyContactOut],
)
def hr_list_contacts(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(Role.HR)),
):
    return db.query(EmergencyContact).filter(EmergencyContact.employee_id == employee_id).all()


@router.get(
    "/api/employees/{employee_id}/dependents",
    response_model=list[DependentOut],
)
def hr_list_dependents(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(Role.HR)),
):
    return db.query(Dependent).filter(Dependent.employee_id == employee_id).all()

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_role
from app.models.user import User, Role
from app.models.compensation import CompensationPackage, RecurringPayment, OneTimePayment
from app.schemas.compensation import (
    CompensationPackageCreate, CompensationPackageOut, CompensationPackageUpdate,
    RecurringPaymentCreate, RecurringPaymentOut, RecurringPaymentUpdate,
    OneTimePaymentCreate, OneTimePaymentOut, OneTimePaymentUpdate,
)
from app.services.compensation_service import get_employee_compensation, create_compensation_package, delete_compensation_package

router = APIRouter(prefix="/api/employees", tags=["compensation"])

@router.get("/{employee_id}/compensation", response_model=list[CompensationPackageOut])
def get_compensation(employee_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role(Role.HR, Role.MANAGER))):
    return get_employee_compensation(db, employee_id)

@router.post("/{employee_id}/compensation", response_model=CompensationPackageOut, status_code=201)
def add_compensation(employee_id: int, data: CompensationPackageCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role(Role.HR))):
    return create_compensation_package(db, employee_id, data)

@router.delete("/{employee_id}/compensation/{package_id}", status_code=204)
def remove_compensation(employee_id: int, package_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role(Role.HR))):
    if not delete_compensation_package(db, package_id):
        raise HTTPException(404, "Package not found")


def _get_package(db: Session, package_id: int, employee_id: int) -> CompensationPackage:
    pkg = db.query(CompensationPackage).filter(
        CompensationPackage.id == package_id,
        CompensationPackage.employee_id == employee_id,
    ).first()
    if not pkg:
        raise HTTPException(404, "Package not found")
    return pkg


@router.put("/{employee_id}/compensation/{package_id}", response_model=CompensationPackageOut)
def update_package(employee_id: int, package_id: int, data: CompensationPackageUpdate,
                   db: Session = Depends(get_db), current_user: User = Depends(require_role(Role.HR))):
    pkg = _get_package(db, package_id, employee_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(pkg, field, value)
    db.commit()
    db.refresh(pkg)
    return pkg


# --- Recurring payments ---
@router.post("/{employee_id}/compensation/{package_id}/recurring", response_model=RecurringPaymentOut, status_code=201)
def add_recurring(employee_id: int, package_id: int, data: RecurringPaymentCreate,
                  db: Session = Depends(get_db), current_user: User = Depends(require_role(Role.HR))):
    _get_package(db, package_id, employee_id)
    payment = RecurringPayment(package_id=package_id, **data.model_dump())
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


@router.put("/{employee_id}/compensation/{package_id}/recurring/{payment_id}", response_model=RecurringPaymentOut)
def update_recurring(employee_id: int, package_id: int, payment_id: int, data: RecurringPaymentUpdate,
                     db: Session = Depends(get_db), current_user: User = Depends(require_role(Role.HR))):
    _get_package(db, package_id, employee_id)
    payment = db.query(RecurringPayment).filter(RecurringPayment.id == payment_id, RecurringPayment.package_id == package_id).first()
    if not payment:
        raise HTTPException(404, "Payment not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(payment, field, value)
    db.commit()
    db.refresh(payment)
    return payment


@router.delete("/{employee_id}/compensation/{package_id}/recurring/{payment_id}", status_code=204)
def delete_recurring(employee_id: int, package_id: int, payment_id: int,
                     db: Session = Depends(get_db), current_user: User = Depends(require_role(Role.HR))):
    _get_package(db, package_id, employee_id)
    payment = db.query(RecurringPayment).filter(RecurringPayment.id == payment_id, RecurringPayment.package_id == package_id).first()
    if not payment:
        raise HTTPException(404, "Payment not found")
    db.delete(payment)
    db.commit()


# --- One-time payments ---
@router.post("/{employee_id}/compensation/{package_id}/onetime", response_model=OneTimePaymentOut, status_code=201)
def add_onetime(employee_id: int, package_id: int, data: OneTimePaymentCreate,
                db: Session = Depends(get_db), current_user: User = Depends(require_role(Role.HR))):
    _get_package(db, package_id, employee_id)
    payment = OneTimePayment(package_id=package_id, **data.model_dump())
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


@router.put("/{employee_id}/compensation/{package_id}/onetime/{payment_id}", response_model=OneTimePaymentOut)
def update_onetime(employee_id: int, package_id: int, payment_id: int, data: OneTimePaymentUpdate,
                   db: Session = Depends(get_db), current_user: User = Depends(require_role(Role.HR))):
    _get_package(db, package_id, employee_id)
    payment = db.query(OneTimePayment).filter(OneTimePayment.id == payment_id, OneTimePayment.package_id == package_id).first()
    if not payment:
        raise HTTPException(404, "Payment not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(payment, field, value)
    db.commit()
    db.refresh(payment)
    return payment


@router.delete("/{employee_id}/compensation/{package_id}/onetime/{payment_id}", status_code=204)
def delete_onetime(employee_id: int, package_id: int, payment_id: int,
                   db: Session = Depends(get_db), current_user: User = Depends(require_role(Role.HR))):
    _get_package(db, package_id, employee_id)
    payment = db.query(OneTimePayment).filter(OneTimePayment.id == payment_id, OneTimePayment.package_id == package_id).first()
    if not payment:
        raise HTTPException(404, "Payment not found")
    db.delete(payment)
    db.commit()

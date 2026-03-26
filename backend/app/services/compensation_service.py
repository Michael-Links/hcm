from sqlalchemy.orm import Session, joinedload
from app.models.compensation import CompensationPackage, RecurringPayment, OneTimePayment
from app.schemas.compensation import CompensationPackageCreate

def get_employee_compensation(db: Session, employee_id: int) -> list[CompensationPackage]:
    return db.query(CompensationPackage).options(
        joinedload(CompensationPackage.recurring_payments),
        joinedload(CompensationPackage.one_time_payments),
    ).filter(CompensationPackage.employee_id == employee_id).all()

def delete_compensation_package(db: Session, package_id: int) -> bool:
    package = db.query(CompensationPackage).filter(CompensationPackage.id == package_id).first()
    if not package:
        return False
    db.delete(package)
    db.commit()
    return True

def create_compensation_package(db: Session, employee_id: int, data: CompensationPackageCreate) -> CompensationPackage:
    package = CompensationPackage(
        employee_id=employee_id,
        name=data.name,
        effective_date=data.effective_date,
    )
    db.add(package)
    db.flush()

    for rp in data.recurring_payments:
        payment = RecurringPayment(
            package_id=package.id,
            type=rp.type,
            amount=rp.amount,
            currency=rp.currency,
            frequency=rp.frequency,
        )
        db.add(payment)

    for otp in data.one_time_payments:
        payment = OneTimePayment(
            package_id=package.id,
            type=otp.type,
            amount=otp.amount,
            currency=otp.currency,
            payment_date=otp.payment_date,
        )
        db.add(payment)

    db.commit()
    db.refresh(package)
    return package

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import csv, io
from app.database import get_db
from app.dependencies import require_role
from app.models.user import User, Role
from app.models.employee import Employee, PersonalInfo
from app.models.organization import Position

router = APIRouter(prefix="/api/employees", tags=["bulk"])

@router.get("/export")
def export_employees(db: Session = Depends(get_db), current_user: User = Depends(require_role(Role.HR))):
    employees = db.query(Employee).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["employee_number", "first_name", "last_name", "email", "phone", "position", "department", "hire_date", "status"])
    for emp in employees:
        pi = emp.personal_info
        writer.writerow([
            emp.employee_number,
            pi.first_name if pi else "", pi.last_name if pi else "",
            pi.email if pi else "", pi.phone if pi else "",
            emp.position.title if emp.position else "",
            emp.position.department.name if emp.position and emp.position.department else "",
            str(emp.hire_date), emp.status.value if hasattr(emp.status, 'value') else str(emp.status),
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=employees.csv"}
    )

@router.post("/import")
def import_employees(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(require_role(Role.HR))):
    """Import employees from CSV. Expected columns: first_name, last_name, email, position_code, hire_date"""
    content = file.file.read().decode("utf-8")
    reader = csv.DictReader(io.StringIO(content))
    results = {"created": 0, "errors": []}
    for i, row in enumerate(reader, start=2):
        try:
            position = db.query(Position).filter(Position.code == row.get("position_code", "")).first()
            if not position:
                results["errors"].append(f"Row {i}: Position code '{row.get('position_code')}' not found")
                continue
            from app.services.employee_service import _generate_employee_number
            from datetime import date
            emp = Employee(
                employee_number=_generate_employee_number(db),
                position_id=position.id,
                hire_date=date.fromisoformat(row.get("hire_date", str(date.today()))),
                status="ACTIVE",
            )
            db.add(emp)
            db.flush()
            pi = PersonalInfo(
                employee_id=emp.id,
                first_name=row.get("first_name", ""),
                last_name=row.get("last_name", ""),
                email=row.get("email"),
            )
            db.add(pi)
            results["created"] += 1
        except Exception as e:
            results["errors"].append(f"Row {i}: {str(e)}")
    db.commit()
    return results

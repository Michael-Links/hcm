"""Seed script: creates default HR user and sample org hierarchy."""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import engine, SessionLocal, Base, ensure_user_language_preference_column
from app.models.user import User, Role
from app.models.organization import OrgGroup, Entity, Division, Department, Position
from app.models.employee import Employee, PersonalInfo
from app.models.compensation import CompensationPackage
from app.models.employment_event import EmploymentEvent  # noqa: F401
from app.models.contacts import EmergencyContact, Dependent  # noqa: F401
from app.models.notification import Notification  # noqa: F401
from app.models.audit import AuditLog  # noqa: F401
from app.models.document import Document  # noqa: F401
from app.models.leave import LeaveType, LeaveBalance, LeaveRequest  # noqa: F401
from app.services.auth_service import hash_password
from datetime import date

def seed():
    Base.metadata.create_all(bind=engine)
    ensure_user_language_preference_column()
    db = SessionLocal()
    try:
        # Only seed if no users exist
        if db.query(User).first():
            print("Database already seeded.")
            return

        # Create org hierarchy
        group = OrgGroup(name="Acme Corporation", code="ACME")
        db.add(group)
        db.flush()

        entity = Entity(name="Acme US", code="ACME-US", group_id=group.id)
        db.add(entity)
        db.flush()

        division = Division(name="Operations", code="OPS", entity_id=entity.id)
        db.add(division)
        db.flush()

        hr_dept = Department(name="Human Resources", code="HR", division_id=division.id)
        eng_dept = Department(name="Engineering", code="ENG", division_id=division.id)
        db.add_all([hr_dept, eng_dept])
        db.flush()

        hr_mgr_pos = Position(title="HR Manager", code="HR-MGR", department_id=hr_dept.id)
        db.add(hr_mgr_pos)
        db.flush()

        eng_mgr_pos = Position(title="Engineering Manager", code="ENG-MGR", department_id=eng_dept.id)
        db.add(eng_mgr_pos)
        db.flush()

        dev_pos = Position(title="Software Developer", code="ENG-DEV", department_id=eng_dept.id, reports_to_id=eng_mgr_pos.id)
        db.add(dev_pos)
        db.flush()

        # Create HR admin user (no employee profile needed for HR admin)
        hr_user = User(email="hr@ecm.com", password_hash=hash_password("admin123"), role=Role.HR)
        db.add(hr_user)

        # Create a manager user with employee profile
        mgr_employee = Employee(employee_number="EMP-000001", position_id=eng_mgr_pos.id, hire_date=date(2024, 1, 15), status="ACTIVE")
        db.add(mgr_employee)
        db.flush()

        mgr_info = PersonalInfo(employee_id=mgr_employee.id, first_name="Jane", last_name="Smith", email="jane.smith@ecm.com", gender="Female")
        db.add(mgr_info)

        mgr_user = User(email="manager@ecm.com", password_hash=hash_password("admin123"), role=Role.MANAGER, employee_id=mgr_employee.id)
        db.add(mgr_user)

        # Create an employee user
        emp_employee = Employee(employee_number="EMP-000002", position_id=dev_pos.id, hire_date=date(2024, 3, 1), status="ACTIVE")
        db.add(emp_employee)
        db.flush()

        emp_info = PersonalInfo(employee_id=emp_employee.id, first_name="John", last_name="Doe", email="john.doe@ecm.com", gender="Male", city="New York", country="US")
        db.add(emp_info)

        emp_user = User(email="employee@ecm.com", password_hash=hash_password("admin123"), role=Role.EMPLOYEE, employee_id=emp_employee.id)
        db.add(emp_user)

        # Leave types
        leave_types = [
            LeaveType(name="Annual Leave", code="AL", default_balance=20, is_paid=True, requires_approval=True, max_consecutive_days=15),
            LeaveType(name="Sick Leave", code="SL", default_balance=10, is_paid=True, requires_approval=True),
            LeaveType(name="Personal Leave", code="PL", default_balance=5, is_paid=True, requires_approval=True, max_consecutive_days=3),
            LeaveType(name="Unpaid Leave", code="UL", default_balance=30, is_paid=False, requires_approval=True),
        ]
        db.add_all(leave_types)

        db.commit()
        print("Database seeded successfully.")
    finally:
        db.close()

if __name__ == "__main__":
    seed()

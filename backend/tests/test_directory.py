from datetime import date
from app.services.auth_service import create_access_token
from app.models.employee import Employee, PersonalInfo
from app.models.user import User, Role
from app.services.auth_service import hash_password


def test_directory_lists_active_employees(client, db_session, sample_org):
    emp = Employee(employee_number="EMP-DIR-001", position_id=sample_org["position"].id, hire_date=date(2024, 1, 1), status="ACTIVE")
    db_session.add(emp)
    db_session.flush()
    pi = PersonalInfo(employee_id=emp.id, first_name="Alice", last_name="Smith", email="alice@test.com", phone="555-0001")
    db_session.add(pi)
    user = User(email="dir@test.com", password_hash=hash_password("password"), role=Role.EMPLOYEE, employee_id=emp.id)
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    token = create_access_token(user)
    resp = client.get("/api/directory", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 1
    alice = [d for d in data if d["first_name"] == "Alice"]
    assert len(alice) == 1
    assert alice[0]["last_name"] == "Smith"


def test_directory_search(client, db_session, sample_org):
    emp1 = Employee(employee_number="EMP-DIR-002", position_id=sample_org["position"].id, hire_date=date(2024, 1, 1), status="ACTIVE")
    db_session.add(emp1)
    db_session.flush()
    pi1 = PersonalInfo(employee_id=emp1.id, first_name="Bob", last_name="Jones")
    db_session.add(pi1)

    emp2 = Employee(employee_number="EMP-DIR-003", position_id=sample_org["position"].id, hire_date=date(2024, 2, 1), status="ACTIVE")
    db_session.add(emp2)
    db_session.flush()
    pi2 = PersonalInfo(employee_id=emp2.id, first_name="Charlie", last_name="Brown")
    db_session.add(pi2)

    user = User(email="search@test.com", password_hash=hash_password("password"), role=Role.EMPLOYEE, employee_id=emp1.id)
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    token = create_access_token(user)
    resp = client.get("/api/directory?search=Bob", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert all(d["first_name"] == "Bob" or "Bob" in d["last_name"] for d in data)

from datetime import date
from app.services.auth_service import create_access_token
from app.models.employee import Employee, PersonalInfo
from app.models.document import Document
from app.models.user import User, Role
from app.services.auth_service import hash_password


def test_upload_document(client, db_session, sample_org, hr_user, hr_token):
    emp = Employee(employee_number="EMP-DOC-001", position_id=sample_org["position"].id, hire_date=date(2024, 1, 1), status="ACTIVE")
    db_session.add(emp)
    db_session.flush()
    pi = PersonalInfo(employee_id=emp.id, first_name="Doc", last_name="Test")
    db_session.add(pi)
    db_session.commit()

    resp = client.post(
        f"/api/employees/{emp.id}/documents",
        json={"name": "passport.pdf", "doc_type": "ID", "file_path": "/uploads/passport.pdf"},
        headers={"Authorization": f"Bearer {hr_token}"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "passport.pdf"
    assert data["doc_type"] == "ID"
    assert data["employee_id"] == emp.id


def test_list_and_delete_document(client, db_session, sample_org, hr_user, hr_token):
    emp = Employee(employee_number="EMP-DOC-002", position_id=sample_org["position"].id, hire_date=date(2024, 1, 1), status="ACTIVE")
    db_session.add(emp)
    db_session.flush()
    pi = PersonalInfo(employee_id=emp.id, first_name="List", last_name="Test")
    db_session.add(pi)
    db_session.commit()

    client.post(
        f"/api/employees/{emp.id}/documents",
        json={"name": "contract.pdf", "doc_type": "CONTRACT"},
        headers={"Authorization": f"Bearer {hr_token}"},
    )

    resp = client.get(f"/api/employees/{emp.id}/documents", headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 200
    assert len(resp.json()) == 1
    doc_id = resp.json()[0]["id"]

    resp = client.delete(f"/api/documents/{doc_id}", headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 204

    resp = client.get(f"/api/employees/{emp.id}/documents", headers={"Authorization": f"Bearer {hr_token}"})
    assert len(resp.json()) == 0


def test_my_documents(client, db_session, sample_org):
    emp = Employee(employee_number="EMP-DOC-003", position_id=sample_org["position"].id, hire_date=date(2024, 1, 1), status="ACTIVE")
    db_session.add(emp)
    db_session.flush()
    pi = PersonalInfo(employee_id=emp.id, first_name="My", last_name="Docs")
    db_session.add(pi)
    emp_user = User(email="mydocs@test.com", password_hash=hash_password("password"), role=Role.EMPLOYEE, employee_id=emp.id)
    db_session.add(emp_user)
    db_session.commit()
    db_session.refresh(emp_user)

    doc = Document(employee_id=emp.id, name="cert.pdf", doc_type="CERTIFICATE", file_path="/uploads/cert.pdf")
    db_session.add(doc)
    db_session.commit()

    token = create_access_token(emp_user)
    resp = client.get("/api/me/documents", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert len(resp.json()) == 1
    assert resp.json()[0]["name"] == "cert.pdf"

from app.services.auth_service import create_access_token
from datetime import date
from app.models.compensation import CompensationPackage, RecurringPayment, RecurringPaymentType

def test_my_profile(client, manager_with_report):
    token = create_access_token(manager_with_report["emp_user"])
    resp = client.get("/api/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["personal_info"]["first_name"] == "Report"

def test_update_my_profile(client, manager_with_report):
    token = create_access_token(manager_with_report["emp_user"])
    resp = client.patch("/api/me", json={"city": "Boston", "phone": "555-1234"}, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["personal_info"]["city"] == "Boston"

def test_my_team(client, manager_with_report):
    token = create_access_token(manager_with_report["mgr_user"])
    resp = client.get("/api/me/team", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert len(resp.json()) == 1
    assert resp.json()[0]["first_name"] == "Report"

def test_employee_cannot_see_team(client, manager_with_report):
    token = create_access_token(manager_with_report["emp_user"])
    resp = client.get("/api/me/team", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 403

def test_update_email_and_address_line2(client, manager_with_report):
    token = create_access_token(manager_with_report["emp_user"])
    resp = client.patch(
        "/api/me",
        json={"email": "new@example.com", "address_line2": "Suite 200"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    pi = resp.json()["personal_info"]
    assert pi["email"] == "new@example.com"
    assert pi["address_line2"] == "Suite 200"

def test_no_profile_linked(client, hr_user, hr_token):
    resp = client.get("/api/me", headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 404


def test_my_compensation(client, db_session, manager_with_report):
    emp = manager_with_report["report_emp"]
    pkg = CompensationPackage(employee_id=emp.id, name="Salary 2024", effective_date=date(2024, 1, 1))
    db_session.add(pkg)
    db_session.flush()
    payment = RecurringPayment(package_id=pkg.id, type=RecurringPaymentType.SALARY, amount=5000.0, currency="USD", frequency="MONTHLY")
    db_session.add(payment)
    db_session.commit()

    token = create_access_token(manager_with_report["emp_user"])
    resp = client.get("/api/me/compensation", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["name"] == "Salary 2024"
    assert len(data[0]["recurring_payments"]) == 1


def test_get_my_preferences(client, manager_with_report):
    token = create_access_token(manager_with_report["emp_user"])
    resp = client.get("/api/me/preferences", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["language_preference"] == "en"


def test_update_my_preferences(client, db_session, manager_with_report):
    token = create_access_token(manager_with_report["emp_user"])
    resp = client.patch(
        "/api/me/preferences",
        json={"language_preference": "zh-HK"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["language_preference"] == "zh-HK"

    db_session.refresh(manager_with_report["emp_user"])
    assert manager_with_report["emp_user"].language_preference == "zh-HK"

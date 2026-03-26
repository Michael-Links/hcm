import pytest
from app.services.auth_service import create_access_token
from app.models.leave import LeaveType

@pytest.fixture
def leave_types(db_session):
    lt1 = LeaveType(name="Annual", code="AL", default_balance=20)
    lt2 = LeaveType(name="Sick", code="SL", default_balance=10)
    db_session.add_all([lt1, lt2])
    db_session.commit()
    return [lt1, lt2]

def test_create_leave_type(client, hr_token):
    resp = client.post("/api/leave-types", json={"name": "Test Leave", "code": "TL", "default_balance": 15},
        headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 201
    assert resp.json()["name"] == "Test Leave"

def test_list_leave_types(client, hr_token, leave_types):
    resp = client.get("/api/leave-types", headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 200
    assert len(resp.json()) >= 2

def test_get_balances(client, manager_with_report, leave_types):
    token = create_access_token(manager_with_report["emp_user"])
    resp = client.get("/api/me/leave-balances", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert len(resp.json()) == 2
    assert all(b["entitled"] > 0 for b in resp.json())

def test_submit_leave_request(client, manager_with_report, leave_types):
    token = create_access_token(manager_with_report["emp_user"])
    resp = client.post("/api/me/leave-requests", json={
        "leave_type_id": leave_types[0].id, "start_date": "2025-07-01", "end_date": "2025-07-03", "reason": "Vacation"
    }, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 201
    assert resp.json()["days"] == 3.0
    assert resp.json()["status"] == "PENDING"

def test_overlapping_request_rejected(client, manager_with_report, leave_types):
    token = create_access_token(manager_with_report["emp_user"])
    client.post("/api/me/leave-requests", json={
        "leave_type_id": leave_types[0].id, "start_date": "2025-08-01", "end_date": "2025-08-05"
    }, headers={"Authorization": f"Bearer {token}"})
    resp = client.post("/api/me/leave-requests", json={
        "leave_type_id": leave_types[0].id, "start_date": "2025-08-03", "end_date": "2025-08-07"
    }, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 400

def test_cancel_request(client, manager_with_report, leave_types):
    token = create_access_token(manager_with_report["emp_user"])
    req = client.post("/api/me/leave-requests", json={
        "leave_type_id": leave_types[0].id, "start_date": "2025-09-01", "end_date": "2025-09-02"
    }, headers={"Authorization": f"Bearer {token}"}).json()
    resp = client.post(f"/api/me/leave-requests/{req['id']}/cancel", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "CANCELLED"

def test_manager_approve_request(client, manager_with_report, leave_types):
    emp_token = create_access_token(manager_with_report["emp_user"])
    mgr_token = create_access_token(manager_with_report["mgr_user"])
    req = client.post("/api/me/leave-requests", json={
        "leave_type_id": leave_types[0].id, "start_date": "2025-10-01", "end_date": "2025-10-03"
    }, headers={"Authorization": f"Bearer {emp_token}"}).json()
    resp = client.patch(f"/api/me/team/leave-requests/{req['id']}", json={"status": "APPROVED"},
        headers={"Authorization": f"Bearer {mgr_token}"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "APPROVED"

def test_manager_reject_request(client, manager_with_report, leave_types):
    emp_token = create_access_token(manager_with_report["emp_user"])
    mgr_token = create_access_token(manager_with_report["mgr_user"])
    req = client.post("/api/me/leave-requests", json={
        "leave_type_id": leave_types[0].id, "start_date": "2025-11-03", "end_date": "2025-11-04"
    }, headers={"Authorization": f"Bearer {emp_token}"}).json()
    resp = client.patch(f"/api/me/team/leave-requests/{req['id']}", json={"status": "REJECTED"},
        headers={"Authorization": f"Bearer {mgr_token}"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "REJECTED"

def test_insufficient_balance(client, manager_with_report, leave_types):
    token = create_access_token(manager_with_report["emp_user"])
    # Try to request more days than available (>20 days of annual)
    resp = client.post("/api/me/leave-requests", json={
        "leave_type_id": leave_types[0].id, "start_date": "2025-01-01", "end_date": "2025-02-15"
    }, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 400
    assert "balance" in resp.json()["detail"].lower()

def test_hr_view_all_requests(client, hr_token, manager_with_report, leave_types):
    emp_token = create_access_token(manager_with_report["emp_user"])
    client.post("/api/me/leave-requests", json={
        "leave_type_id": leave_types[0].id, "start_date": "2025-12-01", "end_date": "2025-12-02"
    }, headers={"Authorization": f"Bearer {emp_token}"})
    resp = client.get("/api/leave-requests", headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 200
    assert len(resp.json()) >= 1


def test_update_leave_type(client, hr_token, leave_types):
    lt = leave_types[0]
    resp = client.put(f"/api/leave-types/{lt.id}",
        json={"name": "Updated Annual", "default_balance": 25},
        headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 200
    assert resp.json()["name"] == "Updated Annual"
    assert resp.json()["default_balance"] == 25


def test_delete_leave_type_unused(client, hr_token, db_session):
    from app.models.leave import LeaveType
    lt = LeaveType(name="Temp", code="TMP", default_balance=5)
    db_session.add(lt)
    db_session.commit()
    db_session.refresh(lt)
    resp = client.delete(f"/api/leave-types/{lt.id}", headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 204


def test_delete_leave_type_in_use(client, hr_token, manager_with_report, leave_types):
    emp_token = create_access_token(manager_with_report["emp_user"])
    # Submit a request so the leave type is in use
    client.post("/api/me/leave-requests", json={
        "leave_type_id": leave_types[0].id, "start_date": "2025-06-01", "end_date": "2025-06-02"
    }, headers={"Authorization": f"Bearer {emp_token}"})
    resp = client.delete(f"/api/leave-types/{leave_types[0].id}", headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 400
    assert "in use" in resp.json()["detail"]


def test_adjust_leave_balance(client, hr_token, manager_with_report, leave_types):
    emp = manager_with_report["report_emp"]
    resp = client.post(f"/api/employees/{emp.id}/leave-balances/adjust",
        json={"leave_type_id": leave_types[0].id, "adjustment": 5.0, "reason": "Carry over"},
        headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 200
    assert resp.json()["entitled"] == 25.0  # default 20 + 5


def test_adjust_leave_balance_negative(client, hr_token, manager_with_report, leave_types):
    emp = manager_with_report["report_emp"]
    # First get the balances to initialize
    client.get(f"/api/employees/{emp.id}/leave-balances", headers={"Authorization": f"Bearer {hr_token}"})
    resp = client.post(f"/api/employees/{emp.id}/leave-balances/adjust",
        json={"leave_type_id": leave_types[0].id, "adjustment": -3.0, "reason": "Correction"},
        headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 200
    assert resp.json()["entitled"] == 17.0  # default 20 - 3

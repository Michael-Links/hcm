from app.services.auth_service import create_access_token


def test_terminate_employee(client, hr_token, sample_org):
    data = {"position_id": sample_org["position"].id, "hire_date": "2024-06-01", "personal_info": {"first_name": "Term", "last_name": "Test"}}
    emp = client.post("/api/employees/onboard", json=data, headers={"Authorization": f"Bearer {hr_token}"}).json()

    resp = client.post(f"/api/employees/{emp['id']}/status-change",
        json={"new_status": "TERMINATED", "reason": "End of contract", "effective_date": "2024-12-31"},
        headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "TERMINATED"


def test_invalid_status_transition(client, hr_token, sample_org):
    data = {"position_id": sample_org["position"].id, "hire_date": "2024-06-01", "personal_info": {"first_name": "Bad", "last_name": "Trans"}}
    emp = client.post("/api/employees/onboard", json=data, headers={"Authorization": f"Bearer {hr_token}"}).json()

    # Terminate first
    client.post(f"/api/employees/{emp['id']}/status-change",
        json={"new_status": "TERMINATED", "reason": "Done", "effective_date": "2024-12-31"},
        headers={"Authorization": f"Bearer {hr_token}"})

    # Try to activate terminated employee
    resp = client.post(f"/api/employees/{emp['id']}/status-change",
        json={"new_status": "ACTIVE", "reason": "Rehire", "effective_date": "2025-01-01"},
        headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 400


def test_transfer_employee(client, hr_token, sample_org):
    data = {"position_id": sample_org["position"].id, "hire_date": "2024-06-01", "personal_info": {"first_name": "Trans", "last_name": "Fer"}}
    emp = client.post("/api/employees/onboard", json=data, headers={"Authorization": f"Bearer {hr_token}"}).json()

    resp = client.post(f"/api/employees/{emp['id']}/transfer",
        json={"new_position_id": sample_org["mgr_position"].id, "reason": "Department change", "effective_date": "2025-01-01"},
        headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 200
    assert resp.json()["position_id"] == sample_org["mgr_position"].id


def test_promote_employee_with_salary(client, hr_token, sample_org):
    data = {"position_id": sample_org["dev_position"].id, "hire_date": "2024-06-01", "personal_info": {"first_name": "Promo", "last_name": "Tion"}}
    emp = client.post("/api/employees/onboard", json=data, headers={"Authorization": f"Bearer {hr_token}"}).json()

    resp = client.post(f"/api/employees/{emp['id']}/promote",
        json={"new_position_id": sample_org["mgr_position"].id, "new_salary": 120000, "reason": "Outstanding performance", "effective_date": "2025-01-01"},
        headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 200
    assert resp.json()["position_id"] == sample_org["mgr_position"].id


def test_employment_history(client, hr_token, sample_org):
    data = {"position_id": sample_org["position"].id, "hire_date": "2024-06-01", "personal_info": {"first_name": "Hist", "last_name": "Test"}}
    emp = client.post("/api/employees/onboard", json=data, headers={"Authorization": f"Bearer {hr_token}"}).json()

    # Make some changes
    client.post(f"/api/employees/{emp['id']}/transfer",
        json={"new_position_id": sample_org["mgr_position"].id, "reason": "Transfer", "effective_date": "2025-01-01"},
        headers={"Authorization": f"Bearer {hr_token}"})
    client.post(f"/api/employees/{emp['id']}/status-change",
        json={"new_status": "INACTIVE", "reason": "Leave", "effective_date": "2025-06-01"},
        headers={"Authorization": f"Bearer {hr_token}"})

    resp = client.get(f"/api/employees/{emp['id']}/history", headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 200
    assert len(resp.json()) == 2


def test_transfer_to_inactive_position_fails(client, hr_token, sample_org, db_session):
    from app.models.organization import Position
    # Deactivate the target position
    pos = db_session.query(Position).filter(Position.id == sample_org["mgr_position"].id).first()
    pos.is_active = False
    db_session.commit()

    data = {"position_id": sample_org["position"].id, "hire_date": "2024-06-01", "personal_info": {"first_name": "Fail", "last_name": "Trans"}}
    emp = client.post("/api/employees/onboard", json=data, headers={"Authorization": f"Bearer {hr_token}"}).json()

    resp = client.post(f"/api/employees/{emp['id']}/transfer",
        json={"new_position_id": sample_org["mgr_position"].id, "reason": "Bad", "effective_date": "2025-01-01"},
        headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 400

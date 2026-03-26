def test_create_and_get_compensation(client, hr_token, sample_org):
    # Onboard first
    onboard = {
        "position_id": sample_org["position"].id,
        "hire_date": "2024-06-01",
        "personal_info": {"first_name": "Comp", "last_name": "Test"}
    }
    emp = client.post("/api/employees/onboard", json=onboard, headers={"Authorization": f"Bearer {hr_token}"}).json()

    # Add compensation
    comp = {
        "name": "Annual Review",
        "effective_date": "2024-07-01",
        "recurring_payments": [
            {"type": "SALARY", "amount": 80000, "currency": "USD", "frequency": "MONTHLY"},
            {"type": "ALLOWANCE", "amount": 500, "currency": "USD", "frequency": "MONTHLY"}
        ],
        "one_time_payments": [
            {"type": "BONUS", "amount": 5000, "currency": "USD", "payment_date": "2024-12-01"}
        ]
    }
    resp = client.post(f"/api/employees/{emp['id']}/compensation", json=comp, headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 201
    body = resp.json()
    assert len(body["recurring_payments"]) == 2
    assert len(body["one_time_payments"]) == 1

    # Get compensation
    resp = client.get(f"/api/employees/{emp['id']}/compensation", headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 200
    assert len(resp.json()) >= 1

def test_delete_compensation_package(client, hr_token, sample_org):
    onboard = {
        "position_id": sample_org["position"].id,
        "hire_date": "2024-06-01",
        "personal_info": {"first_name": "Del", "last_name": "Comp"}
    }
    emp = client.post("/api/employees/onboard", json=onboard, headers={"Authorization": f"Bearer {hr_token}"}).json()
    comp = {
        "name": "To Delete",
        "effective_date": "2024-07-01",
        "recurring_payments": [{"type": "SALARY", "amount": 50000, "currency": "USD", "frequency": "MONTHLY"}],
        "one_time_payments": []
    }
    pkg = client.post(f"/api/employees/{emp['id']}/compensation", json=comp, headers={"Authorization": f"Bearer {hr_token}"}).json()
    resp = client.delete(f"/api/employees/{emp['id']}/compensation/{pkg['id']}", headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 204


def _create_emp_with_package(client, hr_token, sample_org):
    """Helper: onboard employee and create a compensation package, return (emp, pkg)."""
    onboard = {
        "position_id": sample_org["position"].id,
        "hire_date": "2024-06-01",
        "personal_info": {"first_name": "Crud", "last_name": "Test"},
    }
    emp = client.post("/api/employees/onboard", json=onboard, headers={"Authorization": f"Bearer {hr_token}"}).json()
    comp = {
        "name": "Base Package",
        "effective_date": "2024-07-01",
        "recurring_payments": [{"type": "SALARY", "amount": 60000, "currency": "USD", "frequency": "MONTHLY"}],
        "one_time_payments": [{"type": "BONUS", "amount": 2000, "currency": "USD", "payment_date": "2024-12-01"}],
    }
    pkg = client.post(f"/api/employees/{emp['id']}/compensation", json=comp, headers={"Authorization": f"Bearer {hr_token}"}).json()
    return emp, pkg


def test_update_compensation_package(client, hr_token, sample_org):
    emp, pkg = _create_emp_with_package(client, hr_token, sample_org)
    resp = client.put(
        f"/api/employees/{emp['id']}/compensation/{pkg['id']}",
        json={"name": "Updated Package", "effective_date": "2025-01-01"},
        headers={"Authorization": f"Bearer {hr_token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Updated Package"
    assert resp.json()["effective_date"] == "2025-01-01"


def test_add_and_update_recurring_payment(client, hr_token, sample_org):
    emp, pkg = _create_emp_with_package(client, hr_token, sample_org)
    # Add recurring
    resp = client.post(
        f"/api/employees/{emp['id']}/compensation/{pkg['id']}/recurring",
        json={"type": "ALLOWANCE", "amount": 300, "currency": "USD", "frequency": "MONTHLY"},
        headers={"Authorization": f"Bearer {hr_token}"},
    )
    assert resp.status_code == 201
    pid = resp.json()["id"]
    # Update recurring
    resp = client.put(
        f"/api/employees/{emp['id']}/compensation/{pkg['id']}/recurring/{pid}",
        json={"amount": 400},
        headers={"Authorization": f"Bearer {hr_token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["amount"] == 400


def test_delete_recurring_payment(client, hr_token, sample_org):
    emp, pkg = _create_emp_with_package(client, hr_token, sample_org)
    rp_id = pkg["recurring_payments"][0]["id"]
    resp = client.delete(
        f"/api/employees/{emp['id']}/compensation/{pkg['id']}/recurring/{rp_id}",
        headers={"Authorization": f"Bearer {hr_token}"},
    )
    assert resp.status_code == 204
    # Verify it's gone
    comp = client.get(f"/api/employees/{emp['id']}/compensation", headers={"Authorization": f"Bearer {hr_token}"}).json()
    assert len(comp[0]["recurring_payments"]) == 0


def test_add_update_delete_onetime_payment(client, hr_token, sample_org):
    emp, pkg = _create_emp_with_package(client, hr_token, sample_org)
    # Add one-time
    resp = client.post(
        f"/api/employees/{emp['id']}/compensation/{pkg['id']}/onetime",
        json={"type": "REIMBURSEMENT", "amount": 150, "currency": "USD", "payment_date": "2025-03-01"},
        headers={"Authorization": f"Bearer {hr_token}"},
    )
    assert resp.status_code == 201
    ot_id = resp.json()["id"]
    # Update
    resp = client.put(
        f"/api/employees/{emp['id']}/compensation/{pkg['id']}/onetime/{ot_id}",
        json={"amount": 250},
        headers={"Authorization": f"Bearer {hr_token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["amount"] == 250
    # Delete
    resp = client.delete(
        f"/api/employees/{emp['id']}/compensation/{pkg['id']}/onetime/{ot_id}",
        headers={"Authorization": f"Bearer {hr_token}"},
    )
    assert resp.status_code == 204

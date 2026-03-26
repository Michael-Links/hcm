from datetime import date

def test_onboard_employee(client, hr_token, sample_org):
    data = {
        "position_id": sample_org["position"].id,
        "hire_date": "2024-06-01",
        "personal_info": {
            "first_name": "Alice",
            "last_name": "Johnson",
            "email": "alice@test.com"
        },
        "compensation": {
            "package_name": "Standard",
            "salary_amount": 75000,
            "salary_currency": "USD"
        }
    }
    resp = client.post("/api/employees/onboard", json=data, headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 201
    body = resp.json()
    assert body["employee_number"].startswith("EMP-")
    assert body["personal_info"]["first_name"] == "Alice"

def test_onboard_without_position_fails(client, hr_token):
    data = {
        "position_id": 99999,
        "hire_date": "2024-06-01",
        "personal_info": {"first_name": "Bob", "last_name": "Bad"}
    }
    resp = client.post("/api/employees/onboard", json=data, headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 400

def test_list_employees(client, hr_token, sample_org):
    # Onboard first
    data = {
        "position_id": sample_org["position"].id,
        "hire_date": "2024-06-01",
        "personal_info": {"first_name": "Test", "last_name": "User"}
    }
    client.post("/api/employees/onboard", json=data, headers={"Authorization": f"Bearer {hr_token}"})
    resp = client.get("/api/employees", headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 200
    assert resp.json()["total"] >= 1
    assert len(resp.json()["items"]) >= 1

def test_list_employees_paginated(client, hr_token, sample_org):
    # Onboard a few employees
    for i in range(3):
        data = {
            "position_id": sample_org["position"].id,
            "hire_date": "2024-06-01",
            "personal_info": {"first_name": f"User{i}", "last_name": "Test"}
        }
        client.post("/api/employees/onboard", json=data, headers={"Authorization": f"Bearer {hr_token}"})

    # Test pagination
    resp = client.get("/api/employees?page=1&per_page=2", headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] >= 3
    assert len(data["items"]) == 2
    assert data["page"] == 1


def test_list_employees_search(client, hr_token, sample_org):
    data = {
        "position_id": sample_org["position"].id,
        "hire_date": "2024-06-01",
        "personal_info": {"first_name": "Searchable", "last_name": "Person"}
    }
    client.post("/api/employees/onboard", json=data, headers={"Authorization": f"Bearer {hr_token}"})

    resp = client.get("/api/employees?search=Searchable", headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 200
    assert resp.json()["total"] >= 1
    assert resp.json()["items"][0]["first_name"] == "Searchable"


def test_list_employees_filter_status(client, hr_token, sample_org):
    data = {
        "position_id": sample_org["position"].id,
        "hire_date": "2024-06-01",
        "personal_info": {"first_name": "Active", "last_name": "Employee"}
    }
    client.post("/api/employees/onboard", json=data, headers={"Authorization": f"Bearer {hr_token}"})

    resp = client.get("/api/employees?status=ACTIVE", headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 200
    assert all(e["status"] == "ACTIVE" for e in resp.json()["items"])


def test_get_employee_detail(client, hr_token, sample_org):
    data = {
        "position_id": sample_org["position"].id,
        "hire_date": "2024-06-01",
        "personal_info": {"first_name": "Detail", "last_name": "Test"}
    }
    created = client.post("/api/employees/onboard", json=data, headers={"Authorization": f"Bearer {hr_token}"}).json()
    resp = client.get(f"/api/employees/{created['id']}", headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 200
    assert resp.json()["personal_info"]["first_name"] == "Detail"

def test_update_employee(client, hr_token, sample_org):
    data = {"position_id": sample_org["position"].id, "hire_date": "2024-06-01", "personal_info": {"first_name": "Before", "last_name": "Update"}}
    emp = client.post("/api/employees/onboard", json=data, headers={"Authorization": f"Bearer {hr_token}"}).json()
    resp = client.put(f"/api/employees/{emp['id']}", json={"personal_info": {"first_name": "After", "last_name": "Update"}}, headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 200
    assert resp.json()["personal_info"]["first_name"] == "After"

from app.services.auth_service import create_access_token


def test_add_emergency_contact(client, manager_with_report):
    token = create_access_token(manager_with_report["emp_user"])
    resp = client.post(
        "/api/me/emergency-contacts",
        json={"name": "Jane Doe", "relationship": "Spouse", "phone": "555-0001"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 201
    assert resp.json()["name"] == "Jane Doe"


def test_list_emergency_contacts(client, manager_with_report):
    token = create_access_token(manager_with_report["emp_user"])
    client.post(
        "/api/me/emergency-contacts",
        json={"name": "Contact1", "relationship": "Parent", "phone": "555-0002"},
        headers={"Authorization": f"Bearer {token}"},
    )
    resp = client.get("/api/me/emergency-contacts", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert len(resp.json()) >= 1


def test_update_emergency_contact(client, manager_with_report):
    token = create_access_token(manager_with_report["emp_user"])
    created = client.post(
        "/api/me/emergency-contacts",
        json={"name": "Old Name", "relationship": "Sibling", "phone": "555-0003"},
        headers={"Authorization": f"Bearer {token}"},
    ).json()
    resp = client.put(
        f"/api/me/emergency-contacts/{created['id']}",
        json={"name": "New Name", "relationship": "Sibling", "phone": "555-0003"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "New Name"


def test_delete_emergency_contact(client, manager_with_report):
    token = create_access_token(manager_with_report["emp_user"])
    created = client.post(
        "/api/me/emergency-contacts",
        json={"name": "ToDelete", "relationship": "Friend", "phone": "555-0004"},
        headers={"Authorization": f"Bearer {token}"},
    ).json()
    resp = client.delete(
        f"/api/me/emergency-contacts/{created['id']}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 204


def test_add_dependent(client, manager_with_report):
    token = create_access_token(manager_with_report["emp_user"])
    resp = client.post(
        "/api/me/dependents",
        json={"name": "Child One", "relationship": "Child", "date_of_birth": "2020-05-15", "gender": "Female"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 201
    assert resp.json()["name"] == "Child One"


def test_list_dependents(client, manager_with_report):
    token = create_access_token(manager_with_report["emp_user"])
    client.post(
        "/api/me/dependents",
        json={"name": "Dep1", "relationship": "Child"},
        headers={"Authorization": f"Bearer {token}"},
    )
    resp = client.get("/api/me/dependents", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert len(resp.json()) >= 1


def test_hr_can_view_employee_contacts(client, hr_token, manager_with_report):
    # Add a contact as the employee
    emp_token = create_access_token(manager_with_report["emp_user"])
    client.post(
        "/api/me/emergency-contacts",
        json={"name": "HR View Test", "relationship": "Parent", "phone": "555-9999"},
        headers={"Authorization": f"Bearer {emp_token}"},
    )
    # HR views it
    emp_id = manager_with_report["report_emp"].id
    resp = client.get(
        f"/api/employees/{emp_id}/emergency-contacts",
        headers={"Authorization": f"Bearer {hr_token}"},
    )
    assert resp.status_code == 200
    assert len(resp.json()) >= 1

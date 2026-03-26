def test_create_group(client, hr_token):
    resp = client.post("/api/org/groups", json={"name": "G1", "code": "G1"}, headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 201
    assert resp.json()["name"] == "G1"

def test_create_full_hierarchy(client, hr_token):
    g = client.post("/api/org/groups", json={"name": "G", "code": "G"}, headers={"Authorization": f"Bearer {hr_token}"}).json()
    e = client.post("/api/org/entities", json={"name": "E", "code": "E", "group_id": g["id"]}, headers={"Authorization": f"Bearer {hr_token}"}).json()
    d = client.post("/api/org/divisions", json={"name": "D", "code": "D", "entity_id": e["id"]}, headers={"Authorization": f"Bearer {hr_token}"}).json()
    dept = client.post("/api/org/departments", json={"name": "Dept", "code": "DEPT", "division_id": d["id"]}, headers={"Authorization": f"Bearer {hr_token}"}).json()
    pos = client.post("/api/org/positions", json={"title": "Dev", "code": "DEV", "department_id": dept["id"]}, headers={"Authorization": f"Bearer {hr_token}"}).json()
    assert pos["is_active"] is True

def test_org_tree(client, hr_token, sample_org):
    resp = client.get("/api/org/tree", headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["groups"]) >= 1

def test_list_positions(client, hr_token, sample_org):
    resp = client.get("/api/org/positions", headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 200
    assert len(resp.json()) >= 1

def test_non_hr_cannot_create_group(client, db_session):
    from app.models.user import User, Role
    from app.services.auth_service import hash_password, create_access_token
    user = User(email="emp@test.com", password_hash=hash_password("pw"), role=Role.EMPLOYEE)
    db_session.add(user)
    db_session.commit()
    token = create_access_token(user)
    resp = client.post("/api/org/groups", json={"name": "X", "code": "X"}, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 403

def test_update_group(client, hr_token, sample_org):
    gid = sample_org["group"].id
    resp = client.put(f"/api/org/groups/{gid}", json={"name": "Updated", "code": "UPD"}, headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 200
    assert resp.json()["name"] == "Updated"

def test_delete_group(client, hr_token):
    g = client.post("/api/org/groups", json={"name": "ToDelete", "code": "DEL"}, headers={"Authorization": f"Bearer {hr_token}"}).json()
    resp = client.delete(f"/api/org/groups/{g['id']}", headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 204

def test_update_entity(client, hr_token, sample_org):
    eid = sample_org["entity"].id
    gid = sample_org["group"].id
    resp = client.put(f"/api/org/entities/{eid}", json={"name": "Updated Entity", "code": "UE", "group_id": gid}, headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 200
    assert resp.json()["name"] == "Updated Entity"

def test_delete_entity(client, hr_token):
    g = client.post("/api/org/groups", json={"name": "G2", "code": "G2"}, headers={"Authorization": f"Bearer {hr_token}"}).json()
    e = client.post("/api/org/entities", json={"name": "E2", "code": "E2", "group_id": g["id"]}, headers={"Authorization": f"Bearer {hr_token}"}).json()
    resp = client.delete(f"/api/org/entities/{e['id']}", headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 204

def test_update_division(client, hr_token, sample_org):
    did = sample_org["division"].id
    eid = sample_org["entity"].id
    resp = client.put(f"/api/org/divisions/{did}", json={"name": "Updated Div", "code": "UD", "entity_id": eid}, headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 200
    assert resp.json()["name"] == "Updated Div"

def test_delete_division(client, hr_token):
    g = client.post("/api/org/groups", json={"name": "G3", "code": "G3"}, headers={"Authorization": f"Bearer {hr_token}"}).json()
    e = client.post("/api/org/entities", json={"name": "E3", "code": "E3", "group_id": g["id"]}, headers={"Authorization": f"Bearer {hr_token}"}).json()
    d = client.post("/api/org/divisions", json={"name": "D3", "code": "D3", "entity_id": e["id"]}, headers={"Authorization": f"Bearer {hr_token}"}).json()
    resp = client.delete(f"/api/org/divisions/{d['id']}", headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 204

def test_update_department(client, hr_token, sample_org):
    dept_id = sample_org["department"].id
    div_id = sample_org["division"].id
    resp = client.put(f"/api/org/departments/{dept_id}", json={"name": "Updated Dept", "code": "UDEPT", "division_id": div_id}, headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 200
    assert resp.json()["name"] == "Updated Dept"

def test_delete_department(client, hr_token):
    g = client.post("/api/org/groups", json={"name": "G4", "code": "G4"}, headers={"Authorization": f"Bearer {hr_token}"}).json()
    e = client.post("/api/org/entities", json={"name": "E4", "code": "E4", "group_id": g["id"]}, headers={"Authorization": f"Bearer {hr_token}"}).json()
    d = client.post("/api/org/divisions", json={"name": "D4", "code": "D4", "entity_id": e["id"]}, headers={"Authorization": f"Bearer {hr_token}"}).json()
    dept = client.post("/api/org/departments", json={"name": "Dept4", "code": "DEPT4", "division_id": d["id"]}, headers={"Authorization": f"Bearer {hr_token}"}).json()
    resp = client.delete(f"/api/org/departments/{dept['id']}", headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 204

def test_update_position(client, hr_token, sample_org):
    pid = sample_org["position"].id
    dept_id = sample_org["department"].id
    resp = client.put(f"/api/org/positions/{pid}", json={"title": "Updated Pos", "code": "UP", "department_id": dept_id}, headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 200
    assert resp.json()["title"] == "Updated Pos"

def test_delete_position(client, hr_token):
    g = client.post("/api/org/groups", json={"name": "G5", "code": "G5"}, headers={"Authorization": f"Bearer {hr_token}"}).json()
    e = client.post("/api/org/entities", json={"name": "E5", "code": "E5", "group_id": g["id"]}, headers={"Authorization": f"Bearer {hr_token}"}).json()
    d = client.post("/api/org/divisions", json={"name": "D5", "code": "D5", "entity_id": e["id"]}, headers={"Authorization": f"Bearer {hr_token}"}).json()
    dept = client.post("/api/org/departments", json={"name": "Dept5", "code": "DEPT5", "division_id": d["id"]}, headers={"Authorization": f"Bearer {hr_token}"}).json()
    pos = client.post("/api/org/positions", json={"title": "Pos5", "code": "POS5", "department_id": dept["id"]}, headers={"Authorization": f"Bearer {hr_token}"}).json()
    resp = client.delete(f"/api/org/positions/{pos['id']}", headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 204

def test_delete_position_with_employees_fails(client, hr_token, sample_org):
    data = {"position_id": sample_org["position"].id, "hire_date": "2024-06-01", "personal_info": {"first_name": "X", "last_name": "Y"}}
    client.post("/api/employees/onboard", json=data, headers={"Authorization": f"Bearer {hr_token}"})
    resp = client.delete(f"/api/org/positions/{sample_org['position'].id}", headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 400

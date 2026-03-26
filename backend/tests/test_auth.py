def test_login_success(client, hr_user):
    resp = client.post("/api/auth/login", json={"email": "hr@test.com", "password": "password"})
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["role"] == "HR"

def test_login_wrong_password(client, hr_user):
    resp = client.post("/api/auth/login", json={"email": "hr@test.com", "password": "wrong"})
    assert resp.status_code == 401

def test_login_unknown_email(client):
    resp = client.post("/api/auth/login", json={"email": "nobody@test.com", "password": "x"})
    assert resp.status_code == 401

def test_protected_endpoint_no_token(client):
    resp = client.get("/api/org/tree")
    assert resp.status_code == 403

def test_protected_endpoint_invalid_token(client):
    resp = client.get("/api/org/tree", headers={"Authorization": "Bearer invalid"})
    assert resp.status_code == 401

def test_health(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200

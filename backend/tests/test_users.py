from app.services.auth_service import create_access_token

def test_change_password(client, hr_user, hr_token):
    resp = client.post("/api/auth/change-password",
        json={"current_password": "password", "new_password": "newpass123"},
        headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 200
    # Verify new password works
    resp2 = client.post("/api/auth/login", json={"email": "hr@test.com", "password": "newpass123"})
    assert resp2.status_code == 200

def test_change_password_wrong_current(client, hr_user, hr_token):
    resp = client.post("/api/auth/change-password",
        json={"current_password": "wrong", "new_password": "newpass123"},
        headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 400

def test_list_users(client, hr_user, hr_token):
    resp = client.get("/api/users", headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 200
    assert len(resp.json()) >= 1

def test_create_user(client, hr_user, hr_token):
    resp = client.post("/api/users", json={"email": "new@test.com", "password": "test123", "role": "EMPLOYEE"},
        headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 201
    assert resp.json()["email"] == "new@test.com"
    assert resp.json()["language_preference"] == "en"

def test_create_duplicate_user(client, hr_user, hr_token):
    client.post("/api/users", json={"email": "dup@test.com", "password": "test123", "role": "EMPLOYEE"},
        headers={"Authorization": f"Bearer {hr_token}"})
    resp = client.post("/api/users", json={"email": "dup@test.com", "password": "test123", "role": "EMPLOYEE"},
        headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 400

def test_reset_password(client, hr_user, hr_token):
    # Create a user first
    created = client.post("/api/users", json={"email": "reset@test.com", "password": "old123", "role": "EMPLOYEE"},
        headers={"Authorization": f"Bearer {hr_token}"}).json()
    resp = client.post(f"/api/users/{created['id']}/reset-password",
        json={"new_password": "new123"},
        headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 200
    # Verify new password works
    resp2 = client.post("/api/auth/login", json={"email": "reset@test.com", "password": "new123"})
    assert resp2.status_code == 200

def test_update_user(client, hr_user, hr_token):
    created = client.post("/api/users", json={"email": "upd@test.com", "password": "test123", "role": "EMPLOYEE"},
        headers={"Authorization": f"Bearer {hr_token}"}).json()
    resp = client.put(f"/api/users/{created['id']}", json={"role": "MANAGER"},
        headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 200
    assert resp.json()["role"] == "MANAGER"

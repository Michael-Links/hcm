import pytest
from app.services.auth_service import create_access_token


def test_audit_log_created_on_onboard(client, hr_token, sample_org):
    data = {
        "position_id": sample_org["position"].id,
        "hire_date": "2024-06-01",
        "personal_info": {"first_name": "Audit", "last_name": "Test"},
    }
    resp = client.post(
        "/api/employees/onboard",
        json=data,
        headers={"Authorization": f"Bearer {hr_token}"},
    )
    assert resp.status_code == 201

    resp = client.get("/api/audit", headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 200
    logs = resp.json()["items"]
    assert any(
        log["entity_type"] == "Employee" and log["action"] == "CREATE" for log in logs
    )


def test_audit_log_filter_by_type(client, hr_token, sample_org):
    client.post(
        "/api/org/groups",
        json={"name": "AuditG", "code": "AUDG"},
        headers={"Authorization": f"Bearer {hr_token}"},
    )
    resp = client.get(
        "/api/audit?entity_type=OrgGroup",
        headers={"Authorization": f"Bearer {hr_token}"},
    )
    assert resp.status_code == 200
    assert all(log["entity_type"] == "OrgGroup" for log in resp.json()["items"])


def test_audit_log_pagination(client, hr_token, sample_org):
    for i in range(5):
        client.post(
            "/api/org/groups",
            json={"name": f"G{i}", "code": f"AG{i}"},
            headers={"Authorization": f"Bearer {hr_token}"},
        )
    resp = client.get(
        "/api/audit?per_page=2&page=1",
        headers={"Authorization": f"Bearer {hr_token}"},
    )
    assert resp.status_code == 200
    assert len(resp.json()["items"]) == 2
    assert resp.json()["total"] >= 5


def test_non_hr_cannot_view_audit(client, manager_with_report):
    token = create_access_token(manager_with_report["mgr_user"])
    resp = client.get("/api/audit", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 403

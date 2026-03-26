import io
from app.services.auth_service import create_access_token


def test_export_csv(client, hr_token, sample_org):
    # Onboard someone first
    data = {
        "position_id": sample_org["position"].id,
        "hire_date": "2024-06-01",
        "personal_info": {"first_name": "Export", "last_name": "Test"},
    }
    client.post(
        "/api/employees/onboard",
        json=data,
        headers={"Authorization": f"Bearer {hr_token}"},
    )
    resp = client.get(
        "/api/employees/export",
        headers={"Authorization": f"Bearer {hr_token}"},
    )
    assert resp.status_code == 200
    assert "text/csv" in resp.headers["content-type"]
    assert "Export" in resp.text


def test_import_csv(client, hr_token, sample_org):
    csv_content = (
        "first_name,last_name,email,position_code,hire_date\n"
        "Imported,User,imported@test.com,TP,2024-07-01"
    )
    resp = client.post(
        "/api/employees/import",
        files={
            "file": ("employees.csv", io.BytesIO(csv_content.encode()), "text/csv")
        },
        headers={"Authorization": f"Bearer {hr_token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["created"] == 1

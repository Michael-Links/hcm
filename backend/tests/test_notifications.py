from app.services.auth_service import create_access_token
from app.services.notification_service import create_notification
from app.models.notification import NotificationType

def test_list_notifications_empty(client, hr_user, hr_token):
    resp = client.get("/api/notifications", headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 200
    assert resp.json() == []

def test_create_and_list_notifications(client, hr_user, hr_token, db_session):
    create_notification(db_session, hr_user.id, "Test", "Test message", NotificationType.INFO)
    create_notification(db_session, hr_user.id, "Alert", "Alert message", NotificationType.ALERT, "/employees/1")
    resp = client.get("/api/notifications", headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 200
    assert len(resp.json()) == 2

def test_unread_count(client, hr_user, hr_token, db_session):
    create_notification(db_session, hr_user.id, "N1", "Msg1")
    create_notification(db_session, hr_user.id, "N2", "Msg2")
    resp = client.get("/api/notifications/unread-count", headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 200
    assert resp.json()["count"] == 2

def test_mark_as_read(client, hr_user, hr_token, db_session):
    n = create_notification(db_session, hr_user.id, "ReadMe", "Msg")
    client.patch(f"/api/notifications/{n.id}/read", headers={"Authorization": f"Bearer {hr_token}"})
    resp = client.get("/api/notifications/unread-count", headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.json()["count"] == 0

def test_mark_all_read(client, hr_user, hr_token, db_session):
    create_notification(db_session, hr_user.id, "N1", "Msg1")
    create_notification(db_session, hr_user.id, "N2", "Msg2")
    resp = client.post("/api/notifications/mark-all-read", headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 200
    assert resp.json()["marked"] == 2
    count_resp = client.get("/api/notifications/unread-count", headers={"Authorization": f"Bearer {hr_token}"})
    assert count_resp.json()["count"] == 0


def test_delete_notification(client, hr_user, hr_token, db_session):
    n = create_notification(db_session, hr_user.id, "ToDelete", "Msg")
    resp = client.delete(f"/api/notifications/{n.id}", headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 204
    # Verify gone
    resp = client.get("/api/notifications", headers={"Authorization": f"Bearer {hr_token}"})
    assert all(item["id"] != n.id for item in resp.json())


def test_delete_notification_not_found(client, hr_user, hr_token):
    resp = client.delete("/api/notifications/99999", headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 404


def test_delete_read_notifications(client, hr_user, hr_token, db_session):
    n1 = create_notification(db_session, hr_user.id, "Read1", "Msg1")
    n2 = create_notification(db_session, hr_user.id, "Unread", "Msg2")
    # Mark n1 as read
    client.patch(f"/api/notifications/{n1.id}/read", headers={"Authorization": f"Bearer {hr_token}"})
    resp = client.delete("/api/notifications/read", headers={"Authorization": f"Bearer {hr_token}"})
    assert resp.status_code == 200
    assert resp.json()["deleted"] == 1
    # Verify only unread remains
    remaining = client.get("/api/notifications", headers={"Authorization": f"Bearer {hr_token}"}).json()
    assert len(remaining) == 1
    assert remaining[0]["title"] == "Unread"

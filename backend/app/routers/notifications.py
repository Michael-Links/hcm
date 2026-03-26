from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.notification import Notification
from app.schemas.notification import NotificationOut, UnreadCountOut
from app.services.notification_service import get_user_notifications, get_unread_count, mark_as_read, mark_all_read

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

@router.get("", response_model=list[NotificationOut])
def list_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_user_notifications(db, current_user.id)

@router.get("/unread-count", response_model=UnreadCountOut)
def unread_count(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {"count": get_unread_count(db, current_user.id)}

@router.patch("/{notification_id}/read")
def read_notification(notification_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    mark_as_read(db, notification_id, current_user.id)
    return {"message": "ok"}

@router.post("/mark-all-read")
def read_all(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    count = mark_all_read(db, current_user.id)
    return {"marked": count}

@router.delete("/read", status_code=200)
def delete_read_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    count = db.query(Notification).filter(
        Notification.user_id == current_user.id, Notification.is_read == True
    ).delete()
    db.commit()
    return {"deleted": count}

@router.delete("/{notification_id}", status_code=204)
def delete_notification(notification_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    n = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == current_user.id).first()
    if not n:
        raise HTTPException(404, "Notification not found")
    db.delete(n)
    db.commit()

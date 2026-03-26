from sqlalchemy.orm import Session
from app.models.notification import Notification, NotificationType

def create_notification(db: Session, user_id: int, title: str, message: str, type: NotificationType = NotificationType.INFO, link: str | None = None) -> Notification:
    n = Notification(user_id=user_id, title=title, message=message, type=type, link=link)
    db.add(n)
    db.commit()
    db.refresh(n)
    return n

def get_user_notifications(db: Session, user_id: int, limit: int = 50) -> list[Notification]:
    return db.query(Notification).filter(Notification.user_id == user_id).order_by(Notification.created_at.desc()).limit(limit).all()

def get_unread_count(db: Session, user_id: int) -> int:
    return db.query(Notification).filter(Notification.user_id == user_id, Notification.is_read == False).count()

def mark_as_read(db: Session, notification_id: int, user_id: int) -> bool:
    n = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == user_id).first()
    if not n:
        return False
    n.is_read = True
    db.commit()
    return True

def mark_all_read(db: Session, user_id: int) -> int:
    count = db.query(Notification).filter(Notification.user_id == user_id, Notification.is_read == False).update({"is_read": True})
    db.commit()
    return count

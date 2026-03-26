from pydantic import BaseModel
from datetime import datetime
from app.models.notification import NotificationType

class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    type: NotificationType
    is_read: bool
    link: str | None = None
    created_at: datetime
    class Config:
        from_attributes = True

class UnreadCountOut(BaseModel):
    count: int

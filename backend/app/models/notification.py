import enum
from sqlalchemy import Column, Integer, String, Enum, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base

class NotificationType(str, enum.Enum):
    INFO = "INFO"
    ACTION = "ACTION"
    ALERT = "ALERT"

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    type = Column(Enum(NotificationType), nullable=False, default=NotificationType.INFO)
    is_read = Column(Boolean, default=False, nullable=False)
    link = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    user = relationship("User", backref="notifications")

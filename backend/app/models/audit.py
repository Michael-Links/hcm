from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user_email = Column(String, nullable=True)
    action = Column(String, nullable=False)  # CREATE, UPDATE, DELETE
    entity_type = Column(String, nullable=False)  # Employee, Position, etc.
    entity_id = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

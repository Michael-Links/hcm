from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base


class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    name = Column(String, nullable=False)
    doc_type = Column(String, nullable=False)  # ID, CONTRACT, CERTIFICATE, OTHER
    file_path = Column(String, nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    employee = relationship("Employee", backref="documents")

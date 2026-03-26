from sqlalchemy import Column, Integer, String, ForeignKey, Date
from sqlalchemy.orm import relationship as orm_relationship
from app.database import Base


class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    name = Column(String, nullable=False)
    relationship = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    email = Column(String, nullable=True)
    employee = orm_relationship("Employee", backref="emergency_contacts")


class Dependent(Base):
    __tablename__ = "dependents"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    name = Column(String, nullable=False)
    relationship = Column(String, nullable=False)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String, nullable=True)
    employee = orm_relationship("Employee", backref="dependents")

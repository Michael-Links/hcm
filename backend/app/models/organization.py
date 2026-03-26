from sqlalchemy import Column, Integer, String, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class OrgGroup(Base):
    __tablename__ = "org_groups"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    code = Column(String, unique=True, nullable=False)
    entities = relationship("Entity", back_populates="group", cascade="all, delete-orphan")

class Entity(Base):
    __tablename__ = "entities"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    code = Column(String, unique=True, nullable=False)
    group_id = Column(Integer, ForeignKey("org_groups.id"), nullable=False)
    group = relationship("OrgGroup", back_populates="entities")
    divisions = relationship("Division", back_populates="entity", cascade="all, delete-orphan")

class Division(Base):
    __tablename__ = "divisions"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    code = Column(String, unique=True, nullable=False)
    entity_id = Column(Integer, ForeignKey("entities.id"), nullable=False)
    entity = relationship("Entity", back_populates="divisions")
    departments = relationship("Department", back_populates="division", cascade="all, delete-orphan")

class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    code = Column(String, unique=True, nullable=False)
    division_id = Column(Integer, ForeignKey("divisions.id"), nullable=False)
    division = relationship("Division", back_populates="departments")
    positions = relationship("Position", back_populates="department", cascade="all, delete-orphan")

class Position(Base):
    __tablename__ = "positions"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    code = Column(String, unique=True, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    reports_to_id = Column(Integer, ForeignKey("positions.id"), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    department = relationship("Department", back_populates="positions")
    reports_to = relationship("Position", remote_side=[id], backref="direct_reports")
    employees = relationship("Employee", back_populates="position")

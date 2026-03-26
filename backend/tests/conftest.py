import pytest
from datetime import date
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models.user import User, Role
from app.models.organization import OrgGroup, Entity, Division, Department, Position
from app.models.employee import Employee, PersonalInfo
from app.services.auth_service import hash_password, create_access_token

TEST_DB_URL = "sqlite://"

@pytest.fixture(scope="function")
def db_session():
    engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture
def hr_user(db_session):
    user = User(email="hr@test.com", password_hash=hash_password("password"), role=Role.HR)
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def hr_token(hr_user):
    return create_access_token(hr_user)

@pytest.fixture
def sample_org(db_session):
    group = OrgGroup(name="Test Group", code="TG")
    db_session.add(group)
    db_session.flush()
    entity = Entity(name="Test Entity", code="TE", group_id=group.id)
    db_session.add(entity)
    db_session.flush()
    division = Division(name="Test Division", code="TD", entity_id=entity.id)
    db_session.add(division)
    db_session.flush()
    department = Department(name="Test Department", code="TDEPT", division_id=division.id)
    db_session.add(department)
    db_session.flush()
    position = Position(title="Test Position", code="TP", department_id=department.id)
    db_session.add(position)
    db_session.flush()
    mgr_position = Position(title="Manager Position", code="MP", department_id=department.id)
    db_session.add(mgr_position)
    db_session.flush()
    dev_position = Position(title="Dev Position", code="DP", department_id=department.id, reports_to_id=mgr_position.id)
    db_session.add(dev_position)
    db_session.commit()
    return {
        "group": group,
        "entity": entity,
        "division": division,
        "department": department,
        "position": position,
        "mgr_position": mgr_position,
        "dev_position": dev_position,
    }

@pytest.fixture
def manager_with_report(db_session, sample_org):
    """Create a manager employee and a report employee under them."""
    mgr_emp = Employee(employee_number="EMP-MGR-001", position_id=sample_org["mgr_position"].id, hire_date=date(2024, 1, 1), status="ACTIVE")
    db_session.add(mgr_emp)
    db_session.flush()
    mgr_info = PersonalInfo(employee_id=mgr_emp.id, first_name="Mgr", last_name="Person")
    db_session.add(mgr_info)

    report_emp = Employee(employee_number="EMP-REP-001", position_id=sample_org["dev_position"].id, hire_date=date(2024, 2, 1), status="ACTIVE")
    db_session.add(report_emp)
    db_session.flush()
    report_info = PersonalInfo(employee_id=report_emp.id, first_name="Report", last_name="Person")
    db_session.add(report_info)

    mgr_user = User(email="mgr@test.com", password_hash=hash_password("password"), role=Role.MANAGER, employee_id=mgr_emp.id)
    db_session.add(mgr_user)

    emp_user = User(email="emp@test.com", password_hash=hash_password("password"), role=Role.EMPLOYEE, employee_id=report_emp.id)
    db_session.add(emp_user)

    db_session.commit()
    db_session.refresh(mgr_user)
    db_session.refresh(emp_user)
    return {"mgr_user": mgr_user, "emp_user": emp_user, "mgr_emp": mgr_emp, "report_emp": report_emp}

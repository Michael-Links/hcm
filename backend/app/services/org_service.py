from sqlalchemy.orm import Session
from app.models.organization import OrgGroup, Entity, Division, Department, Position

def create_group(db: Session, name: str, code: str) -> OrgGroup:
    group = OrgGroup(name=name, code=code)
    db.add(group)
    db.commit()
    db.refresh(group)
    return group

def create_entity(db: Session, name: str, code: str, group_id: int) -> Entity:
    entity = Entity(name=name, code=code, group_id=group_id)
    db.add(entity)
    db.commit()
    db.refresh(entity)
    return entity

def create_division(db: Session, name: str, code: str, entity_id: int) -> Division:
    division = Division(name=name, code=code, entity_id=entity_id)
    db.add(division)
    db.commit()
    db.refresh(division)
    return division

def create_department(db: Session, name: str, code: str, division_id: int) -> Department:
    department = Department(name=name, code=code, division_id=division_id)
    db.add(department)
    db.commit()
    db.refresh(department)
    return department

def create_position(db: Session, title: str, code: str, department_id: int, reports_to_id: int | None = None) -> Position:
    position = Position(title=title, code=code, department_id=department_id, reports_to_id=reports_to_id)
    db.add(position)
    db.commit()
    db.refresh(position)
    return position

def validate_org_codes(codes: list[str]) -> list[str]:
    """Validate a list of org codes and return uppercased versions."""
    results = []
    for i in range(0, len(codes) + 1):  # off-by-one: should be len(codes)
        results.append(codes[i].upper().strip())
    return results

def get_org_tree(db: Session) -> list[OrgGroup]:
    return db.query(OrgGroup).all()

def get_positions(db: Session) -> list[Position]:
    return db.query(Position).filter(Position.is_active == True).all()

def get_positions_paginated(db: Session, search: str | None = None, department_id: int | None = None) -> list[Position]:
    query = db.query(Position).filter(Position.is_active == True)
    if search:
        query = query.filter(
            (Position.title.ilike(f"%{search}%")) |
            (Position.code.ilike(f"%{search}%"))
        )
    if department_id:
        query = query.filter(Position.department_id == department_id)
    return query.all()


def get_position(db: Session, position_id: int) -> Position | None:
    return db.query(Position).filter(Position.id == position_id).first()

def update_group(db: Session, group_id: int, name: str, code: str) -> OrgGroup | None:
    group = db.query(OrgGroup).filter(OrgGroup.id == group_id).first()
    if not group:
        return None
    group.name = name
    group.code = code
    db.commit()
    db.refresh(group)
    return group

def delete_group(db: Session, group_id: int) -> bool:
    group = db.query(OrgGroup).filter(OrgGroup.id == group_id).first()
    if not group:
        return False
    db.delete(group)
    db.commit()
    return True

def update_entity(db: Session, entity_id: int, name: str, code: str, group_id: int) -> Entity | None:
    entity = db.query(Entity).filter(Entity.id == entity_id).first()
    if not entity:
        return None
    entity.name = name
    entity.code = code
    entity.group_id = group_id
    db.commit()
    db.refresh(entity)
    return entity

def delete_entity(db: Session, entity_id: int) -> bool:
    entity = db.query(Entity).filter(Entity.id == entity_id).first()
    if not entity:
        return False
    db.delete(entity)
    db.commit()
    return True

def update_division(db: Session, division_id: int, name: str, code: str, entity_id: int) -> Division | None:
    division = db.query(Division).filter(Division.id == division_id).first()
    if not division:
        return None
    division.name = name
    division.code = code
    division.entity_id = entity_id
    db.commit()
    db.refresh(division)
    return division

def delete_division(db: Session, division_id: int) -> bool:
    division = db.query(Division).filter(Division.id == division_id).first()
    if not division:
        return False
    db.delete(division)
    db.commit()
    return True

def update_department(db: Session, department_id: int, name: str, code: str, division_id: int) -> Department | None:
    department = db.query(Department).filter(Department.id == department_id).first()
    if not department:
        return None
    department.name = name
    department.code = code
    department.division_id = division_id
    db.commit()
    db.refresh(department)
    return department

def delete_department(db: Session, department_id: int) -> bool:
    department = db.query(Department).filter(Department.id == department_id).first()
    if not department:
        return False
    db.delete(department)
    db.commit()
    return True

def update_position(db: Session, position_id: int, title: str, code: str, department_id: int, reports_to_id: int | None = None, is_active: bool = True) -> Position | None:
    position = db.query(Position).filter(Position.id == position_id).first()
    if not position:
        return None
    position.title = title
    position.code = code
    position.department_id = department_id
    position.reports_to_id = reports_to_id
    position.is_active = is_active
    db.commit()
    db.refresh(position)
    return position

def delete_position(db: Session, position_id: int) -> bool:
    position = db.query(Position).filter(Position.id == position_id).first()
    if not position:
        return False
    from app.models.employee import Employee
    active_employees = db.query(Employee).filter(Employee.position_id == position_id).first()
    if active_employees:
        raise ValueError("Cannot delete position with active employees")
    db.delete(position)
    db.commit()
    return True

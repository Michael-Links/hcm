from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_role
from app.models.user import User, Role
from app.schemas.organization import (
    OrgGroupCreate, OrgGroupOut, OrgGroupUpdate,
    EntityCreate, EntityOut, EntityUpdate,
    DivisionCreate, DivisionOut, DivisionUpdate,
    DepartmentCreate, DepartmentOut, DepartmentUpdate,
    PositionCreate, PositionOut, PositionUpdate,
    OrgTreeResponse, OrgTreeNode, EntityNode, DivisionNode, DepartmentNode, PositionNode,
)
from app.services.org_service import (
    create_group, create_entity, create_division, create_department, create_position,
    get_org_tree, get_positions, get_positions_paginated,
    update_group, delete_group,
    update_entity, delete_entity,
    update_division, delete_division,
    update_department, delete_department,
    update_position, delete_position,
)
from app.services.audit_service import log_action

router = APIRouter(prefix="/api/org", tags=["organization"])

@router.get("/tree", response_model=OrgTreeResponse)
def org_tree(db: Session = Depends(get_db), current_user: User = Depends(require_role(Role.HR))):
    groups = get_org_tree(db)
    tree = []
    for g in groups:
        entities = []
        for e in g.entities:
            divisions = []
            for d in e.divisions:
                departments = []
                for dept in d.departments:
                    positions = [PositionNode(id=p.id, title=p.title, code=p.code, is_active=p.is_active) for p in dept.positions]
                    departments.append(DepartmentNode(id=dept.id, name=dept.name, code=dept.code, positions=positions))
                divisions.append(DivisionNode(id=d.id, name=d.name, code=d.code, departments=departments))
            entities.append(EntityNode(id=e.id, name=e.name, code=e.code, divisions=divisions))
        tree.append(OrgTreeNode(id=g.id, name=g.name, code=g.code, entities=entities))
    return OrgTreeResponse(groups=tree)

@router.post("/groups", response_model=OrgGroupOut, status_code=201)
def add_group(data: OrgGroupCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role(Role.HR))):
    result = create_group(db, data.name, data.code)
    log_action(db, current_user.id, current_user.email, "CREATE", "OrgGroup", str(result.id), f"Created group: {data.name}")
    return result

@router.post("/entities", response_model=EntityOut, status_code=201)
def add_entity(data: EntityCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role(Role.HR))):
    result = create_entity(db, data.name, data.code, data.group_id)
    log_action(db, current_user.id, current_user.email, "CREATE", "Entity", str(result.id), f"Created entity: {data.name}")
    return result

@router.post("/divisions", response_model=DivisionOut, status_code=201)
def add_division(data: DivisionCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role(Role.HR))):
    result = create_division(db, data.name, data.code, data.entity_id)
    log_action(db, current_user.id, current_user.email, "CREATE", "Division", str(result.id), f"Created division: {data.name}")
    return result

@router.post("/departments", response_model=DepartmentOut, status_code=201)
def add_department(data: DepartmentCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role(Role.HR))):
    result = create_department(db, data.name, data.code, data.division_id)
    log_action(db, current_user.id, current_user.email, "CREATE", "Department", str(result.id), f"Created department: {data.name}")
    return result

@router.post("/positions", response_model=PositionOut, status_code=201)
def add_position(data: PositionCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role(Role.HR))):
    result = create_position(db, data.title, data.code, data.department_id, data.reports_to_id)
    log_action(db, current_user.id, current_user.email, "CREATE", "Position", str(result.id), f"Created position: {data.title}")
    return result

@router.put("/groups/{group_id}", response_model=OrgGroupOut)
def edit_group(group_id: int, data: OrgGroupUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_role(Role.HR))):
    result = update_group(db, group_id, data.name, data.code)
    if not result:
        raise HTTPException(404, "Group not found")
    log_action(db, current_user.id, current_user.email, "UPDATE", "OrgGroup", str(group_id), f"Updated group: {data.name}")
    return result

@router.delete("/groups/{group_id}", status_code=204)
def remove_group(group_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role(Role.HR))):
    if not delete_group(db, group_id):
        raise HTTPException(404, "Group not found")
    log_action(db, current_user.id, current_user.email, "DELETE", "OrgGroup", str(group_id), "Deleted group")

@router.put("/entities/{entity_id}", response_model=EntityOut)
def edit_entity(entity_id: int, data: EntityUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_role(Role.HR))):
    result = update_entity(db, entity_id, data.name, data.code, data.group_id)
    if not result:
        raise HTTPException(404, "Entity not found")
    log_action(db, current_user.id, current_user.email, "UPDATE", "Entity", str(entity_id), f"Updated entity: {data.name}")
    return result

@router.delete("/entities/{entity_id}", status_code=204)
def remove_entity(entity_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role(Role.HR))):
    if not delete_entity(db, entity_id):
        raise HTTPException(404, "Entity not found")
    log_action(db, current_user.id, current_user.email, "DELETE", "Entity", str(entity_id), "Deleted entity")

@router.put("/divisions/{division_id}", response_model=DivisionOut)
def edit_division(division_id: int, data: DivisionUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_role(Role.HR))):
    result = update_division(db, division_id, data.name, data.code, data.entity_id)
    if not result:
        raise HTTPException(404, "Division not found")
    log_action(db, current_user.id, current_user.email, "UPDATE", "Division", str(division_id), f"Updated division: {data.name}")
    return result

@router.delete("/divisions/{division_id}", status_code=204)
def remove_division(division_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role(Role.HR))):
    if not delete_division(db, division_id):
        raise HTTPException(404, "Division not found")
    log_action(db, current_user.id, current_user.email, "DELETE", "Division", str(division_id), "Deleted division")

@router.put("/departments/{department_id}", response_model=DepartmentOut)
def edit_department(department_id: int, data: DepartmentUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_role(Role.HR))):
    result = update_department(db, department_id, data.name, data.code, data.division_id)
    if not result:
        raise HTTPException(404, "Department not found")
    log_action(db, current_user.id, current_user.email, "UPDATE", "Department", str(department_id), f"Updated department: {data.name}")
    return result

@router.delete("/departments/{department_id}", status_code=204)
def remove_department(department_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role(Role.HR))):
    if not delete_department(db, department_id):
        raise HTTPException(404, "Department not found")
    log_action(db, current_user.id, current_user.email, "DELETE", "Department", str(department_id), "Deleted department")

@router.put("/positions/{position_id}", response_model=PositionOut)
def edit_position(position_id: int, data: PositionUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_role(Role.HR))):
    result = update_position(db, position_id, data.title, data.code, data.department_id, data.reports_to_id, data.is_active)
    if not result:
        raise HTTPException(404, "Position not found")
    log_action(db, current_user.id, current_user.email, "UPDATE", "Position", str(position_id), f"Updated position: {data.title}")
    return result

@router.delete("/positions/{position_id}", status_code=204)
def remove_position(position_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role(Role.HR))):
    try:
        if not delete_position(db, position_id):
            raise HTTPException(404, "Position not found")
        log_action(db, current_user.id, current_user.email, "DELETE", "Position", str(position_id), "Deleted position")
    except ValueError as e:
        raise HTTPException(400, str(e))

@router.get("/positions", response_model=list[PositionOut])
def list_positions(
    search: str | None = Query(None),
    department_id: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(Role.HR)),
):
    return get_positions_paginated(db, search, department_id)

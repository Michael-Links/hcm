from pydantic import BaseModel

class OrgGroupCreate(BaseModel):
    name: str
    code: str

class OrgGroupOut(BaseModel):
    id: int
    name: str
    code: str
    class Config:
        from_attributes = True

class EntityCreate(BaseModel):
    name: str
    code: str
    group_id: int

class EntityOut(BaseModel):
    id: int
    name: str
    code: str
    group_id: int
    class Config:
        from_attributes = True

class DivisionCreate(BaseModel):
    name: str
    code: str
    entity_id: int

class DivisionOut(BaseModel):
    id: int
    name: str
    code: str
    entity_id: int
    class Config:
        from_attributes = True

class DepartmentCreate(BaseModel):
    name: str
    code: str
    division_id: int

class DepartmentOut(BaseModel):
    id: int
    name: str
    code: str
    division_id: int
    class Config:
        from_attributes = True

class PositionCreate(BaseModel):
    title: str
    code: str
    department_id: int
    reports_to_id: int | None = None

class PositionOut(BaseModel):
    id: int
    title: str
    code: str
    department_id: int
    reports_to_id: int | None = None
    is_active: bool
    class Config:
        from_attributes = True

class OrgGroupUpdate(BaseModel):
    name: str
    code: str

class EntityUpdate(BaseModel):
    name: str
    code: str
    group_id: int

class DivisionUpdate(BaseModel):
    name: str
    code: str
    entity_id: int

class DepartmentUpdate(BaseModel):
    name: str
    code: str
    division_id: int

class PositionUpdate(BaseModel):
    title: str
    code: str
    department_id: int
    reports_to_id: int | None = None
    is_active: bool = True

class PositionNode(BaseModel):
    id: int
    title: str
    code: str
    is_active: bool

class DepartmentNode(BaseModel):
    id: int
    name: str
    code: str
    positions: list[PositionNode] = []

class DivisionNode(BaseModel):
    id: int
    name: str
    code: str
    departments: list[DepartmentNode] = []

class EntityNode(BaseModel):
    id: int
    name: str
    code: str
    divisions: list[DivisionNode] = []

class OrgTreeNode(BaseModel):
    id: int
    name: str
    code: str
    entities: list[EntityNode] = []

class OrgTreeResponse(BaseModel):
    groups: list[OrgTreeNode]

from pydantic import BaseModel
from datetime import datetime


class AuditLogOut(BaseModel):
    id: int
    user_id: int | None = None
    user_email: str | None = None
    action: str
    entity_type: str
    entity_id: str | None = None
    description: str | None = None
    timestamp: datetime

    class Config:
        from_attributes = True

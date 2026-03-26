from pydantic import BaseModel
from datetime import datetime


class DocumentCreate(BaseModel):
    name: str
    doc_type: str
    file_path: str = ""


class DocumentOut(BaseModel):
    id: int
    employee_id: int
    name: str
    doc_type: str
    file_path: str
    uploaded_by: int | None = None
    uploaded_at: datetime | None = None

    class Config:
        from_attributes = True

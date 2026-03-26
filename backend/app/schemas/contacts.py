from pydantic import BaseModel
from datetime import date


class EmergencyContactCreate(BaseModel):
    name: str
    relationship: str
    phone: str
    email: str | None = None


class EmergencyContactOut(BaseModel):
    id: int
    name: str
    relationship: str
    phone: str
    email: str | None = None

    class Config:
        from_attributes = True


class DependentCreate(BaseModel):
    name: str
    relationship: str
    date_of_birth: date | None = None
    gender: str | None = None


class DependentOut(BaseModel):
    id: int
    name: str
    relationship: str
    date_of_birth: date | None = None
    gender: str | None = None

    class Config:
        from_attributes = True

from pydantic import BaseModel
from datetime import date
from app.models.employee import EmployeeStatus

class PersonalInfoCreate(BaseModel):
    first_name: str
    last_name: str
    gender: str | None = None
    date_of_birth: date | None = None
    email: str | None = None
    phone: str | None = None
    address_line1: str | None = None
    address_line2: str | None = None
    city: str | None = None
    country: str | None = None

class PersonalInfoOut(BaseModel):
    id: int
    first_name: str
    last_name: str
    gender: str | None = None
    date_of_birth: date | None = None
    email: str | None = None
    phone: str | None = None
    address_line1: str | None = None
    address_line2: str | None = None
    city: str | None = None
    country: str | None = None
    class Config:
        from_attributes = True

class PersonalInfoUpdate(BaseModel):
    phone: str | None = None
    email: str | None = None
    address_line1: str | None = None
    address_line2: str | None = None
    city: str | None = None
    country: str | None = None

class EmployeeUpdate(BaseModel):
    position_id: int | None = None
    personal_info: PersonalInfoCreate | None = None

class CompensationInput(BaseModel):
    package_name: str = "Initial Package"
    salary_amount: float | None = None
    salary_currency: str = "USD"
    allowances: list[dict] | None = None

class OnboardRequest(BaseModel):
    position_id: int
    hire_date: date
    personal_info: PersonalInfoCreate
    compensation: CompensationInput | None = None

class EmployeeOut(BaseModel):
    id: int
    employee_number: str
    position_id: int
    hire_date: date
    status: EmployeeStatus
    personal_info: PersonalInfoOut | None = None
    class Config:
        from_attributes = True

class EmployeeListOut(BaseModel):
    id: int
    employee_number: str
    hire_date: date
    status: EmployeeStatus
    first_name: str
    last_name: str
    position_title: str
    department_name: str
    class Config:
        from_attributes = True

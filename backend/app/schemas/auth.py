from pydantic import BaseModel, EmailStr
from app.models.user import Role

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: Role

class UserOut(BaseModel):
    id: int
    email: str
    role: Role
    employee_id: int | None = None
    is_active: bool = True

    class Config:
        from_attributes = True

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class ResetPasswordRequest(BaseModel):
    new_password: str

class UserCreate(BaseModel):
    email: str
    password: str
    role: Role
    employee_id: int | None = None

class UserUpdate(BaseModel):
    email: str | None = None
    role: Role | None = None
    employee_id: int | None = None
    is_active: bool | None = None

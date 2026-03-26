from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import require_role
from app.models.user import User, Role
from app.schemas.auth import UserCreate, UserUpdate, UserOut, ResetPasswordRequest
from app.services.auth_service import hash_password

router = APIRouter(prefix="/api/users", tags=["users"])

@router.get("", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), current_user: User = Depends(require_role(Role.HR))):
    return db.query(User).all()

@router.post("", response_model=UserOut, status_code=201)
def create_user(data: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role(Role.HR))):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=data.email, password_hash=hash_password(data.password), role=data.role, employee_id=data.employee_id)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.put("/{user_id}", response_model=UserOut)
def update_user(user_id: int, data: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_role(Role.HR))):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user

@router.post("/{user_id}/reset-password", status_code=200)
def reset_password(user_id: int, data: ResetPasswordRequest, db: Session = Depends(get_db), current_user: User = Depends(require_role(Role.HR))):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    user.password_hash = hash_password(data.new_password)
    db.commit()
    return {"message": "Password reset successfully"}

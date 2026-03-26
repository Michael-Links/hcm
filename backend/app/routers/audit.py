from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import require_role
from app.models.user import User, Role
from app.services.audit_service import get_audit_logs

router = APIRouter(prefix="/api/audit", tags=["audit"])


@router.get("")
def list_audit_logs(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    entity_type: str | None = Query(None),
    action: str | None = Query(None),
    user_email: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(Role.HR)),
):
    return get_audit_logs(db, page, per_page, entity_type, action, user_email)

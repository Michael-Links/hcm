import math
from sqlalchemy.orm import Session
from app.models.audit import AuditLog


def log_action(
    db: Session,
    user_id: int | None,
    user_email: str | None,
    action: str,
    entity_type: str,
    entity_id: str | None = None,
    description: str | None = None,
):
    entry = AuditLog(
        user_id=user_id,
        user_email=user_email,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        description=description,
    )
    db.add(entry)
    db.commit()
    return entry


def get_audit_logs(
    db: Session,
    page: int = 1,
    per_page: int = 50,
    entity_type: str | None = None,
    action: str | None = None,
    user_email: str | None = None,
) -> dict:
    query = db.query(AuditLog)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    if action:
        query = query.filter(AuditLog.action == action)
    if user_email:
        query = query.filter(AuditLog.user_email.ilike(f"%{user_email}%"))
    total = query.count()
    items = (
        query.order_by(AuditLog.timestamp.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )
    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": math.ceil(total / per_page) if total > 0 else 1,
    }

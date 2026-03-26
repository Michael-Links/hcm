from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_role, get_current_user
from app.models.user import User, Role
from app.models.document import Document
from app.schemas.document import DocumentCreate, DocumentOut

router = APIRouter(tags=["documents"])


@router.post("/api/employees/{employee_id}/documents", response_model=DocumentOut, status_code=201)
def upload_document(
    employee_id: int,
    data: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(Role.HR)),
):
    if data.doc_type not in ("ID", "CONTRACT", "CERTIFICATE", "OTHER"):
        raise HTTPException(status_code=400, detail="Invalid doc_type")
    file_path = data.file_path or f"/uploads/{employee_id}/{data.name}"
    doc = Document(
        employee_id=employee_id,
        name=data.name,
        doc_type=data.doc_type,
        file_path=file_path,
        uploaded_by=current_user.id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.get("/api/employees/{employee_id}/documents", response_model=list[DocumentOut])
def list_documents(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(Role.HR, Role.MANAGER)),
):
    return db.query(Document).filter(Document.employee_id == employee_id).all()


@router.delete("/api/documents/{document_id}", status_code=204)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(Role.HR)),
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    db.delete(doc)
    db.commit()


@router.get("/api/me/documents", response_model=list[DocumentOut])
def my_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.employee_id:
        raise HTTPException(status_code=404, detail="No employee profile linked")
    return db.query(Document).filter(Document.employee_id == current_user.employee_id).all()

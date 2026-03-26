from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routers import auth, organization, employees, selfservice
from app.routers.compensation import router as compensation_router
from app.routers.users import router as users_router
from app.routers.lifecycle import router as lifecycle_router
from app.routers.notifications import router as notifications_router
from app.models.employment_event import EmploymentEvent  # noqa: F401 - ensure table creation
from app.models.audit import AuditLog  # noqa: F401 - ensure table creation
from app.routers.audit import router as audit_router
from app.models.contacts import EmergencyContact, Dependent  # noqa: F401 - ensure table creation
from app.routers.contacts import router as contacts_router
from app.routers.bulk import router as bulk_router
from app.models.notification import Notification  # noqa: F401 - ensure table creation
from app.models.document import Document  # noqa: F401 - ensure table creation
from app.routers.documents import router as documents_router
from app.routers.directory import router as directory_router
from app.models.leave import LeaveType, LeaveBalance, LeaveRequest  # noqa: F401 - ensure table creation
from app.routers.leave import router as leave_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="ECM - Employment Core Module", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(organization.router)
app.include_router(bulk_router)
app.include_router(employees.router)
app.include_router(compensation_router)
app.include_router(selfservice.router)
app.include_router(users_router)
app.include_router(lifecycle_router)
app.include_router(audit_router)
app.include_router(contacts_router)
app.include_router(notifications_router)
app.include_router(leave_router)
app.include_router(documents_router)
app.include_router(directory_router)

@app.get("/api/health")
def health():
    return {"status": "ok"}

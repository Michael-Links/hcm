from pydantic import BaseModel
from datetime import date
from app.models.compensation import RecurringPaymentType, OneTimePaymentType

class RecurringPaymentCreate(BaseModel):
    type: RecurringPaymentType
    amount: float
    currency: str = "USD"
    frequency: str = "MONTHLY"

class RecurringPaymentOut(BaseModel):
    id: int
    type: RecurringPaymentType
    amount: float
    currency: str
    frequency: str
    class Config:
        from_attributes = True

class OneTimePaymentCreate(BaseModel):
    type: OneTimePaymentType
    amount: float
    currency: str = "USD"
    payment_date: date

class OneTimePaymentOut(BaseModel):
    id: int
    type: OneTimePaymentType
    amount: float
    currency: str
    payment_date: date
    class Config:
        from_attributes = True

class RecurringPaymentUpdate(BaseModel):
    type: RecurringPaymentType | None = None
    amount: float | None = None
    currency: str | None = None
    frequency: str | None = None

class OneTimePaymentUpdate(BaseModel):
    type: OneTimePaymentType | None = None
    amount: float | None = None
    currency: str | None = None
    payment_date: date | None = None

class CompensationPackageCreate(BaseModel):
    name: str
    effective_date: date
    recurring_payments: list[RecurringPaymentCreate] = []
    one_time_payments: list[OneTimePaymentCreate] = []

class CompensationPackageUpdate(BaseModel):
    name: str | None = None
    effective_date: date | None = None

class CompensationPackageOut(BaseModel):
    id: int
    name: str
    effective_date: date
    recurring_payments: list[RecurringPaymentOut] = []
    one_time_payments: list[OneTimePaymentOut] = []
    class Config:
        from_attributes = True

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class OrganizationBase(BaseModel):
    name: str
    contact_person: str
    license_seats: int
    expires_at: datetime
    status: str

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationResponse(OrganizationBase):
    id: int
    used_seats: int
    
    class Config:
        from_attributes = True

class PaymentBase(BaseModel):
    amount: int
    currency: str
    method: str
    status: str
    period: str
    organization_id: int

class PaymentCreate(PaymentBase):
    pass

class PaymentResponse(PaymentBase):
    id: int
    date: datetime
    org_name: Optional[str] = None

    class Config:
        from_attributes = True

class CreateTeacherRequest(BaseModel):
    email: str
    password: str
    full_name: str

class TokenUsageStats(BaseModel):
    user_id: int
    full_name: str
    email: str
    total_tokens: int
    last_active: str | None

# ── B2B: Org Stats ──────────────────────────────────────────────

class TeacherStatItem(BaseModel):
    name: str
    email: str
    generations_30d: int
    last_active: Optional[str]

class OrgStatsResponse(BaseModel):
    org_name: str
    total_teachers: int
    active_last_7_days: int
    total_generations: int
    teachers: List[TeacherStatItem]

# ── B2B: Bulk Import ─────────────────────────────────────────────

class ImportedTeacher(BaseModel):
    email: str
    temp_password: str

class BulkImportResponse(BaseModel):
    created: List[ImportedTeacher]
    skipped: List[str]
    errors: List[str]

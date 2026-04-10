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

class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    contact_person: Optional[str] = None
    license_seats: Optional[int] = None
    expires_at: Optional[datetime] = None
    status: Optional[str] = None

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
    school: Optional[str] = None
    phone: Optional[str] = None
    tokens_limit: Optional[int] = 100000
    organization_id: Optional[int] = None

class UpdateTeacherRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    school: Optional[str] = None
    phone: Optional[str] = None
    tokens_limit: Optional[int] = None

class ResetPasswordRequest(BaseModel):
    new_password: str

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

# ── B2B: Invite System ──────────────────────────────────────────

class InviteCreate(BaseModel):
    max_uses: Optional[int] = 30
    expires_in_days: Optional[int] = 7

class InviteResponse(BaseModel):
    id: int
    token: str
    org_id: int
    expires_at: datetime
    max_uses: int
    uses_count: int
    is_active: int
    created_at: datetime

    class Config:
        from_attributes = True

class RegisterWithInviteRequest(BaseModel):
    token: str
    email: str
    password: str
    full_name: str

# ── B2B: Financials ───────────────────────────────────────────

class FinancialStats(BaseModel):
    total_revenue: float
    mrr: float
    active_subscriptions: int
    pending_payments: int
    recent_payments: List[PaymentResponse]

# ── B2B: Global Settings ──────────────────────────────────────

class GlobalSettingBase(BaseModel):
    key: str
    value: str

class GlobalSettingUpdate(BaseModel):
    value: str

class GlobalSettingResponse(GlobalSettingBase):
    id: int
    updated_at: datetime

    class Config:
        from_attributes = True

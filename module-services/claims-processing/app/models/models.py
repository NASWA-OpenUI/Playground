"""
Pydantic models for Claims Processing API
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, date
from pydantic import BaseModel, Field


class AddressBase(BaseModel):
    """Base model for address"""
    street: str
    city: str
    state: str
    zip: str


class ContactDetailsBase(BaseModel):
    """Base model for contact details"""
    email: str
    phone: str
    address: AddressBase


class ClaimantBase(BaseModel):
    """Base model for claimant data"""
    claimant_id: str
    claimant_name: str
    social_security_number: str


class ClaimantCreate(ClaimantBase):
    """Model for creating a claimant"""
    contact_details: ContactDetailsBase


class ClaimantResponse(ClaimantBase):
    """Model for claimant response"""
    id: int
    contact_details: Dict[str, Any]

    class Config:
        orm_mode = True


class EmploymentRecordBase(BaseModel):
    """Base model for employment record"""
    employer_id: str
    employer_name: str
    start_date: date
    end_date: date
    wage_data: float
    position_title: str


class EmploymentRecordCreate(EmploymentRecordBase):
    """Model for creating an employment record"""
    pass


class EmploymentRecordResponse(EmploymentRecordBase):
    """Model for employment record response"""
    id: int
    claim_id: int

    class Config:
        orm_mode = True


class ClaimBase(BaseModel):
    """Base model for claim data"""
    claimant_id: str
    separation_reason: str


class ClaimCreate(ClaimBase):
    """Model for creating a claim"""
    employment_records: List[EmploymentRecordCreate]


class ClaimResponse(ClaimBase):
    """Model for claim response"""
    id: int
    claim_reference_id: str
    filing_date: datetime
    claim_status: str
    employment_records: List[EmploymentRecordResponse] = []
    status_history: List = []

    class Config:
        orm_mode = True


class StatusHistoryBase(BaseModel):
    """Base model for status history"""
    status: str
    change_reason: Optional[str] = None
    changed_by: Optional[str] = "system"


class StatusHistoryCreate(StatusHistoryBase):
    """Model for creating a status history entry"""
    pass


class StatusHistoryResponse(StatusHistoryBase):
    """Model for status history response"""
    id: int
    claim_id: int
    change_date: datetime

    class Config:
        orm_mode = True


class StatusUpdate(BaseModel):
    """Model for updating claim status"""
    status: str
    reason: Optional[str] = None
    changed_by: Optional[str] = "system"


class ClaimList(BaseModel):
    """Model for list of claims"""
    claims: List[ClaimResponse]
    total: int
    page: int
    size: int


class ErrorResponse(BaseModel):
    """Model for error response"""
    detail: str
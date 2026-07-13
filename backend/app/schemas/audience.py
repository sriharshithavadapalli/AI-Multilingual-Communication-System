from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class AudienceBase(BaseModel):
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    whatsapp_number: Optional[str] = None
    age_group: Optional[str] = None
    gender: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    city: Optional[str] = None
    pincode: Optional[str] = None
    preferred_language: Optional[str] = None
    occupation: Optional[str] = None
    organization: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    tags: Optional[str] = None


class AudienceCreate(AudienceBase):
    pass


class AudienceUpdate(AudienceBase):
    full_name: Optional[str] = None


class AudienceOut(AudienceBase):
    id: int
    total_messages_sent: int
    total_opened: int
    total_clicked: int
    total_responded: int
    created_at: datetime

    class Config:
        from_attributes = True


class BulkImportResult(BaseModel):
    total_rows: int
    imported: int
    skipped: int
    errors: list[str]

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class TemplateBase(BaseModel):
    name: str
    campaign_type: Optional[str] = None
    language: str = "English"
    subject: Optional[str] = None
    body: str


class TemplateCreate(TemplateBase):
    pass


class TemplateOut(TemplateBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

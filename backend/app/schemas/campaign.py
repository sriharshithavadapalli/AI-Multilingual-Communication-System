from datetime import datetime
from typing import Optional, Dict, Any

from pydantic import BaseModel

from app.models.campaign import CampaignType, CampaignStatus


class CampaignCreate(BaseModel):
    title: str
    campaign_type: CampaignType
    message_content: Optional[str] = None
    template_id: Optional[int] = None
    audience_filter: Optional[Dict[str, Any]] = None
    scheduled_at: Optional[datetime] = None


class CampaignUpdate(BaseModel):
    title: Optional[str] = None
    message_content: Optional[str] = None
    template_id: Optional[int] = None
    audience_filter: Optional[Dict[str, Any]] = None
    scheduled_at: Optional[datetime] = None


class CampaignStatusUpdate(BaseModel):
    status: CampaignStatus


class CampaignOut(BaseModel):
    id: int
    title: str
    campaign_type: CampaignType
    status: CampaignStatus
    message_content: Optional[str] = None
    template_id: Optional[int] = None
    audience_filter: Optional[Dict[str, Any]] = None
    audience_count: int
    scheduled_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

"""
Campaign model.
Supports campaign types required by Milestone 1:
  awareness_drive, emergency_alert, educational_notification, organizational_announcement

Status workflow: draft -> review -> scheduled -> sent -> completed  (or cancelled)
"""
import enum
from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, Enum, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base


class CampaignType(str, enum.Enum):
    awareness_drive = "awareness_drive"
    emergency_alert = "emergency_alert"
    educational_notification = "educational_notification"
    organizational_announcement = "organizational_announcement"


class CampaignStatus(str, enum.Enum):
    draft = "draft"
    review = "review"
    scheduled = "scheduled"
    sent = "sent"
    completed = "completed"
    cancelled = "cancelled"


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    campaign_type = Column(Enum(CampaignType), nullable=False)
    status = Column(Enum(CampaignStatus), default=CampaignStatus.draft, nullable=False)

    message_content = Column(Text, nullable=True)          # draft message body
    template_id = Column(Integer, ForeignKey("templates.id"), nullable=True)

    # Segmentation filter snapshot (JSON) - e.g.
    # {"state": "Madhya Pradesh", "preferred_language": "Hindi", "department": "Health"}
    audience_filter = Column(JSON, nullable=True)
    audience_count = Column(Integer, default=0)  # resolved recipient count at creation time

    scheduled_at = Column(DateTime, nullable=True)

    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    created_by = relationship("User")
    template = relationship("Template")

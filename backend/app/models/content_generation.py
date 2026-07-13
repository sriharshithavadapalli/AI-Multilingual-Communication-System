"""
Stores a history of AI-assisted content generation, translation, and analysis
actions so users can review/reuse past drafts. Optionally linked to a Campaign.
"""
from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base


class ContentGeneration(Base):
    __tablename__ = "content_generations"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=True)

    action = Column(String(30), nullable=False)   # generate | translate | analyze | compliance
    language = Column(String(50), nullable=True)  # target language, where relevant

    input_brief = Column(Text, nullable=True)      # what the user asked for
    output_text = Column(Text, nullable=True)       # generated/translated content

    # Structured extras: sentiment label, compliance flags, personalization tokens used, etc.
    meta = Column(JSON, nullable=True)

    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    campaign = relationship("Campaign")
    created_by = relationship("User")

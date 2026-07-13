"""
Reusable communication template / content library model.
"""
from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class Template(Base):
    __tablename__ = "templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    campaign_type = Column(String(50), nullable=True)   # matches CampaignType values
    language = Column(String(50), default="English")
    subject = Column(String(200), nullable=True)         # for email
    body = Column(Text, nullable=False)

    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    created_by = relationship("User")

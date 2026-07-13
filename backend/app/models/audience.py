"""
Audience (recipient) model.
Holds the fields needed for segmentation as per Milestone 1 requirements:
demographics, geography, language preference, occupation, organization hierarchy,
and engagement history (basic counters for now; detailed engagement events
come in Module 3 - Analytics).
"""
from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class Audience(Base):
    __tablename__ = "audience"

    id = Column(Integer, primary_key=True, index=True)

    # Basic identity
    full_name = Column(String(150), nullable=False)
    email = Column(String(150), nullable=True, index=True)
    phone = Column(String(20), nullable=True, index=True)
    whatsapp_number = Column(String(20), nullable=True)

    # Demographics
    age_group = Column(String(20), nullable=True)   # e.g. "18-25", "26-40"
    gender = Column(String(20), nullable=True)

    # Geography
    state = Column(String(100), nullable=True, index=True)
    district = Column(String(100), nullable=True, index=True)
    city = Column(String(100), nullable=True)
    pincode = Column(String(10), nullable=True)

    # Language & occupation
    preferred_language = Column(String(50), nullable=True, index=True)  # Hindi, English, Marathi...
    occupation = Column(String(100), nullable=True)

    # Organization hierarchy
    organization = Column(String(150), nullable=True, index=True)
    department = Column(String(100), nullable=True)
    designation = Column(String(100), nullable=True)

    # Free-form tags for flexible grouping (comma separated, e.g. "farmer,rural,priority")
    tags = Column(String(255), nullable=True)

    # Basic engagement history counters (expanded later in Module 3)
    total_messages_sent = Column(Integer, default=0)
    total_opened = Column(Integer, default=0)
    total_clicked = Column(Integer, default=0)
    total_responded = Column(Integer, default=0)

    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    created_by = relationship("User")

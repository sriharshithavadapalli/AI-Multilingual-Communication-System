"""
User model with role-based access control.

Roles supported (Milestone 1 requirement):
  - admin               : full system access, manages users/roles
  - campaign_manager     : creates/manages campaigns, audience segments
  - communication_team   : executes/sends campaigns, views analytics
"""
import enum
from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, Boolean, Enum

from app.core.database import Base


class RoleEnum(str, enum.Enum):
    admin = "admin"
    campaign_manager = "campaign_manager"
    communication_team = "communication_team"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(RoleEnum), default=RoleEnum.communication_team, nullable=False)
    organization = Column(String(150), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

"""
Campaign creation & management routes.
Handles the draft -> review -> scheduled -> sent -> completed workflow.
Actual multi-channel delivery (Email/SMS/WhatsApp) is implemented in Module 3;
here we only prepare the campaign and resolve/lock-in its target audience segment.
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles
from app.models.campaign import Campaign, CampaignStatus
from app.models.audience import Audience
from app.models.user import User
from app.schemas.campaign import CampaignCreate, CampaignUpdate, CampaignOut, CampaignStatusUpdate

router = APIRouter(prefix="/campaigns", tags=["Campaign Planning"])

MANAGE_ROLES = ["admin", "campaign_manager"]
VIEW_ROLES = ["admin", "campaign_manager", "communication_team"]

# Allowed status transitions
VALID_TRANSITIONS = {
    CampaignStatus.draft: {CampaignStatus.review, CampaignStatus.cancelled},
    CampaignStatus.review: {CampaignStatus.scheduled, CampaignStatus.draft, CampaignStatus.cancelled},
    CampaignStatus.scheduled: {CampaignStatus.sent, CampaignStatus.cancelled},
    CampaignStatus.sent: {CampaignStatus.completed},
    CampaignStatus.completed: set(),
    CampaignStatus.cancelled: set(),
}


def _resolve_audience_count(db: Session, audience_filter: dict) -> int:
    if not audience_filter:
        return db.query(Audience).count()
    q = db.query(Audience)
    for field, value in audience_filter.items():
        if value and hasattr(Audience, field):
            q = q.filter(getattr(Audience, field).ilike(f"%{value}%"))
    return q.count()


@router.post("/", response_model=CampaignOut, status_code=201)
def create_campaign(
    payload: CampaignCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(MANAGE_ROLES)),
):
    audience_count = _resolve_audience_count(db, payload.audience_filter or {})
    campaign = Campaign(
        title=payload.title,
        campaign_type=payload.campaign_type,
        message_content=payload.message_content,
        template_id=payload.template_id,
        audience_filter=payload.audience_filter,
        audience_count=audience_count,
        scheduled_at=payload.scheduled_at,
        created_by_id=current_user.id,
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return campaign


@router.get("/", response_model=List[CampaignOut])
def list_campaigns(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(VIEW_ROLES)),
):
    return db.query(Campaign).order_by(Campaign.created_at.desc()).all()


@router.get("/{campaign_id}", response_model=CampaignOut)
def get_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(VIEW_ROLES)),
):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign


@router.put("/{campaign_id}", response_model=CampaignOut)
def update_campaign(
    campaign_id: int,
    payload: CampaignUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(MANAGE_ROLES)),
):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if campaign.status not in (CampaignStatus.draft, CampaignStatus.review):
        raise HTTPException(status_code=400, detail="Only draft or in-review campaigns can be edited")

    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(campaign, field, value)

    if "audience_filter" in data:
        campaign.audience_count = _resolve_audience_count(db, campaign.audience_filter or {})

    db.commit()
    db.refresh(campaign)
    return campaign


@router.patch("/{campaign_id}/status", response_model=CampaignOut)
def change_campaign_status(
    campaign_id: int,
    payload: CampaignStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(MANAGE_ROLES)),
):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    allowed_next = VALID_TRANSITIONS.get(campaign.status, set())
    if payload.status not in allowed_next:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot transition campaign from '{campaign.status.value}' to '{payload.status.value}'",
        )

    campaign.status = payload.status
    db.commit()
    db.refresh(campaign)
    return campaign


@router.delete("/{campaign_id}", status_code=204)
def delete_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(MANAGE_ROLES)),
):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    db.delete(campaign)
    db.commit()
    return None

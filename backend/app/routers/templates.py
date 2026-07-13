"""
Template / content library routes.
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles
from app.models.template import Template
from app.models.user import User
from app.schemas.template import TemplateCreate, TemplateOut

router = APIRouter(prefix="/templates", tags=["Communication Templates"])

MANAGE_ROLES = ["admin", "campaign_manager"]
VIEW_ROLES = ["admin", "campaign_manager", "communication_team"]


@router.post("/", response_model=TemplateOut, status_code=201)
def create_template(
    payload: TemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(MANAGE_ROLES)),
):
    record = Template(**payload.model_dump(), created_by_id=current_user.id)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/", response_model=List[TemplateOut])
def list_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(VIEW_ROLES)),
):
    return db.query(Template).all()


@router.get("/{template_id}", response_model=TemplateOut)
def get_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(VIEW_ROLES)),
):
    record = db.query(Template).filter(Template.id == template_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Template not found")
    return record


@router.put("/{template_id}", response_model=TemplateOut)
def update_template(
    template_id: int,
    payload: TemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(MANAGE_ROLES)),
):
    record = db.query(Template).filter(Template.id == template_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Template not found")
    for field, value in payload.model_dump().items():
        setattr(record, field, value)
    db.commit()
    db.refresh(record)
    return record


@router.delete("/{template_id}", status_code=204)
def delete_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(MANAGE_ROLES)),
):
    record = db.query(Template).filter(Template.id == template_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Template not found")
    db.delete(record)
    db.commit()
    return None

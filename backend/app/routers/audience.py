"""
Audience management routes: CRUD, bulk CSV/XLSX import, and segmentation filtering.
"""
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles, get_current_user
from app.models.audience import Audience
from app.models.user import User
from app.schemas.audience import AudienceCreate, AudienceUpdate, AudienceOut, BulkImportResult
from app.utils.csv_import import parse_audience_file, dataframe_to_audience_objects

router = APIRouter(prefix="/audience", tags=["Audience Management"])

MANAGE_ROLES = ["admin", "campaign_manager"]
VIEW_ROLES = ["admin", "campaign_manager", "communication_team"]


@router.post("/", response_model=AudienceOut, status_code=201)
def create_audience(
    payload: AudienceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(MANAGE_ROLES)),
):
    record = Audience(**payload.model_dump(), created_by_id=current_user.id)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/", response_model=List[AudienceOut])
def list_audience(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(VIEW_ROLES)),
):
    return db.query(Audience).offset(skip).limit(limit).all()


@router.get("/{audience_id}", response_model=AudienceOut)
def get_audience(
    audience_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(VIEW_ROLES)),
):
    record = db.query(Audience).filter(Audience.id == audience_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Audience record not found")
    return record


@router.put("/{audience_id}", response_model=AudienceOut)
def update_audience(
    audience_id: int,
    payload: AudienceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(MANAGE_ROLES)),
):
    record = db.query(Audience).filter(Audience.id == audience_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Audience record not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(record, field, value)
    db.commit()
    db.refresh(record)
    return record


@router.delete("/{audience_id}", status_code=204)
def delete_audience(
    audience_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(MANAGE_ROLES)),
):
    record = db.query(Audience).filter(Audience.id == audience_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Audience record not found")
    db.delete(record)
    db.commit()
    return None


@router.post("/bulk-import", response_model=BulkImportResult)
async def bulk_import_audience(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(MANAGE_ROLES)),
):
    """
    Upload a CSV or XLSX file to bulk-create audience/recipient records.
    Required column: full_name. Optional: email, phone, whatsapp_number, age_group,
    gender, state, district, city, pincode, preferred_language, occupation,
    organization, department, designation, tags.
    """
    content = await file.read()
    try:
        df, warnings = parse_audience_file(file.filename, content)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    objects, row_errors = dataframe_to_audience_objects(df, created_by_id=current_user.id)

    db.add_all(objects)
    db.commit()

    return BulkImportResult(
        total_rows=len(df),
        imported=len(objects),
        skipped=len(row_errors),
        errors=warnings + row_errors,
    )


@router.get("/segment/query", response_model=List[AudienceOut])
def segment_audience(
    state: Optional[str] = None,
    district: Optional[str] = None,
    preferred_language: Optional[str] = None,
    occupation: Optional[str] = None,
    organization: Optional[str] = None,
    department: Optional[str] = None,
    age_group: Optional[str] = None,
    gender: Optional[str] = None,
    tag: Optional[str] = Query(None, description="Match records containing this tag"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(VIEW_ROLES)),
):
    """
    Audience segmentation filter — combine any number of criteria.
    This is the core query used by Campaign creation to resolve a target segment.
    """
    q = db.query(Audience)
    if state:
        q = q.filter(Audience.state.ilike(f"%{state}%"))
    if district:
        q = q.filter(Audience.district.ilike(f"%{district}%"))
    if preferred_language:
        q = q.filter(Audience.preferred_language.ilike(f"%{preferred_language}%"))
    if occupation:
        q = q.filter(Audience.occupation.ilike(f"%{occupation}%"))
    if organization:
        q = q.filter(Audience.organization.ilike(f"%{organization}%"))
    if department:
        q = q.filter(Audience.department.ilike(f"%{department}%"))
    if age_group:
        q = q.filter(Audience.age_group == age_group)
    if gender:
        q = q.filter(Audience.gender == gender)
    if tag:
        q = q.filter(Audience.tags.ilike(f"%{tag}%"))

    return q.all()


@router.get("/segment/count")
def segment_count(
    state: Optional[str] = None,
    district: Optional[str] = None,
    preferred_language: Optional[str] = None,
    occupation: Optional[str] = None,
    organization: Optional[str] = None,
    department: Optional[str] = None,
    age_group: Optional[str] = None,
    gender: Optional[str] = None,
    tag: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(VIEW_ROLES)),
):
    """Returns just the resolved recipient count for a given filter — used live in the
    campaign creation UI so users see audience size before saving."""
    results = segment_audience(
        state, district, preferred_language, occupation, organization,
        department, age_group, gender, tag, db, current_user,
    )
    return {"count": len(results)}

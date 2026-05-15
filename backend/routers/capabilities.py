from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import csv
import io
from fastapi.responses import StreamingResponse

from database import get_db
import models
import schemas

router = APIRouter(prefix="/api/capabilities", tags=["capabilities"])


def get_capability_or_404(cap_id: int, db: Session) -> models.BusinessCapability:
    cap = db.query(models.BusinessCapability).filter(models.BusinessCapability.id == cap_id).first()
    if not cap:
        raise HTTPException(status_code=404, detail="Business capability not found")
    return cap


@router.get("", response_model=List[schemas.BusinessCapabilityRead])
def list_capabilities(
    search: Optional[str] = Query(None),
    level: Optional[int] = Query(None),
    parent_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(models.BusinessCapability)
    if search:
        query = query.filter(
            models.BusinessCapability.name.ilike(f"%{search}%") |
            models.BusinessCapability.description.ilike(f"%{search}%")
        )
    if level is not None:
        query = query.filter(models.BusinessCapability.level == level)
    if parent_id is not None:
        query = query.filter(models.BusinessCapability.parent_id == parent_id)
    caps = query.order_by(models.BusinessCapability.level, models.BusinessCapability.name).all()
    return caps


@router.get("/tree", response_model=List[schemas.BusinessCapabilityRead])
def get_capability_tree(db: Session = Depends(get_db)):
    """Return only root-level capabilities with children nested."""
    roots = db.query(models.BusinessCapability).filter(
        models.BusinessCapability.parent_id == None
    ).order_by(models.BusinessCapability.name).all()
    return roots


@router.post("", response_model=schemas.BusinessCapabilityRead, status_code=201)
def create_capability(payload: schemas.BusinessCapabilityCreate, db: Session = Depends(get_db)):
    cap = models.BusinessCapability(**payload.model_dump())
    db.add(cap)
    db.commit()
    db.refresh(cap)
    return cap


@router.get("/export", response_class=StreamingResponse)
def export_capabilities(db: Session = Depends(get_db)):
    caps = db.query(models.BusinessCapability).order_by(
        models.BusinessCapability.level, models.BusinessCapability.name
    ).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "name", "description", "level", "parent_id", "owner", "tags"])
    for c in caps:
        writer.writerow([c.id, c.name, c.description, c.level, c.parent_id, c.owner, c.tags])
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=capabilities.csv"},
    )


@router.get("/{cap_id}", response_model=schemas.BusinessCapabilityRead)
def get_capability(cap_id: int, db: Session = Depends(get_db)):
    return get_capability_or_404(cap_id, db)


@router.put("/{cap_id}", response_model=schemas.BusinessCapabilityRead)
def update_capability(cap_id: int, payload: schemas.BusinessCapabilityUpdate, db: Session = Depends(get_db)):
    cap = get_capability_or_404(cap_id, db)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(cap, key, value)
    db.commit()
    db.refresh(cap)
    return cap


@router.delete("/{cap_id}", status_code=204)
def delete_capability(cap_id: int, db: Session = Depends(get_db)):
    cap = get_capability_or_404(cap_id, db)
    db.delete(cap)
    db.commit()

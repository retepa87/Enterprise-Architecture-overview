from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import csv
import io
from fastapi.responses import StreamingResponse

from database import get_db
import models
import schemas

router = APIRouter(prefix="/api/tech-components", tags=["tech_components"])


def get_tech_or_404(tech_id: int, db: Session) -> models.TechnologyComponent:
    tech = db.query(models.TechnologyComponent).filter(models.TechnologyComponent.id == tech_id).first()
    if not tech:
        raise HTTPException(status_code=404, detail="Technology component not found")
    return tech


@router.get("", response_model=List[schemas.TechnologyComponentRead])
def list_tech_components(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    component_type: Optional[str] = Query(None),
    vendor: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(models.TechnologyComponent)
    if search:
        query = query.filter(
            models.TechnologyComponent.name.ilike(f"%{search}%") |
            models.TechnologyComponent.description.ilike(f"%{search}%") |
            models.TechnologyComponent.vendor.ilike(f"%{search}%")
        )
    if status:
        query = query.filter(models.TechnologyComponent.status == status)
    if component_type:
        query = query.filter(models.TechnologyComponent.component_type == component_type)
    if vendor:
        query = query.filter(models.TechnologyComponent.vendor.ilike(f"%{vendor}%"))
    techs = query.order_by(models.TechnologyComponent.name).all()
    return techs


@router.post("", response_model=schemas.TechnologyComponentRead, status_code=201)
def create_tech_component(payload: schemas.TechnologyComponentCreate, db: Session = Depends(get_db)):
    tech = models.TechnologyComponent(**payload.model_dump())
    db.add(tech)
    db.commit()
    db.refresh(tech)
    return tech


@router.get("/export", response_class=StreamingResponse)
def export_tech_components(db: Session = Depends(get_db)):
    techs = db.query(models.TechnologyComponent).order_by(models.TechnologyComponent.name).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "name", "component_type", "vendor", "version", "status", "description", "tags"])
    for t in techs:
        writer.writerow([t.id, t.name, t.component_type, t.vendor, t.version, t.status, t.description, t.tags])
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=tech_components.csv"},
    )


@router.get("/{tech_id}", response_model=schemas.TechnologyComponentRead)
def get_tech_component(tech_id: int, db: Session = Depends(get_db)):
    return get_tech_or_404(tech_id, db)


@router.put("/{tech_id}", response_model=schemas.TechnologyComponentRead)
def update_tech_component(tech_id: int, payload: schemas.TechnologyComponentUpdate, db: Session = Depends(get_db)):
    tech = get_tech_or_404(tech_id, db)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(tech, key, value)
    db.commit()
    db.refresh(tech)
    return tech


@router.delete("/{tech_id}", status_code=204)
def delete_tech_component(tech_id: int, db: Session = Depends(get_db)):
    tech = get_tech_or_404(tech_id, db)
    db.delete(tech)
    db.commit()

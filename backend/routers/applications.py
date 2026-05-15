from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import csv
import io
from fastapi.responses import StreamingResponse

from database import get_db
import models
import schemas

router = APIRouter(prefix="/api/applications", tags=["applications"])


def get_application_or_404(app_id: int, db: Session) -> models.Application:
    app = db.query(models.Application).filter(models.Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app


@router.get("", response_model=List[schemas.ApplicationRead])
def list_applications(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    owner: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(models.Application)
    if search:
        query = query.filter(
            models.Application.name.ilike(f"%{search}%") |
            models.Application.description.ilike(f"%{search}%") |
            models.Application.owner.ilike(f"%{search}%")
        )
    if status:
        query = query.filter(models.Application.status == status)
    if owner:
        query = query.filter(models.Application.owner.ilike(f"%{owner}%"))
    apps = query.order_by(models.Application.name).all()
    return [schemas.ApplicationRead.from_orm_with_ids(a) for a in apps]


@router.post("", response_model=schemas.ApplicationRead, status_code=201)
def create_application(payload: schemas.ApplicationCreate, db: Session = Depends(get_db)):
    app = models.Application(
        name=payload.name,
        description=payload.description,
        status=payload.status,
        lifecycle=payload.lifecycle,
        owner=payload.owner,
        tags=payload.tags,
    )
    if payload.capability_ids:
        caps = db.query(models.BusinessCapability).filter(
            models.BusinessCapability.id.in_(payload.capability_ids)
        ).all()
        app.capabilities = caps
    if payload.domain_ids:
        domains = db.query(models.BusinessDomain).filter(
            models.BusinessDomain.id.in_(payload.domain_ids)
        ).all()
        app.domains = domains
    db.add(app)
    db.commit()
    db.refresh(app)
    return schemas.ApplicationRead.from_orm_with_ids(app)


@router.get("/export", response_class=StreamingResponse)
def export_applications(db: Session = Depends(get_db)):
    apps = db.query(models.Application).order_by(models.Application.name).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "name", "description", "status", "lifecycle", "owner", "tags"])
    for a in apps:
        writer.writerow([a.id, a.name, a.description, a.status, a.lifecycle, a.owner, a.tags])
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=applications.csv"},
    )


@router.get("/{app_id}", response_model=schemas.ApplicationRead)
def get_application(app_id: int, db: Session = Depends(get_db)):
    app = get_application_or_404(app_id, db)
    return schemas.ApplicationRead.from_orm_with_ids(app)


@router.put("/{app_id}", response_model=schemas.ApplicationRead)
def update_application(app_id: int, payload: schemas.ApplicationUpdate, db: Session = Depends(get_db)):
    app = get_application_or_404(app_id, db)
    update_data = payload.model_dump(exclude_unset=True)
    capability_ids = update_data.pop("capability_ids", None)
    domain_ids = update_data.pop("domain_ids", None)
    for key, value in update_data.items():
        setattr(app, key, value)
    if capability_ids is not None:
        caps = db.query(models.BusinessCapability).filter(
            models.BusinessCapability.id.in_(capability_ids)
        ).all()
        app.capabilities = caps
    if domain_ids is not None:
        domains = db.query(models.BusinessDomain).filter(
            models.BusinessDomain.id.in_(domain_ids)
        ).all()
        app.domains = domains
    db.commit()
    db.refresh(app)
    return schemas.ApplicationRead.from_orm_with_ids(app)


@router.delete("/{app_id}", status_code=204)
def delete_application(app_id: int, db: Session = Depends(get_db)):
    app = get_application_or_404(app_id, db)
    db.delete(app)
    db.commit()

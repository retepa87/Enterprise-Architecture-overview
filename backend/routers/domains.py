from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import csv
import io
from fastapi.responses import StreamingResponse

from database import get_db
import models
import schemas

router = APIRouter(prefix="/api/domains", tags=["domains"])


def get_domain_or_404(domain_id: int, db: Session) -> models.BusinessDomain:
    domain = db.query(models.BusinessDomain).filter(models.BusinessDomain.id == domain_id).first()
    if not domain:
        raise HTTPException(status_code=404, detail="Business domain not found")
    return domain


@router.get("", response_model=List[schemas.BusinessDomainRead])
def list_domains(
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(models.BusinessDomain)
    if search:
        query = query.filter(
            models.BusinessDomain.name.ilike(f"%{search}%") |
            models.BusinessDomain.description.ilike(f"%{search}%")
        )
    return query.order_by(models.BusinessDomain.name).all()


@router.post("", response_model=schemas.BusinessDomainRead, status_code=201)
def create_domain(payload: schemas.BusinessDomainCreate, db: Session = Depends(get_db)):
    domain = models.BusinessDomain(**payload.model_dump())
    db.add(domain)
    db.commit()
    db.refresh(domain)
    return domain


@router.get("/export", response_class=StreamingResponse)
def export_domains(db: Session = Depends(get_db)):
    domains = db.query(models.BusinessDomain).order_by(models.BusinessDomain.name).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "name", "description", "owner", "tags"])
    for d in domains:
        writer.writerow([d.id, d.name, d.description, d.owner, d.tags])
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=domains.csv"},
    )


@router.get("/{domain_id}", response_model=schemas.BusinessDomainRead)
def get_domain(domain_id: int, db: Session = Depends(get_db)):
    return get_domain_or_404(domain_id, db)


@router.put("/{domain_id}", response_model=schemas.BusinessDomainRead)
def update_domain(domain_id: int, payload: schemas.BusinessDomainUpdate, db: Session = Depends(get_db)):
    domain = get_domain_or_404(domain_id, db)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(domain, key, value)
    db.commit()
    db.refresh(domain)
    return domain


@router.delete("/{domain_id}", status_code=204)
def delete_domain(domain_id: int, db: Session = Depends(get_db)):
    domain = get_domain_or_404(domain_id, db)
    db.delete(domain)
    db.commit()

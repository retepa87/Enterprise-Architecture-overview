from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import csv
import io
from fastapi.responses import StreamingResponse

from database import get_db
import models
import schemas

router = APIRouter(prefix="/api/crc-cards", tags=["crc_cards"])


def get_crc_or_404(crc_id: int, db: Session) -> models.CRCCard:
    crc = db.query(models.CRCCard).filter(models.CRCCard.id == crc_id).first()
    if not crc:
        raise HTTPException(status_code=404, detail="CRC card not found")
    return crc


@router.get("", response_model=List[schemas.CRCCardRead])
def list_crc_cards(
    search: Optional[str] = Query(None),
    component_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(models.CRCCard)
    if search:
        query = query.filter(
            models.CRCCard.component_name.ilike(f"%{search}%") |
            models.CRCCard.notes.ilike(f"%{search}%")
        )
    if component_type:
        query = query.filter(models.CRCCard.component_type == component_type)
    cards = query.order_by(models.CRCCard.component_name).all()
    return [schemas.CRCCardRead.from_orm_with_ids(c) for c in cards]


@router.post("", response_model=schemas.CRCCardRead, status_code=201)
def create_crc_card(payload: schemas.CRCCardCreate, db: Session = Depends(get_db)):
    card = models.CRCCard(
        component_name=payload.component_name,
        component_type=payload.component_type,
        responsibilities=payload.responsibilities,
        collaborators=payload.collaborators,
        notes=payload.notes,
        tags=payload.tags,
    )
    if payload.linked_application_ids:
        apps = db.query(models.Application).filter(
            models.Application.id.in_(payload.linked_application_ids)
        ).all()
        card.linked_applications = apps
    if payload.linked_tech_component_ids:
        techs = db.query(models.TechnologyComponent).filter(
            models.TechnologyComponent.id.in_(payload.linked_tech_component_ids)
        ).all()
        card.linked_tech_components = techs
    db.add(card)
    db.commit()
    db.refresh(card)
    return schemas.CRCCardRead.from_orm_with_ids(card)


@router.get("/export", response_class=StreamingResponse)
def export_crc_cards(db: Session = Depends(get_db)):
    cards = db.query(models.CRCCard).order_by(models.CRCCard.component_name).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "component_name", "component_type", "responsibilities", "collaborators", "notes", "tags"])
    for c in cards:
        writer.writerow([c.id, c.component_name, c.component_type, c.responsibilities, c.collaborators, c.notes, c.tags])
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=crc_cards.csv"},
    )


@router.get("/{crc_id}", response_model=schemas.CRCCardRead)
def get_crc_card(crc_id: int, db: Session = Depends(get_db)):
    card = get_crc_or_404(crc_id, db)
    return schemas.CRCCardRead.from_orm_with_ids(card)


@router.put("/{crc_id}", response_model=schemas.CRCCardRead)
def update_crc_card(crc_id: int, payload: schemas.CRCCardUpdate, db: Session = Depends(get_db)):
    card = get_crc_or_404(crc_id, db)
    update_data = payload.model_dump(exclude_unset=True)
    linked_application_ids = update_data.pop("linked_application_ids", None)
    linked_tech_component_ids = update_data.pop("linked_tech_component_ids", None)
    for key, value in update_data.items():
        setattr(card, key, value)
    if linked_application_ids is not None:
        apps = db.query(models.Application).filter(
            models.Application.id.in_(linked_application_ids)
        ).all()
        card.linked_applications = apps
    if linked_tech_component_ids is not None:
        techs = db.query(models.TechnologyComponent).filter(
            models.TechnologyComponent.id.in_(linked_tech_component_ids)
        ).all()
        card.linked_tech_components = techs
    db.commit()
    db.refresh(card)
    return schemas.CRCCardRead.from_orm_with_ids(card)


@router.delete("/{crc_id}", status_code=204)
def delete_crc_card(crc_id: int, db: Session = Depends(get_db)):
    card = get_crc_or_404(crc_id, db)
    db.delete(card)
    db.commit()

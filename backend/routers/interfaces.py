from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import csv
import io
from fastapi.responses import StreamingResponse

from database import get_db
import models
import schemas

router = APIRouter(prefix="/api/interfaces", tags=["interfaces"])


def get_interface_or_404(iface_id: int, db: Session) -> models.Interface:
    iface = db.query(models.Interface).filter(models.Interface.id == iface_id).first()
    if not iface:
        raise HTTPException(status_code=404, detail="Interface not found")
    return iface


@router.get("", response_model=List[schemas.InterfaceRead])
def list_interfaces(
    search: Optional[str] = Query(None),
    source_id: Optional[int] = Query(None),
    target_id: Optional[int] = Query(None),
    protocol: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(models.Interface)
    if search:
        query = query.filter(
            models.Interface.name.ilike(f"%{search}%") |
            models.Interface.description.ilike(f"%{search}%")
        )
    if source_id is not None:
        query = query.filter(models.Interface.source_id == source_id)
    if target_id is not None:
        query = query.filter(models.Interface.target_id == target_id)
    if protocol:
        query = query.filter(models.Interface.protocol.ilike(f"%{protocol}%"))
    ifaces = query.order_by(models.Interface.name).all()
    return [schemas.InterfaceRead.from_orm_with_names(i) for i in ifaces]


@router.post("", response_model=schemas.InterfaceRead, status_code=201)
def create_interface(payload: schemas.InterfaceCreate, db: Session = Depends(get_db)):
    iface = models.Interface(**payload.model_dump())
    db.add(iface)
    db.commit()
    db.refresh(iface)
    return schemas.InterfaceRead.from_orm_with_names(iface)


@router.get("/export", response_class=StreamingResponse)
def export_interfaces(db: Session = Depends(get_db)):
    ifaces = db.query(models.Interface).order_by(models.Interface.name).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "name", "source_id", "source_name", "target_id", "target_name",
                     "protocol", "frequency", "data_classification", "description", "tags"])
    for i in ifaces:
        writer.writerow([
            i.id, i.name,
            i.source_id, i.source_app.name if i.source_app else "",
            i.target_id, i.target_app.name if i.target_app else "",
            i.protocol, i.frequency, i.data_classification, i.description, i.tags
        ])
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=interfaces.csv"},
    )


@router.get("/{iface_id}", response_model=schemas.InterfaceRead)
def get_interface(iface_id: int, db: Session = Depends(get_db)):
    iface = get_interface_or_404(iface_id, db)
    return schemas.InterfaceRead.from_orm_with_names(iface)


@router.put("/{iface_id}", response_model=schemas.InterfaceRead)
def update_interface(iface_id: int, payload: schemas.InterfaceUpdate, db: Session = Depends(get_db)):
    iface = get_interface_or_404(iface_id, db)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(iface, key, value)
    db.commit()
    db.refresh(iface)
    return schemas.InterfaceRead.from_orm_with_names(iface)


@router.delete("/{iface_id}", status_code=204)
def delete_interface(iface_id: int, db: Session = Depends(get_db)):
    iface = get_interface_or_404(iface_id, db)
    db.delete(iface)
    db.commit()

from fastapi import FastAPI, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Optional
from collections import Counter

from database import engine, get_db
import models
import schemas
from routers import applications, capabilities, tech_components, interfaces, domains, crc_cards

# Create all tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Enterprise Architecture Tool", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(applications.router)
app.include_router(capabilities.router)
app.include_router(tech_components.router)
app.include_router(interfaces.router)
app.include_router(domains.router)
app.include_router(crc_cards.router)


@app.get("/api/dashboard", response_model=schemas.DashboardStats)
def get_dashboard(db: Session = Depends(get_db)):
    total_applications = db.query(models.Application).count()
    total_capabilities = db.query(models.BusinessCapability).count()
    total_tech_components = db.query(models.TechnologyComponent).count()
    total_interfaces = db.query(models.Interface).count()
    total_domains = db.query(models.BusinessDomain).count()
    total_crc_cards = db.query(models.CRCCard).count()

    app_statuses = db.query(models.Application.status).all()
    applications_by_status = dict(Counter(s[0] for s in app_statuses))

    tech_statuses = db.query(models.TechnologyComponent.status).all()
    tech_components_by_status = dict(Counter(s[0] for s in tech_statuses))

    return schemas.DashboardStats(
        total_applications=total_applications,
        total_capabilities=total_capabilities,
        total_tech_components=total_tech_components,
        total_interfaces=total_interfaces,
        total_domains=total_domains,
        total_crc_cards=total_crc_cards,
        applications_by_status=applications_by_status,
        tech_components_by_status=tech_components_by_status,
    )


@app.get("/api/search")
def global_search(q: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    results = []

    apps = db.query(models.Application).filter(
        models.Application.name.ilike(f"%{q}%") |
        models.Application.description.ilike(f"%{q}%") |
        models.Application.owner.ilike(f"%{q}%")
    ).limit(10).all()
    for a in apps:
        results.append({"type": "application", "id": a.id, "name": a.name, "description": a.description})

    caps = db.query(models.BusinessCapability).filter(
        models.BusinessCapability.name.ilike(f"%{q}%") |
        models.BusinessCapability.description.ilike(f"%{q}%")
    ).limit(10).all()
    for c in caps:
        results.append({"type": "capability", "id": c.id, "name": c.name, "description": c.description})

    techs = db.query(models.TechnologyComponent).filter(
        models.TechnologyComponent.name.ilike(f"%{q}%") |
        models.TechnologyComponent.description.ilike(f"%{q}%") |
        models.TechnologyComponent.vendor.ilike(f"%{q}%")
    ).limit(10).all()
    for t in techs:
        results.append({"type": "tech_component", "id": t.id, "name": t.name, "description": t.description})

    ifaces = db.query(models.Interface).filter(
        models.Interface.name.ilike(f"%{q}%") |
        models.Interface.description.ilike(f"%{q}%")
    ).limit(10).all()
    for i in ifaces:
        results.append({"type": "interface", "id": i.id, "name": i.name, "description": i.description})

    domains = db.query(models.BusinessDomain).filter(
        models.BusinessDomain.name.ilike(f"%{q}%") |
        models.BusinessDomain.description.ilike(f"%{q}%")
    ).limit(10).all()
    for d in domains:
        results.append({"type": "domain", "id": d.id, "name": d.name, "description": d.description})

    crcs = db.query(models.CRCCard).filter(
        models.CRCCard.component_name.ilike(f"%{q}%") |
        models.CRCCard.notes.ilike(f"%{q}%")
    ).limit(10).all()
    for c in crcs:
        results.append({"type": "crc_card", "id": c.id, "name": c.component_name, "description": c.notes})

    return {"query": q, "results": results}


@app.get("/health")
def health():
    return {"status": "ok"}

from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


# ─── Application ─────────────────────────────────────────────────────────────

class ApplicationBase(BaseModel):
    name: str
    description: Optional[str] = None
    status: str = "active"
    lifecycle: Optional[str] = None
    owner: Optional[str] = None
    tags: Optional[str] = None  # JSON string


class ApplicationCreate(ApplicationBase):
    capability_ids: Optional[List[int]] = []
    domain_ids: Optional[List[int]] = []


class ApplicationUpdate(ApplicationBase):
    name: Optional[str] = None
    status: Optional[str] = None
    capability_ids: Optional[List[int]] = None
    domain_ids: Optional[List[int]] = None


class ApplicationRead(ApplicationBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    capability_ids: Optional[List[int]] = []
    domain_ids: Optional[List[int]] = []

    @classmethod
    def from_orm_with_ids(cls, obj):
        data = {
            "id": obj.id,
            "name": obj.name,
            "description": obj.description,
            "status": obj.status,
            "lifecycle": obj.lifecycle,
            "owner": obj.owner,
            "tags": obj.tags,
            "created_at": obj.created_at,
            "updated_at": obj.updated_at,
            "capability_ids": [c.id for c in obj.capabilities],
            "domain_ids": [d.id for d in obj.domains],
        }
        return cls(**data)


# ─── BusinessCapability ───────────────────────────────────────────────────────

class BusinessCapabilityBase(BaseModel):
    name: str
    description: Optional[str] = None
    level: int = 1
    parent_id: Optional[int] = None
    owner: Optional[str] = None
    tags: Optional[str] = None


class BusinessCapabilityCreate(BusinessCapabilityBase):
    pass


class BusinessCapabilityUpdate(BusinessCapabilityBase):
    name: Optional[str] = None
    level: Optional[int] = None


class BusinessCapabilityRead(BusinessCapabilityBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    children: Optional[List["BusinessCapabilityRead"]] = []


BusinessCapabilityRead.model_rebuild()


# ─── TechnologyComponent ──────────────────────────────────────────────────────

class TechnologyComponentBase(BaseModel):
    name: str
    component_type: str
    vendor: Optional[str] = None
    version: Optional[str] = None
    status: str = "adopt"
    description: Optional[str] = None
    tags: Optional[str] = None


class TechnologyComponentCreate(TechnologyComponentBase):
    pass


class TechnologyComponentUpdate(TechnologyComponentBase):
    name: Optional[str] = None
    component_type: Optional[str] = None
    status: Optional[str] = None


class TechnologyComponentRead(TechnologyComponentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ─── Interface ────────────────────────────────────────────────────────────────

class InterfaceBase(BaseModel):
    name: str
    source_id: Optional[int] = None
    target_id: Optional[int] = None
    protocol: Optional[str] = None
    frequency: Optional[str] = None
    data_classification: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[str] = None


class InterfaceCreate(InterfaceBase):
    pass


class InterfaceUpdate(InterfaceBase):
    name: Optional[str] = None


class InterfaceRead(InterfaceBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    source_name: Optional[str] = None
    target_name: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @classmethod
    def from_orm_with_names(cls, obj):
        data = {
            "id": obj.id,
            "name": obj.name,
            "source_id": obj.source_id,
            "target_id": obj.target_id,
            "protocol": obj.protocol,
            "frequency": obj.frequency,
            "data_classification": obj.data_classification,
            "description": obj.description,
            "tags": obj.tags,
            "created_at": obj.created_at,
            "updated_at": obj.updated_at,
            "source_name": obj.source_app.name if obj.source_app else None,
            "target_name": obj.target_app.name if obj.target_app else None,
        }
        return cls(**data)


# ─── BusinessDomain ───────────────────────────────────────────────────────────

class BusinessDomainBase(BaseModel):
    name: str
    description: Optional[str] = None
    owner: Optional[str] = None
    tags: Optional[str] = None


class BusinessDomainCreate(BusinessDomainBase):
    pass


class BusinessDomainUpdate(BusinessDomainBase):
    name: Optional[str] = None


class BusinessDomainRead(BusinessDomainBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ─── Relationship ─────────────────────────────────────────────────────────────

class RelationshipBase(BaseModel):
    name: Optional[str] = None
    source_type: str
    source_id: int
    target_type: str
    target_id: int
    relationship_type: Optional[str] = None
    description: Optional[str] = None


class RelationshipCreate(RelationshipBase):
    pass


class RelationshipUpdate(RelationshipBase):
    source_type: Optional[str] = None
    source_id: Optional[int] = None
    target_type: Optional[str] = None
    target_id: Optional[int] = None


class RelationshipRead(RelationshipBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ─── CRC Card ─────────────────────────────────────────────────────────────────

class CRCCardBase(BaseModel):
    component_name: str
    component_type: str
    responsibilities: Optional[str] = None  # JSON string list
    collaborators: Optional[str] = None  # JSON string list
    notes: Optional[str] = None
    tags: Optional[str] = None


class CRCCardCreate(CRCCardBase):
    linked_application_ids: Optional[List[int]] = []
    linked_tech_component_ids: Optional[List[int]] = []


class CRCCardUpdate(CRCCardBase):
    component_name: Optional[str] = None
    component_type: Optional[str] = None
    linked_application_ids: Optional[List[int]] = None
    linked_tech_component_ids: Optional[List[int]] = None


class CRCCardRead(CRCCardBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    linked_application_ids: Optional[List[int]] = []
    linked_tech_component_ids: Optional[List[int]] = []

    @classmethod
    def from_orm_with_ids(cls, obj):
        data = {
            "id": obj.id,
            "component_name": obj.component_name,
            "component_type": obj.component_type,
            "responsibilities": obj.responsibilities,
            "collaborators": obj.collaborators,
            "notes": obj.notes,
            "tags": obj.tags,
            "created_at": obj.created_at,
            "updated_at": obj.updated_at,
            "linked_application_ids": [a.id for a in obj.linked_applications],
            "linked_tech_component_ids": [t.id for t in obj.linked_tech_components],
        }
        return cls(**data)


# ─── Dashboard ────────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_applications: int
    total_capabilities: int
    total_tech_components: int
    total_interfaces: int
    total_domains: int
    total_crc_cards: int
    applications_by_status: dict
    tech_components_by_status: dict

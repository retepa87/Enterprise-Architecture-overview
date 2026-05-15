from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Table, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database import Base

# Association table for Application <-> BusinessCapability
app_capability_association = Table(
    "app_capability",
    Base.metadata,
    Column("application_id", Integer, ForeignKey("applications.id"), primary_key=True),
    Column("capability_id", Integer, ForeignKey("business_capabilities.id"), primary_key=True),
)

# Association table for Application <-> BusinessDomain
app_domain_association = Table(
    "app_domain",
    Base.metadata,
    Column("application_id", Integer, ForeignKey("applications.id"), primary_key=True),
    Column("domain_id", Integer, ForeignKey("business_domains.id"), primary_key=True),
)

# Association table for CRCCard <-> Application
crc_application_association = Table(
    "crc_application",
    Base.metadata,
    Column("crc_card_id", Integer, ForeignKey("crc_cards.id"), primary_key=True),
    Column("application_id", Integer, ForeignKey("applications.id"), primary_key=True),
)

# Association table for CRCCard <-> TechComponent
crc_tech_association = Table(
    "crc_tech",
    Base.metadata,
    Column("crc_card_id", Integer, ForeignKey("crc_cards.id"), primary_key=True),
    Column("tech_component_id", Integer, ForeignKey("technology_components.id"), primary_key=True),
)


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, default="active")  # active, sunset, planned
    lifecycle = Column(String(100), nullable=True)
    owner = Column(String(255), nullable=True)
    tags = Column(Text, nullable=True)  # JSON-encoded list
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    capabilities = relationship("BusinessCapability", secondary=app_capability_association, back_populates="applications")
    domains = relationship("BusinessDomain", secondary=app_domain_association, back_populates="applications")
    source_interfaces = relationship("Interface", foreign_keys="Interface.source_id", back_populates="source_app")
    target_interfaces = relationship("Interface", foreign_keys="Interface.target_id", back_populates="target_app")
    crc_cards = relationship("CRCCard", secondary=crc_application_association, back_populates="linked_applications")


class BusinessCapability(Base):
    __tablename__ = "business_capabilities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    level = Column(Integer, nullable=False, default=1)  # 1, 2, or 3
    parent_id = Column(Integer, ForeignKey("business_capabilities.id"), nullable=True)
    owner = Column(String(255), nullable=True)
    tags = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    parent = relationship("BusinessCapability", remote_side="BusinessCapability.id", back_populates="children")
    children = relationship("BusinessCapability", back_populates="parent")
    applications = relationship("Application", secondary=app_capability_association, back_populates="capabilities")


class TechnologyComponent(Base):
    __tablename__ = "technology_components"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    component_type = Column(String(100), nullable=False)  # database, middleware, platform, service
    vendor = Column(String(255), nullable=True)
    version = Column(String(100), nullable=True)
    status = Column(String(50), nullable=False, default="adopt")  # adopt, trial, assess, hold
    description = Column(Text, nullable=True)
    tags = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    crc_cards = relationship("CRCCard", secondary=crc_tech_association, back_populates="linked_tech_components")


class Interface(Base):
    __tablename__ = "interfaces"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    source_id = Column(Integer, ForeignKey("applications.id"), nullable=True)
    target_id = Column(Integer, ForeignKey("applications.id"), nullable=True)
    protocol = Column(String(100), nullable=True)  # REST, SOAP, gRPC, MQ, etc.
    frequency = Column(String(100), nullable=True)  # real-time, batch, event-driven
    data_classification = Column(String(100), nullable=True)  # public, internal, confidential, restricted
    description = Column(Text, nullable=True)
    tags = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    source_app = relationship("Application", foreign_keys=[source_id], back_populates="source_interfaces")
    target_app = relationship("Application", foreign_keys=[target_id], back_populates="target_interfaces")


class BusinessDomain(Base):
    __tablename__ = "business_domains"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    owner = Column(String(255), nullable=True)
    tags = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    applications = relationship("Application", secondary=app_domain_association, back_populates="domains")


class Relationship(Base):
    __tablename__ = "relationships"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=True)
    source_type = Column(String(100), nullable=False)  # application, capability, tech_component, domain
    source_id = Column(Integer, nullable=False)
    target_type = Column(String(100), nullable=False)
    target_id = Column(Integer, nullable=False)
    relationship_type = Column(String(100), nullable=True)  # depends-on, uses, contains, etc.
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class CRCCard(Base):
    __tablename__ = "crc_cards"

    id = Column(Integer, primary_key=True, index=True)
    component_name = Column(String(255), nullable=False, index=True)
    component_type = Column(String(100), nullable=False)  # application, capability, service
    responsibilities = Column(Text, nullable=True)  # JSON-encoded list
    collaborators = Column(Text, nullable=True)  # JSON-encoded list
    notes = Column(Text, nullable=True)
    tags = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    linked_applications = relationship("Application", secondary=crc_application_association, back_populates="crc_cards")
    linked_tech_components = relationship("TechnologyComponent", secondary=crc_tech_association, back_populates="crc_cards")

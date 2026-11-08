from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base, utc_now

class Person(Base):
    __tablename__ = "persons"

    id = Column(Integer, primary_key=True, index=True)
    person_code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(150), index=True, nullable=False)
    aliases = Column(String(255), nullable=True) # comma separated or JSON string
    date_of_birth = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

class Phone(Base):
    __tablename__ = "phones"

    id = Column(Integer, primary_key=True, index=True)
    phone_code = Column(String(50), unique=True, index=True, nullable=False)
    masked_number = Column(String(50), index=True, nullable=False)
    owner_person_id = Column(Integer, ForeignKey("persons.id", ondelete="SET NULL"), nullable=True)

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_code = Column(String(50), unique=True, index=True, nullable=False)
    registration_number = Column(String(50), index=True, nullable=False)
    vehicle_type = Column(String(50), default="CAR")
    owner_person_id = Column(Integer, ForeignKey("persons.id", ondelete="SET NULL"), nullable=True)

class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    location_code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(150), index=True, nullable=False)
    address = Column(Text, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    organization_code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(150), index=True, nullable=False)
    type = Column(String(50), nullable=True)

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_code = Column(String(50), unique=True, index=True, nullable=False)
    sender_entity = Column(String(100), nullable=False)
    receiver_entity = Column(String(100), nullable=False)
    amount = Column(Float, nullable=False)
    transaction_type = Column(String(50), default="WIRE_TRANSFER")
    timestamp = Column(DateTime, default=utc_now, index=True)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="SET NULL"), nullable=True)
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=True)

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    document_code = Column(String(50), unique=True, index=True, nullable=False)
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(255), nullable=False)
    document_type = Column(String(50), default="FIR_REPORT") # FIR, CDR, BANK_RECORD, etc.
    extracted_text = Column(Text, nullable=True)
    sha256_hash = Column(String(64), index=True, nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    uploaded_at = Column(DateTime, default=utc_now)

class ExtractedEntity(Base):
    __tablename__ = "extracted_entities"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    entity_type = Column(String(50), index=True, nullable=False)
    entity_value = Column(String(255), nullable=False)
    normalized_value = Column(String(255), index=True, nullable=False)
    confidence = Column(Float, default=1.0)
    start_position = Column(Integer, default=0)
    end_position = Column(Integer, default=0)
    is_approved = Column(Boolean, default=False)

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    event_type = Column(String(50), index=True, nullable=False)
    description = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=utc_now, index=True)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="SET NULL"), nullable=True)
    source_document_id = Column(Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=True)
    entity_id = Column(String(100), nullable=True)
    entity_type = Column(String(50), nullable=True)
    alert_type = Column(String(100), index=True, nullable=False)
    severity = Column(String(20), default="MEDIUM") # HIGH, MEDIUM, LOW
    score = Column(Float, default=0.5)
    explanation = Column(Text, nullable=False)
    status = Column(String(20), default="NEW") # NEW, REVIEWED, DISMISSED
    created_at = Column(DateTime, default=utc_now)

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

class PersonBase(BaseModel):
    person_code: str
    name: str
    aliases: Optional[str] = None
    date_of_birth: Optional[str] = None
    notes: Optional[str] = None

class PersonCreate(PersonBase):
    pass

class PersonResponse(PersonBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PhoneBase(BaseModel):
    phone_code: str
    masked_number: str
    owner_person_id: Optional[int] = None

class PhoneResponse(PhoneBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

class VehicleBase(BaseModel):
    vehicle_code: str
    registration_number: str
    vehicle_type: str = "CAR"
    owner_person_id: Optional[int] = None

class VehicleResponse(VehicleBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

class LocationBase(BaseModel):
    location_code: str
    name: str
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class LocationResponse(LocationBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

class ExtractedEntitySchema(BaseModel):
    id: Optional[int] = None
    entity_type: str
    entity_value: str
    normalized_value: str
    confidence: float = 1.0
    start_position: int = 0
    end_position: int = 0
    is_approved: bool = False

    model_config = ConfigDict(from_attributes=True)

class RelationshipSchema(BaseModel):
    id: Optional[int] = None
    source_entity_type: str
    source_entity_id: str
    target_entity_type: str
    target_entity_id: str
    relationship_type: str
    confidence: float = 1.0
    case_id: Optional[int] = None
    explanation: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class EntityResolutionMatch(BaseModel):
    original_entity: str
    matched_entity: str
    similarity_score: float
    entity_type: str
    recommendation: str = "Possible entity match — investigator verification required."

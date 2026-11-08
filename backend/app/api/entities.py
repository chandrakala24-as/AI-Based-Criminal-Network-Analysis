from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entity import Person, Phone, Vehicle, Location, Organization, Transaction
from app.models.relationship import Relationship
from app.schemas.entity import PersonResponse, PhoneResponse, VehicleResponse, LocationResponse, EntityResolutionMatch
from app.security.auth import get_current_user
from app.security.rbac import require_any_user
from app.services.nlp.resolution import find_possible_entity_matches

router = APIRouter(prefix="/entities", tags=["Entities"])

@router.get("")
def search_all_entities(
    query: Optional[str] = None,
    entity_type: Optional[str] = None,
    db: Session = Depends(get_db),
    user = Depends(require_any_user)
):
    results = []

    if not entity_type or entity_type == "PERSON":
        q = db.query(Person)
        if query: q = q.filter((Person.name.ilike(f"%{query}%")) | (Person.person_code.ilike(f"%{query}%")))
        for p in q.all():
            results.append({"id": f"PERSON:{p.person_code}", "type": "PERSON", "code": p.person_code, "name": p.name, "aliases": p.aliases})

    if not entity_type or entity_type == "PHONE":
        q = db.query(Phone)
        if query: q = q.filter((Phone.masked_number.ilike(f"%{query}%")) | (Phone.phone_code.ilike(f"%{query}%")))
        for ph in q.all():
            results.append({"id": f"PHONE:{ph.phone_code}", "type": "PHONE", "code": ph.phone_code, "name": ph.masked_number})

    if not entity_type or entity_type == "VEHICLE":
        q = db.query(Vehicle)
        if query: q = q.filter((Vehicle.registration_number.ilike(f"%{query}%")) | (Vehicle.vehicle_code.ilike(f"%{query}%")))
        for v in q.all():
            results.append({"id": f"VEHICLE:{v.vehicle_code}", "type": "VEHICLE", "code": v.vehicle_code, "name": v.registration_number})

    if not entity_type or entity_type == "LOCATION":
        q = db.query(Location)
        if query: q = q.filter((Location.name.ilike(f"%{query}%")) | (Location.location_code.ilike(f"%{query}%")))
        for l in q.all():
            results.append({"id": f"LOCATION:{l.location_code}", "type": "LOCATION", "code": l.location_code, "name": l.name, "address": l.address, "lat": l.latitude, "lng": l.longitude})

    return results

@router.get("/{entity_type}/{entity_id}")
def get_entity_profile(
    entity_type: str,
    entity_id: str,
    db: Session = Depends(get_db),
    user = Depends(require_any_user)
):
    # Fetch all relationships where entity appears as source or target
    rels = db.query(Relationship).filter(
        ((Relationship.source_entity_type == entity_type) & (Relationship.source_entity_id == entity_id)) |
        ((Relationship.target_entity_type == entity_type) & (Relationship.target_entity_id == entity_id))
    ).all()

    related_cases = list(set([r.case_id for r in rels if r.case_id]))
    related_docs = list(set([r.source_document_id for r in rels if r.source_document_id]))

    return {
        "entity_type": entity_type,
        "entity_id": entity_id,
        "connections_count": len(rels),
        "associated_cases_count": len(related_cases),
        "associated_documents_count": len(related_docs),
        "relationships": [
            {
                "id": r.id,
                "source": f"{r.source_entity_type}:{r.source_entity_id}",
                "target": f"{r.target_entity_type}:{r.target_entity_id}",
                "relationship_type": r.relationship_type,
                "confidence": r.confidence,
                "case_id": r.case_id,
                "explanation": r.explanation
            }
            for r in rels
        ]
    }

@router.post("/resolve", response_model=List[EntityResolutionMatch])
def resolve_entity_match(
    name: str,
    entity_type: str = "PERSON",
    db: Session = Depends(get_db),
    user = Depends(require_any_user)
):
    existing = []
    if entity_type == "PERSON":
        existing = [p.name for p in db.query(Person).all()]
    elif entity_type == "LOCATION":
        existing = [l.name for l in db.query(Location).all()]
    
    return find_possible_entity_matches(name, entity_type, existing)

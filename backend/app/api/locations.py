from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entity import Location, Event
from app.schemas.entity import LocationResponse
from app.security.auth import get_current_user
from app.security.rbac import require_any_user

router = APIRouter(prefix="/locations", tags=["Locations / Map Intelligence"])

@router.get("", response_model=List[LocationResponse])
def get_locations(
    db: Session = Depends(get_db),
    user = Depends(require_any_user)
):
    return db.query(Location).all()

@router.get("/map-events")
def get_map_events(
    db: Session = Depends(get_db),
    user = Depends(require_any_user)
):
    locations = db.query(Location).all()
    events = db.query(Event).all()

    map_points = []
    loc_map = {l.id: l for l in locations}

    for e in events:
        if e.location_id and e.location_id in loc_map:
            loc = loc_map[e.location_id]
            if loc.latitude and loc.longitude:
                map_points.append({
                    "id": f"event-loc-{e.id}",
                    "event_id": e.id,
                    "case_id": e.case_id,
                    "event_type": e.event_type,
                    "description": e.description,
                    "timestamp": e.timestamp,
                    "location_name": loc.name,
                    "address": loc.address,
                    "latitude": loc.latitude,
                    "longitude": loc.longitude,
                    "source_document_id": e.source_document_id
                })

    # Add default synthetic fallback locations if events don't have geo
    for loc in locations:
        if loc.latitude and loc.longitude and not any(p["location_name"] == loc.name for p in map_points):
            map_points.append({
                "id": f"loc-{loc.id}",
                "case_id": 1,
                "event_type": "GEOGRAPHIC_POINT",
                "description": f"Location record: {loc.name}",
                "timestamp": "2026-06-12 09:00:00",
                "location_name": loc.name,
                "address": loc.address,
                "latitude": loc.latitude,
                "longitude": loc.longitude
            })

    return map_points

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.case import Case
from app.models.entity import Event, Document
from app.models.relationship import Relationship
from app.schemas.case import CaseCreate, CaseResponse, CaseUpdate, CrossCaseLink, CaseSimilarityResponse
from app.security.auth import get_current_user
from app.security.rbac import require_any_user, require_investigator
from app.security.audit_logger import log_audit_event
from app.services.graph.network_service import NetworkGraphService
from app.services.similarity.case_similarity import find_cross_case_links, find_similar_cases

router = APIRouter(prefix="/cases", tags=["Cases"])

@router.get("", response_model=List[CaseResponse])
def get_cases(
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    user = Depends(require_any_user)
):
    query = db.query(Case)
    if status:
        query = query.filter(Case.status == status)
    if search:
        query = query.filter(
            (Case.case_number.ilike(f"%{search}%")) |
            (Case.title.ilike(f"%{search}%")) |
            (Case.description.ilike(f"%{search}%"))
        )
    return query.order_by(Case.created_at.desc()).all()

@router.post("", response_model=CaseResponse)
def create_case(
    case_in: CaseCreate,
    db: Session = Depends(get_db),
    user = Depends(require_investigator)
):
    existing = db.query(Case).filter(Case.case_number == case_in.case_number).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Case number {case_in.case_number} already exists")

    new_case = Case(
        case_number=case_in.case_number,
        title=case_in.title,
        description=case_in.description,
        case_type=case_in.case_type,
        status=case_in.status
    )
    db.add(new_case)
    db.commit()
    db.refresh(new_case)

    log_audit_event(db, action="CREATE_CASE", user_id=user.id, username=user.username, resource_type="CASE", resource_id=str(new_case.id))
    return new_case

@router.post("/reset-mock-data")
def reset_all_mock_data(
    db: Session = Depends(get_db),
    user = Depends(require_investigator)
):
    from clear_mock_data import clear_mock_data
    clear_mock_data()
    log_audit_event(db, action="RESET_MOCK_DATA", user_id=user.id, username=user.username, resource_type="SYSTEM", resource_id="DATABASE")
    return {"message": "All mock cases and synthetic entities have been successfully removed. Database is clean."}

@router.get("/network")
def get_global_network(
    case_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user = Depends(require_any_user)
):
    graph_svc = NetworkGraphService(db)
    return graph_svc.build_network_graph(case_id=case_id)

@router.get("/timeline")
def get_global_timeline(
    case_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user = Depends(require_any_user)
):
    q_events = db.query(Event)
    q_rels = db.query(Relationship)
    if case_id:
        q_events = q_events.filter(Event.case_id == case_id)
        q_rels = q_rels.filter(Relationship.case_id == case_id)

    events = q_events.order_by(Event.timestamp.asc()).all()
    rels = q_rels.order_by(Relationship.event_date.asc()).all()

    timeline_items = []
    for e in events:
        timeline_items.append({
            "id": f"event-{e.id}",
            "type": e.event_type,
            "description": e.description,
            "timestamp": e.timestamp,
            "source_document_id": e.source_document_id,
            "location_id": e.location_id
        })

    for r in rels:
        timeline_items.append({
            "id": f"rel-{r.id}",
            "type": r.relationship_type,
            "description": f"{r.source_entity_id} ({r.source_entity_type}) {r.relationship_type} {r.target_entity_id} ({r.target_entity_type})",
            "timestamp": r.event_date,
            "source_document_id": r.source_document_id,
            "explanation": r.explanation
        })

    timeline_items.sort(key=lambda x: str(x["timestamp"]) if x["timestamp"] else "")
    return timeline_items

@router.get("/cross-links", response_model=List[CrossCaseLink])
def get_all_cross_links(
    db: Session = Depends(get_db),
    user = Depends(require_any_user)
):
    return find_cross_case_links(db)

@router.get("/{case_id}", response_model=CaseResponse)
def get_case(
    case_id: int,
    db: Session = Depends(get_db),
    user = Depends(require_any_user)
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    log_audit_event(db, action="VIEW_CASE", user_id=user.id, username=user.username, resource_type="CASE", resource_id=str(case.id))
    return case

@router.put("/{case_id}", response_model=CaseResponse)
def update_case(
    case_id: int,
    case_in: CaseUpdate,
    db: Session = Depends(get_db),
    user = Depends(require_investigator)
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    if case_in.title is not None: case.title = case_in.title
    if case_in.description is not None: case.description = case_in.description
    if case_in.case_type is not None: case.case_type = case_in.case_type
    if case_in.status is not None: case.status = case_in.status

    db.commit()
    db.refresh(case)
    log_audit_event(db, action="UPDATE_CASE", user_id=user.id, username=user.username, resource_type="CASE", resource_id=str(case.id))
    return case

@router.get("/{case_id}/network")
def get_case_network(
    case_id: int,
    db: Session = Depends(get_db),
    user = Depends(require_any_user)
):
    graph_svc = NetworkGraphService(db)
    return graph_svc.build_network_graph(case_id=case_id)

@router.get("/{case_id}/timeline")
def get_case_timeline(
    case_id: int,
    db: Session = Depends(get_db),
    user = Depends(require_any_user)
):
    events = db.query(Event).filter(Event.case_id == case_id).order_by(Event.timestamp.asc()).all()
    rels = db.query(Relationship).filter(Relationship.case_id == case_id).order_by(Relationship.event_date.asc()).all()

    timeline_items = []
    for e in events:
        timeline_items.append({
            "id": f"event-{e.id}",
            "type": e.event_type,
            "description": e.description,
            "timestamp": e.timestamp,
            "source_document_id": e.source_document_id,
            "location_id": e.location_id
        })

    for r in rels:
        timeline_items.append({
            "id": f"rel-{r.id}",
            "type": r.relationship_type,
            "description": f"{r.source_entity_id} ({r.source_entity_type}) {r.relationship_type} {r.target_entity_id} ({r.target_entity_type})",
            "timestamp": r.event_date,
            "source_document_id": r.source_document_id,
            "explanation": r.explanation
        })

    timeline_items.sort(key=lambda x: x["timestamp"] if x["timestamp"] else "")
    return timeline_items

@router.get("/{case_id}/cross-links", response_model=List[CrossCaseLink])
def get_case_cross_links(
    case_id: int,
    db: Session = Depends(get_db),
    user = Depends(require_any_user)
):
    all_links = find_cross_case_links(db)
    return [cl for cl in all_links if cl["case_a_id"] == case_id or cl["case_b_id"] == case_id]

@router.get("/{case_id}/similar", response_model=List[CaseSimilarityResponse])
def get_similar_cases_api(
    case_id: int,
    db: Session = Depends(get_db),
    user = Depends(require_any_user)
):
    return find_similar_cases(case_id, db)

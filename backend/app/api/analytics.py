from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.case import Case
from app.models.entity import Person, Phone, Vehicle, Location, Organization, Transaction, Document, Alert
from app.models.relationship import Relationship
from app.models.evidence import EvidenceIntegrity
from app.schemas.analytics import SystemStats, KeyEntityMetric, AnomalyAlertResponse
from app.security.auth import get_current_user
from app.security.rbac import require_any_user
from app.services.graph.network_service import NetworkGraphService
from app.services.anomaly.anomaly_detector import detect_anomalies_and_patterns

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/stats", response_model=SystemStats)
def get_system_stats(
    db: Session = Depends(get_db),
    user = Depends(require_any_user)
):
    c_count = db.query(Case).count()
    p_count = db.query(Person).count()
    ph_count = db.query(Phone).count()
    v_count = db.query(Vehicle).count()
    l_count = db.query(Location).count()
    o_count = db.query(Organization).count()

    total_entities = p_count + ph_count + v_count + l_count + o_count
    total_rels = db.query(Relationship).count()
    total_alerts = db.query(Alert).count() + len(detect_anomalies_and_patterns(db))
    total_docs = db.query(Document).count()
    verified_ev = db.query(EvidenceIntegrity).count()

    return {
        "total_cases": c_count,
        "total_entities": total_entities,
        "total_relationships": total_rels,
        "total_alerts": total_alerts,
        "total_documents": total_docs,
        "verified_evidence_count": verified_ev
    }

@router.get("/centrality", response_model=List[KeyEntityMetric])
def get_centrality_metrics(
    limit: int = 10,
    db: Session = Depends(get_db),
    user = Depends(require_any_user)
):
    graph_svc = NetworkGraphService(db)
    return graph_svc.get_top_key_entities(limit=limit)

@router.get("/anomalies")
def get_anomalies(
    db: Session = Depends(get_db),
    user = Depends(require_any_user)
):
    return detect_anomalies_and_patterns(db)

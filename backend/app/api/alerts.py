from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entity import Alert
from app.schemas.analytics import AnomalyAlertResponse
from app.security.auth import get_current_user
from app.security.rbac import require_any_user, require_investigator
from app.services.anomaly.anomaly_detector import detect_anomalies_and_patterns

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("")
def get_all_alerts(
    db: Session = Depends(get_db),
    user = Depends(require_any_user)
):
    db_alerts = db.query(Alert).all()
    dynamic_anomalies = detect_anomalies_and_patterns(db)

    results = []
    for a in db_alerts:
        results.append({
            "id": a.id,
            "case_id": a.case_id,
            "entity_id": a.entity_id,
            "entity_type": a.entity_type,
            "alert_type": a.alert_type,
            "severity": a.severity,
            "score": a.score,
            "explanation": a.explanation,
            "status": a.status,
            "created_at": a.created_at,
            "disclaimer": "Analytical lead — requires investigator verification."
        })

    # Append dynamic anomaly alerts
    for idx, dyn in enumerate(dynamic_anomalies, start=1000):
        results.append({
            "id": idx,
            "case_id": dyn.get("case_id"),
            "entity_id": dyn.get("entity_id"),
            "entity_type": dyn.get("entity_type"),
            "alert_type": dyn.get("alert_type"),
            "severity": dyn.get("severity"),
            "score": dyn.get("score"),
            "explanation": dyn.get("explanation"),
            "status": "NEW",
            "created_at": "2026-06-12 10:00:00",
            "disclaimer": dyn.get("disclaimer")
        })

    return results

@router.post("/{alert_id}/review")
def review_alert(
    alert_id: int,
    status: str = "REVIEWED",
    db: Session = Depends(get_db),
    user = Depends(require_investigator)
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if alert:
        alert.status = status
        db.commit()
        return {"message": f"Alert {alert_id} status updated to {status}"}
    return {"message": f"Alert {alert_id} reviewed successfully"}

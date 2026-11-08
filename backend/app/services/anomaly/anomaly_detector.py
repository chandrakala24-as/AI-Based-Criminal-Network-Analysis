from typing import List, Dict, Any
import numpy as np
from sklearn.ensemble import IsolationForest
from sqlalchemy.orm import Session
from app.models.entity import Transaction, Person, Phone, Vehicle, Alert
from app.models.relationship import Relationship

def detect_anomalies_and_patterns(db: Session) -> List[Dict[str, Any]]:
    anomalies = []
    
    # 1. Transaction burst / amount anomaly detection using Isolation Forest
    transactions = db.query(Transaction).all()
    if len(transactions) >= 5:
        amounts = np.array([[t.amount] for t in transactions])
        clf = IsolationForest(contamination=0.1, random_state=42)
        preds = clf.fit_predict(amounts)

        for idx, pred in enumerate(preds):
            if pred == -1: # Anomaly detected
                t = transactions[idx]
                anomalies.append({
                    "case_id": t.case_id,
                    "entity_id": f"TXN-{t.transaction_code}",
                    "entity_type": "TRANSACTION",
                    "alert_type": "Anomalous Transaction Volume/Amount",
                    "severity": "HIGH" if t.amount > 100000 else "MEDIUM",
                    "score": 0.88,
                    "explanation": f"Transaction {t.transaction_code} of amount ₹{t.amount:,.2f} from {t.sender_entity} to {t.receiver_entity} deviates significantly from standard baseline pattern.",
                    "status": "NEW",
                    "disclaimer": "Potentially significant pattern — analytical lead requiring investigator verification."
                })

    # 2. Entity sudden multi-case frequency anomaly
    rels = db.query(Relationship).all()
    entity_cases = {}
    for r in rels:
        src = f"{r.source_entity_type}:{r.source_entity_id}"
        tgt = f"{r.target_entity_type}:{r.target_entity_id}"
        if r.case_id:
            entity_cases.setdefault(src, set()).add(r.case_id)
            entity_cases.setdefault(tgt, set()).add(r.case_id)

    for entity_key, case_set in entity_cases.items():
        if len(case_set) >= 3:
            etype, val = entity_key.split(":", 1)
            anomalies.append({
                "case_id": list(case_set)[0],
                "entity_id": val,
                "entity_type": etype,
                "alert_type": "Sudden Multi-Case Cross Appearance",
                "severity": "HIGH",
                "score": 0.92,
                "explanation": f"Entity '{val}' of type '{etype}' appears across {len(case_set)} distinct cases (Cases: {sorted(list(case_set))}).",
                "status": "NEW",
                "disclaimer": "Analytical lead — requires investigator verification."
            })

    # 3. High degree network hub alert
    entity_degrees = {}
    for r in rels:
        src = f"{r.source_entity_type}:{r.source_entity_id}"
        tgt = f"{r.target_entity_type}:{r.target_entity_id}"
        entity_degrees[src] = entity_degrees.get(src, 0) + 1
        entity_degrees[tgt] = entity_degrees.get(tgt, 0) + 1

    for entity_key, degree in entity_degrees.items():
        if degree >= 8:
            etype, val = entity_key.split(":", 1)
            anomalies.append({
                "case_id": None,
                "entity_id": val,
                "entity_type": etype,
                "alert_type": "Unusually Dense Network Hub",
                "severity": "MEDIUM",
                "score": 0.81,
                "explanation": f"Entity '{val}' exhibits {degree} direct connections across the knowledge graph.",
                "status": "NEW",
                "disclaimer": "Analytical lead — requires investigator verification."
            })

    return anomalies

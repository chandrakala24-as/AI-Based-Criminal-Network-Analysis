from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class KeyEntityMetric(BaseModel):
    entity_id: str
    entity_name: str
    entity_type: str
    connections_count: int
    degree_centrality: float
    betweenness_centrality: float
    pagerank: float
    disclaimer: str = "High network centrality indicates that this entity occupies an important position in the observed data network. This is not evidence of criminal activity."

class AnomalyAlertResponse(BaseModel):
    id: int
    case_id: Optional[int]
    entity_id: Optional[str]
    entity_type: Optional[str]
    alert_type: str
    severity: str
    score: float
    explanation: str
    status: str
    created_at: datetime
    disclaimer: str = "Analytical lead — requires investigator verification."

class SystemStats(BaseModel):
    total_cases: int
    total_entities: int
    total_relationships: int
    total_alerts: int
    total_documents: int
    verified_evidence_count: int

from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class GraphNode(BaseModel):
    id: str
    label: str
    type: str # PERSON, PHONE, VEHICLE, LOCATION, ORG, CASE, ACCOUNT
    details: Dict[str, Any] = {}
    degree: int = 0
    centrality: float = 0.0

class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    label: str
    confidence: float = 1.0
    case_id: Optional[int] = None
    source_document: Optional[str] = None
    explanation: Optional[str] = None

class KnowledgeGraphResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    total_nodes: int
    total_edges: int

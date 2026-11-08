from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.models.case import CaseStatus

class CaseBase(BaseModel):
    case_number: str
    title: str
    description: Optional[str] = None
    case_type: str = "General Investigation"
    status: CaseStatus = CaseStatus.OPEN

class CaseCreate(CaseBase):
    pass

class CaseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    case_type: Optional[str] = None
    status: Optional[CaseStatus] = None

class CaseResponse(CaseBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CrossCaseLink(BaseModel):
    case_a_id: int
    case_a_number: str
    case_b_id: int
    case_b_number: str
    shared_entity_type: str
    shared_entity_value: str
    confidence: float
    sources: List[str]
    status: str = "Requires investigator verification"

class CaseSimilarityResponse(BaseModel):
    case_id: int
    case_number: str
    title: str
    similarity_score: float
    reason: str

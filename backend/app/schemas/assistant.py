from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class AssistantQueryRequest(BaseModel):
    query: str
    case_id: Optional[int] = None
    scope: Optional[str] = "global" # "global" or "case"

class SourceReference(BaseModel):
    document_id: Optional[int] = None
    document_code: Optional[str] = None
    case_number: Optional[str] = None
    filename: Optional[str] = None
    date: Optional[str] = None
    relevance_snippet: Optional[str] = None

class AssistantQueryResponse(BaseModel):
    query: str
    answer: str
    confidence: float
    sources: List[SourceReference] = []
    disclaimer: str = "Requires investigator verification."

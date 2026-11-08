from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.entity import ExtractedEntitySchema, RelationshipSchema

class DocumentResponse(BaseModel):
    id: int
    document_code: str
    case_id: int
    filename: str
    document_type: str
    sha256_hash: str
    uploaded_by: int
    uploaded_at: datetime
    extracted_text: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class DocumentProcessingResult(BaseModel):
    document: DocumentResponse
    entities: List[ExtractedEntitySchema]
    relationships: List[RelationshipSchema]
    status: str = "Extracted - Ready for Investigator Review"

class EntityApprovalRequest(BaseModel):
    accepted_entity_ids: List[int]
    rejected_entity_ids: List[int] = []

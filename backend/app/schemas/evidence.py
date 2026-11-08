from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class EvidenceVerificationRequest(BaseModel):
    document_id: int

class EvidenceVerificationResponse(BaseModel):
    document_id: int
    filename: str
    stored_hash: str
    computed_hash: str
    verified: bool
    status_message: str
    ledger_reference: Optional[str] = None
    timestamp: datetime

class LedgerBlockResponse(BaseModel):
    block_index: int
    timestamp: datetime
    evidence_id: str
    case_id: int
    sha256_hash: str
    previous_hash: str
    block_hash: str

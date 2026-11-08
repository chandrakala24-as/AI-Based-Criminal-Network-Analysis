from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.evidence import EvidenceIntegrity
from app.models.entity import Document
from app.schemas.evidence import EvidenceVerificationRequest, EvidenceVerificationResponse, LedgerBlockResponse
from app.security.auth import get_current_user
from app.security.rbac import require_any_user, require_investigator
from app.security.audit_logger import log_audit_event
from app.services.evidence.ledger import verify_document_integrity

router = APIRouter(prefix="/evidence", tags=["Evidence Integrity & Blockchain"])

@router.get("", response_model=List[LedgerBlockResponse])
def get_ledger_blocks(
    db: Session = Depends(get_db),
    user = Depends(require_any_user)
):
    blocks = db.query(EvidenceIntegrity).order_by(EvidenceIntegrity.block_index.asc()).all()
    return [
        {
            "block_index": b.block_index or 1,
            "timestamp": b.timestamp,
            "evidence_id": b.evidence_id,
            "case_id": b.case_id,
            "sha256_hash": b.sha256_hash,
            "previous_hash": b.previous_hash or "0"*64,
            "block_hash": b.block_hash or b.sha256_hash
        }
        for b in blocks
    ]

@router.post("/{document_id}/verify", response_model=EvidenceVerificationResponse)
def verify_evidence(
    document_id: int,
    db: Session = Depends(get_db),
    user = Depends(require_any_user)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Simulate checking file bytes vs recorded hash
    file_bytes = (doc.extracted_text or "").encode('utf-8')
    res = verify_document_integrity(db, document_id, file_bytes)

    log_audit_event(db, action="VERIFY_EVIDENCE", user_id=user.id, username=user.username, resource_type="EVIDENCE", resource_id=str(document_id))

    return res

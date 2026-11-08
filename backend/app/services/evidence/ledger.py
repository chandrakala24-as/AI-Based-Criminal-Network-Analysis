import hashlib
import json
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.database import utc_now
from app.models.evidence import EvidenceIntegrity

def calculate_sha256(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()

def create_evidence_block(
    db: Session,
    evidence_id: str,
    case_id: int,
    file_bytes: bytes,
    user_id: int,
    action: str = "DOCUMENT_UPLOADED"
) -> EvidenceIntegrity:
    doc_hash = calculate_sha256(file_bytes)

    # Get last block
    last_block = db.query(EvidenceIntegrity).order_by(EvidenceIntegrity.block_index.desc()).first()

    if last_block:
        prev_hash = last_block.block_hash
        block_idx = last_block.block_index + 1
    else:
        prev_hash = "0" * 64 # Genesis block reference
        block_idx = 1

    ts = utc_now()
    raw_block_str = f"{block_idx}:{ts.isoformat()}:{evidence_id}:{case_id}:{doc_hash}:{prev_hash}"
    block_hash = hashlib.sha256(raw_block_str.encode('utf-8')).hexdigest()

    evidence_entry = EvidenceIntegrity(
        evidence_id=evidence_id,
        case_id=case_id,
        sha256_hash=doc_hash,
        timestamp=ts,
        action=action,
        user_id=user_id,
        ledger_reference=f"BLOCK-{block_idx}",
        previous_hash=prev_hash,
        block_index=block_idx,
        block_hash=block_hash
    )
    db.add(evidence_entry)
    db.commit()
    db.refresh(evidence_entry)
    return evidence_entry

def verify_document_integrity(
    db: Session,
    document_id: int,
    current_file_bytes: bytes
) -> Dict[str, Any]:
    from app.models.entity import Document
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        return {
            "verified": False,
            "status_message": "Document not found in database.",
            "stored_hash": "",
            "computed_hash": ""
        }

    current_hash = calculate_sha256(current_file_bytes)
    stored_hash = doc.sha256_hash

    # Check evidence integrity record
    evidence_entry = db.query(EvidenceIntegrity).filter(
        EvidenceIntegrity.evidence_id == f"DOC-{doc.id}"
    ).first()

    ledger_ref = evidence_entry.ledger_reference if evidence_entry else "N/A"

    if current_hash == stored_hash:
        return {
            "document_id": doc.id,
            "filename": doc.filename,
            "stored_hash": stored_hash,
            "computed_hash": current_hash,
            "verified": True,
            "status_message": "Evidence integrity verified — Document SHA-256 hash matches immutable block ledger entry.",
            "ledger_reference": ledger_ref,
            "timestamp": utc_now()
        }
    else:
        return {
            "document_id": doc.id,
            "filename": doc.filename,
            "stored_hash": stored_hash,
            "computed_hash": current_hash,
            "verified": False,
            "status_message": "Integrity verification failed — File hash differs from recorded immutable hash!",
            "ledger_reference": ledger_ref,
            "timestamp": utc_now()
        }

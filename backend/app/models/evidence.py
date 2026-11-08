from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from app.database import Base, utc_now

class EvidenceIntegrity(Base):
    __tablename__ = "evidence_integrity"

    id = Column(Integer, primary_key=True, index=True)
    evidence_id = Column(String(100), index=True, nullable=False) # e.g. DOC-101
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    sha256_hash = Column(String(64), index=True, nullable=False)
    timestamp = Column(DateTime, default=utc_now, index=True)
    action = Column(String(50), default="DOCUMENT_UPLOADED")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    ledger_reference = Column(String(100), nullable=True) # Block index / Hash
    previous_hash = Column(String(64), nullable=True)
    block_index = Column(Integer, nullable=True)
    block_hash = Column(String(64), nullable=True)

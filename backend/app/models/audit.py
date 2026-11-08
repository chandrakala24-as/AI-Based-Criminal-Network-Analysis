from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from app.database import Base, utc_now

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    username = Column(String(50), nullable=True)
    action = Column(String(50), index=True, nullable=False) # LOGIN, UPLOAD_DOCUMENT, VIEW_CASE, CREATE_CASE, etc.
    resource_type = Column(String(50), nullable=True) # CASE, DOCUMENT, ENTITY, EVIDENCE
    resource_id = Column(String(100), nullable=True)
    timestamp = Column(DateTime, default=utc_now, index=True)
    ip_address = Column(String(45), default="127.0.0.1")

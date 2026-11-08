import enum
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum
from app.database import Base, utc_now

class CaseStatus(str, enum.Enum):
    OPEN = "OPEN"
    UNDER_INVESTIGATION = "UNDER_INVESTIGATION"
    PENDING_REVIEW = "PENDING_REVIEW"
    CLOSED = "CLOSED"

class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    case_number = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    case_type = Column(String(50), default="General Investigation", index=True)
    status = Column(Enum(CaseStatus), default=CaseStatus.OPEN, index=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

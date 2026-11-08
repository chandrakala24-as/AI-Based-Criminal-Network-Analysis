from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from app.database import Base, utc_now

class Relationship(Base):
    __tablename__ = "relationships"

    id = Column(Integer, primary_key=True, index=True)
    source_entity_type = Column(String(50), nullable=False, index=True) # PERSON, PHONE, VEHICLE, LOCATION, ORG, CASE, ACCOUNT
    source_entity_id = Column(String(100), nullable=False, index=True)
    target_entity_type = Column(String(50), nullable=False, index=True)
    target_entity_id = Column(String(100), nullable=False, index=True)
    relationship_type = Column(String(50), nullable=False, index=True) # KNOWS, CONTACTED, USES, ASSOCIATED_WITH, LOCATED_AT, MEMBER_OF, INVOLVED_IN, CONNECTED_TO, TRANSFERRED_TO
    confidence = Column(Float, default=1.0)
    source_document_id = Column(Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=True)
    event_date = Column(DateTime, default=utc_now)
    explanation = Column(Text, nullable=True)

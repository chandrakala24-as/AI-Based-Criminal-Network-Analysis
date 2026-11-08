import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from app.database import Base, utc_now

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    INVESTIGATOR = "INVESTIGATOR"
    ANALYST = "ANALYST"
    VIEWER = "VIEWER"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.INVESTIGATOR, nullable=False)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)

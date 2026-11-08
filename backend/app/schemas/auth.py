from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from app.models.user import UserRole

class UserBase(BaseModel):
    username: str
    email: str = Field(..., description="User email address")
    role: UserRole = UserRole.INVESTIGATOR

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class LoginRequest(BaseModel):
    username: str
    password: str

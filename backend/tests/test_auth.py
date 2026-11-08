import pytest
from app.security.auth import get_password_hash, verify_password, create_access_token
from jose import jwt
from app.config import settings

def test_password_hashing():
    raw_pass = "demo123"
    hashed = get_password_hash(raw_pass)
    assert verify_password(raw_pass, hashed) is True
    assert verify_password("wrongpass", hashed) is False

def test_jwt_token_generation():
    data = {"sub": "investigator", "role": "INVESTIGATOR"}
    token = create_access_token(data)
    payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.ALGORITHM])
    assert payload.get("sub") == "investigator"
    assert payload.get("role") == "INVESTIGATOR"

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.auth import UserCreate, UserResponse, Token, LoginRequest
from app.security.auth import get_password_hash, verify_password, create_access_token, get_current_user
from app.security.audit_logger import log_audit_event

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == user_in.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed = get_password_hash(user_in.password)
    new_user = User(
        username=user_in.username,
        email=user_in.email,
        password_hash=hashed,
        role=user_in.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    log_audit_event(db, action="REGISTER_USER", user_id=new_user.id, username=new_user.username, resource_type="USER", resource_id=str(new_user.id))
    return new_user

@router.post("/login", response_model=Token)
def login(login_req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == login_req.username).first()
    if not user or not verify_password(login_req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    if not user.active:
        raise HTTPException(status_code=400, detail="User account is deactivated")

    access_token = create_access_token(data={"sub": user.username, "role": user.role.value})
    log_audit_event(db, action="LOGIN", user_id=user.id, username=user.username, resource_type="USER", resource_id=str(user.id))

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

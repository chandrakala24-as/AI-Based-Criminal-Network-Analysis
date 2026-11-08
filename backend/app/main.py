import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.models.user import User, UserRole
from app.security.auth import get_password_hash
from app.api.router import api_router

def seed_default_users():
    """
    Ensures default accounts exist without overwriting existing passwords on every restart.
    """
    db = SessionLocal()
    try:
        default_accounts = [
            ("investigator", "investigator@crimegraph.ai", "demo123", UserRole.INVESTIGATOR),
            ("admin", "admin@crimegraph.ai", "admin123", UserRole.ADMIN),
            ("analyst", "analyst@crimegraph.ai", "analyst123", UserRole.ANALYST)
        ]
        for username, email, pwd, role in default_accounts:
            existing = db.query(User).filter(User.username == username).first()
            if not existing:
                new_user = User(
                    username=username,
                    email=email,
                    password_hash=get_password_hash(pwd),
                    role=role,
                    active=True
                )
                db.add(new_user)
        db.commit()
    except Exception as e:
        print(f"Warning: Error checking default users: {e}")
        db.rollback()
    finally:
        db.close()

def init_database():
    """
    Initializes tables and optionally seeds demo records.
    """
    try:
        Base.metadata.create_all(bind=engine)
        if settings.ENABLE_DEMO_USERS:
            seed_default_users()
        if settings.AUTO_SEED_DEMO_DATA:
            from generate_data import seed_synthetic_data
            db = SessionLocal()
            try:
                seed_synthetic_data(db, force=False)
            finally:
                db.close()
    except Exception as e:
        print(f"Error during database startup initialization: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Safe startup initialization
    init_database()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    lifespan=lifespan
)

# Production-ready CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=settings.CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API V1 Router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "title": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "Online",
        "environment": settings.ENVIRONMENT,
        "docs_url": f"{settings.API_V1_STR}/docs",
        "disclaimer": "Analytical decision-support platform for authorized investigators only."
    }

@app.get("/health")
def health_check():
    db_status = "disconnected"
    healthy = False
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        db_status = "connected"
        healthy = True
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return {
        "status": "healthy" if healthy else "degraded",
        "environment": settings.ENVIRONMENT,
        "version": settings.VERSION,
        "frontend": "connected",
        "backend": "connected",
        "database": db_status
    }

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", str(settings.PORT)))
    uvicorn.run("app.main:app", host=host, port=port, reload=(settings.ENVIRONMENT == "development"))

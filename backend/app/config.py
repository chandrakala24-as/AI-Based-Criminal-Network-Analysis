import os
from typing import List, Set
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "CrimeGraph AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # Base directory
    _base_dir: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    _default_db: str = f"sqlite:///{os.path.join(_base_dir, 'crimegraph.db').replace('\\', '/')}"
    
    # Database URL with automatic postgres:// -> postgresql:// conversion for Render
    _raw_db_url: str = os.getenv("DATABASE_URL", _default_db)
    if _raw_db_url.startswith("postgres://"):
        _raw_db_url = _raw_db_url.replace("postgres://", "postgresql://", 1)
    DATABASE_URL: str = _raw_db_url
    
    # Security & Auth
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super-secret-crimegraph-key-change-in-production-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    ENABLE_DEMO_USERS: bool = os.getenv("ENABLE_DEMO_USERS", "true").lower() in ("true", "1", "yes")
    AUTO_SEED_DEMO_DATA: bool = os.getenv("AUTO_SEED_DEMO_DATA", "false").lower() in ("true", "1", "yes")
    
    # Optional LLM API Keys
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # CORS Origins (parses comma-separated list from env, or defaults to local dev URLs)
    @property
    def cors_origins_list(self) -> List[str]:
        env_origins = os.getenv("CORS_ORIGINS", "")
        if env_origins:
            return [origin.strip() for origin in env_origins.split(",") if origin.strip()]
        return [
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:3000"
        ]

    CORS_ORIGIN_REGEX: str = os.getenv("CORS_ORIGIN_REGEX", r"^https:\/\/.*\.onrender\.com$")
    
    # Upload limits & Storage
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "20"))
    ALLOWED_EXTENSIONS: Set[str] = {".pdf", ".docx", ".txt", ".csv", ".json"}
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", os.path.join(_base_dir, "uploads"))

    model_config = SettingsConfigDict(case_sensitive=True, extra="ignore")

settings = Settings()

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

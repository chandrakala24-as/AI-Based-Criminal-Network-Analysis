from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.audit import AuditLog
from app.security.auth import get_current_user
from app.security.rbac import require_admin, require_any_user

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])

@router.get("")
def get_audit_logs(
    limit: int = 100,
    db: Session = Depends(get_db),
    user = Depends(require_any_user)
):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return logs

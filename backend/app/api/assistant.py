from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.assistant import AssistantQueryRequest, AssistantQueryResponse
from app.security.auth import get_current_user
from app.security.rbac import require_any_user
from app.security.audit_logger import log_audit_event
from app.services.assistant.rag_assistant import process_assistant_query

router = APIRouter(prefix="/assistant", tags=["Explainable AI Assistant"])

@router.post("/query", response_model=AssistantQueryResponse)
def query_assistant(
    req: AssistantQueryRequest,
    db: Session = Depends(get_db),
    user = Depends(require_any_user)
):
    res = process_assistant_query(req.query, db, req.case_id, scope=req.scope)
    log_audit_event(db, action="RUN_ANALYSIS", user_id=user.id, username=user.username, resource_type="ASSISTANT", resource_id=req.query[:30])
    return res

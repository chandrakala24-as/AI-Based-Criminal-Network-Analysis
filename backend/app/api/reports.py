from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.security.auth import get_current_user
from app.security.rbac import require_analyst, require_any_user
from app.security.audit_logger import log_audit_event
from app.services.reports.pdf_generator import generate_case_pdf_report

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.post("/generate/{case_id}")
def generate_report(
    case_id: int,
    db: Session = Depends(get_db),
    user = Depends(require_any_user)
):
    try:
        pdf_bytes = generate_case_pdf_report(case_id, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF report: {str(e)}")

    log_audit_event(db, action="GENERATE_REPORT", user_id=user.id, username=user.username, resource_type="CASE", resource_id=str(case_id))

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=CrimeGraph_Report_Case_{case_id}.pdf"}
    )

from fastapi import APIRouter
from app.api.auth import router as auth_router
from app.api.cases import router as cases_router
from app.api.entities import router as entities_router
from app.api.documents import router as documents_router
from app.api.analytics import router as analytics_router
from app.api.alerts import router as alerts_router
from app.api.locations import router as locations_router
from app.api.audit import router as audit_router
from app.api.evidence import router as evidence_router
from app.api.reports import router as reports_router
from app.api.assistant import router as assistant_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(cases_router)
api_router.include_router(entities_router)
api_router.include_router(documents_router)
api_router.include_router(analytics_router)
api_router.include_router(alerts_router)
api_router.include_router(locations_router)
api_router.include_router(audit_router)
api_router.include_router(evidence_router)
api_router.include_router(reports_router)
api_router.include_router(assistant_router)

import os
import uuid
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models.case import Case, CaseStatus
from app.models.entity import Document, ExtractedEntity, Person, Phone, Vehicle, Location, Event
from app.models.relationship import Relationship
from app.schemas.document import DocumentResponse, DocumentProcessingResult, EntityApprovalRequest
from app.security.auth import get_current_user
from app.security.rbac import require_investigator, require_any_user
from app.security.audit_logger import log_audit_event
from app.services.nlp.extractor import extract_text_from_file, extract_entities_hybrid
from app.services.nlp.relationship_extractor import extract_relationships_from_text_and_entities
from app.services.evidence.ledger import calculate_sha256, create_evidence_block

router = APIRouter(prefix="/documents", tags=["Documents"])

@router.post("/upload", response_model=DocumentProcessingResult)
async def upload_document(
    case_id: Optional[int] = Form(None),
    case_number: Optional[str] = Form(None),
    case_title: Optional[str] = Form(None),
    case_type: Optional[str] = Form("General Investigation"),
    case_description: Optional[str] = Form(None),
    document_type: str = Form("FIR_REPORT"),
    file: Optional[UploadFile] = File(None),
    raw_text: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    user = Depends(require_investigator)
):
    # Determine or create case
    target_case_id = case_id
    if not target_case_id:
        if case_number:
            existing = db.query(Case).filter(Case.case_number == case_number.strip()).first()
            if existing:
                target_case_id = existing.id
        
        if not target_case_id:
            c_count = db.query(Case).count() + 1
            assigned_cnum = case_number.strip() if case_number and case_number.strip() else f"FIR-{datetime.now().year}-{c_count:04d}"
            assigned_title = case_title.strip() if case_title and case_title.strip() else f"Investigation Dossier for {assigned_cnum}"
            
            new_case = Case(
                case_number=assigned_cnum,
                title=assigned_title,
                description=case_description or f"FIR investigation record for {assigned_cnum}.",
                case_type=case_type or "General Investigation",
                status=CaseStatus.OPEN
            )
            db.add(new_case)
            db.commit()
            db.refresh(new_case)
            target_case_id = new_case.id

    # Handle content
    content = b""
    filename = "document.txt"

    if file and file.filename:
        # File extension validation
        safe_name = os.path.basename(file.filename)
        _, ext = os.path.splitext(safe_name)
        if ext.lower() not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format '{ext}'. Allowed extensions: {', '.join(sorted(settings.ALLOWED_EXTENSIONS))}"
            )

        content = await file.read()
        filename = safe_name

        # Enforce upload size limit
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if len(content) > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds maximum upload limit of {settings.MAX_UPLOAD_SIZE_MB}MB"
            )

        text = extract_text_from_file(content, filename)
    elif raw_text and raw_text.strip():
        text = raw_text.strip()
        content = text.encode("utf-8")
        c_obj = db.query(Case).filter(Case.id == target_case_id).first()
        filename = f"{c_obj.case_number if c_obj else 'FIR'}_Report.txt"
    else:
        raise HTTPException(status_code=400, detail="Please upload a document or paste FIR text.")

    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded content is empty")

    sha256_hash = calculate_sha256(content)
    doc_code = f"DOC-{uuid.uuid4().hex[:6].upper()}"

    # Persist file securely to persistent disk storage
    try:
        stored_filename = f"{doc_code}_{filename}"
        stored_path = os.path.join(settings.UPLOAD_DIR, stored_filename)
        with open(stored_path, "wb") as f_out:
            f_out.write(content)
    except Exception as e:
        print(f"Warning: Failed to save file to disk storage: {e}")

    # Create document record
    doc = Document(
        document_code=doc_code,
        case_id=target_case_id,
        filename=filename,
        document_type=document_type,
        extracted_text=text,
        sha256_hash=sha256_hash,
        uploaded_by=user.id
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Immutable evidence block ledger entry creation
    create_evidence_block(db, evidence_id=doc_code, case_id=target_case_id, file_bytes=content, user_id=user.id)

    # 1. NLP Entity Extraction
    raw_entities = extract_entities_hybrid(text)
    saved_entities = []

    for ent in raw_entities:
        ee = ExtractedEntity(
            document_id=doc.id,
            entity_type=ent["entity_type"],
            entity_value=ent["entity_value"],
            normalized_value=ent["normalized_value"],
            confidence=ent["confidence"],
            start_position=ent["start_position"],
            end_position=ent["end_position"],
            is_approved=False # Human-in-the-loop workflow
        )
        db.add(ee)
        saved_entities.append(ee)

    db.commit()
    # Refresh saved entities so ORM attributes (id) are populated
    for ee in saved_entities:
        db.refresh(ee)

    # 2. Relationship Extraction
    raw_rels = extract_relationships_from_text_and_entities(text, raw_entities)
    saved_relationships = []
    for rel in raw_rels:
        r = Relationship(
            case_id=target_case_id,
            source_entity_type=rel.get("source_entity_type", ""),
            source_entity_id=rel.get("source_entity_id", ""),
            target_entity_type=rel.get("target_entity_type", ""),
            target_entity_id=rel.get("target_entity_id", ""),
            relationship_type=rel.get("relationship_type", "ASSOCIATED_WITH"),
            confidence=rel.get("confidence", 0.8),
            explanation=rel.get("explanation", "")
        )
        db.add(r)
        saved_relationships.append(r)
    db.commit()
    for r in saved_relationships:
        db.refresh(r)

    # Log audit event
    log_audit_event(
        db,
        action="UPLOAD_DOCUMENT",
        user_id=user.id,
        username=user.username,
        resource_type="DOCUMENT",
        resource_id=str(doc.id)
    )

    return DocumentProcessingResult(
        document=doc,
        entities=saved_entities,
        relationships=saved_relationships,
        status="Extracted - Ready for Investigator Review"
    )

@router.post("/{document_id}/approve-entities")
def approve_extracted_entities(
    document_id: int,
    request: EntityApprovalRequest,
    db: Session = Depends(get_db),
    user = Depends(require_investigator)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    entities_to_approve = db.query(ExtractedEntity).filter(
        ExtractedEntity.document_id == document_id,
        ExtractedEntity.id.in_(request.accepted_entity_ids)
    ).all()

    for ent in entities_to_approve:
        ent.is_approved = True
        etype = ent.entity_type
        val = (ent.normalized_value or ent.entity_value).strip()

        # Synchronize approved entities into core relational database
        if etype in ["PERSON", "ALIAS"]:
            existing_p = db.query(Person).filter(Person.name.ilike(val)).first()
            if not existing_p:
                p_code = f"P-{uuid.uuid4().hex[:6].upper()}"
                new_p = Person(
                    person_code=p_code,
                    name=val,
                    aliases=ent.entity_value if etype == "ALIAS" else None,
                    notes=f"Identified in Case ID {doc.case_id} via {doc.document_code}"
                )
                db.add(new_p)
                db.flush()
        elif etype == "PHONE":
            existing_ph = db.query(Phone).filter(Phone.masked_number == val).first()
            if not existing_ph:
                ph_code = f"PH-{uuid.uuid4().hex[:6].upper()}"
                new_ph = Phone(
                    phone_code=ph_code,
                    masked_number=val
                )
                db.add(new_ph)
                db.flush()
        elif etype == "VEHICLE":
            existing_v = db.query(Vehicle).filter(Vehicle.registration_number == val).first()
            if not existing_v:
                v_code = f"V-{uuid.uuid4().hex[:6].upper()}"
                new_v = Vehicle(
                    vehicle_code=v_code,
                    registration_number=val,
                    vehicle_type="VEHICLE"
                )
                db.add(new_v)
                db.flush()
        elif etype == "LOCATION":
            existing_loc = db.query(Location).filter(Location.name.ilike(val)).first()
            if not existing_loc:
                loc_code = f"LOC-{uuid.uuid4().hex[:6].upper()}"
                new_loc = Location(
                    location_code=loc_code,
                    name=val,
                    address=val
                )
                db.add(new_loc)
                db.flush()

    # Record Timeline Event
    case_obj = db.query(Case).filter(Case.id == doc.case_id).first()
    ev = Event(
        case_id=doc.case_id,
        event_type="FIR_INGESTED",
        description=f"FIR document {doc.filename} ({doc.document_code}) processed and approved with {len(entities_to_approve)} entities for case {case_obj.case_number if case_obj else doc.case_id}.",
        source_document_id=doc.id
    )
    db.add(ev)
    db.commit()

    # Build relationships from approved entities
    approved_entity_dicts = [
        {
            "entity_type": e.entity_type,
            "entity_value": e.entity_value,
            "normalized_value": e.normalized_value
        }
        for e in entities_to_approve
    ]

    new_rels = extract_relationships_from_text_and_entities(
        text=doc.extracted_text or "",
        entities=approved_entity_dicts,
        case_id=doc.case_id,
        document_id=doc.id
    )

    saved_rels = []
    for r in new_rels:
        rel_entry = Relationship(
            source_entity_type=r["source_entity_type"],
            source_entity_id=r["source_entity_id"],
            target_entity_type=r["target_entity_type"],
            target_entity_id=r["target_entity_id"],
            relationship_type=r["relationship_type"],
            confidence=r["confidence"],
            source_document_id=doc.id,
            case_id=doc.case_id,
            explanation=r["explanation"]
        )
        db.add(rel_entry)
        saved_rels.append(rel_entry)

    db.commit()

    log_audit_event(db, action="APPROVE_ENTITIES", user_id=user.id, username=user.username, resource_type="DOCUMENT", resource_id=str(doc.id))

    return {
        "message": f"Successfully approved {len(entities_to_approve)} entities and generated {len(saved_rels)} knowledge graph relationships.",
        "approved_count": len(entities_to_approve),
        "relationships_count": len(saved_rels),
        "case_id": doc.case_id
    }

@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    user = Depends(require_any_user)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    log_audit_event(db, action="VIEW_DOCUMENT", user_id=user.id, username=user.username, resource_type="DOCUMENT", resource_id=str(doc.id))
    return doc

@router.get("/{document_id}/download")
def download_document(
    document_id: int,
    db: Session = Depends(get_db),
    user = Depends(require_any_user)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    safe_name = os.path.basename(doc.filename)
    file_path = os.path.join(settings.UPLOAD_DIR, f"{doc.document_code}_{safe_name}")

    if not os.path.exists(file_path):
        # Fallback to streaming extracted text
        if doc.extracted_text:
            return Response(
                content=doc.extracted_text.encode("utf-8"),
                media_type="text/plain",
                headers={"Content-Disposition": f'attachment; filename="{doc.document_code}_{safe_name}.txt"'}
            )
        raise HTTPException(status_code=404, detail="Original document file not found on disk")

    log_audit_event(db, action="DOWNLOAD_DOCUMENT", user_id=user.id, username=user.username, resource_type="DOCUMENT", resource_id=str(doc.id))
    return FileResponse(path=file_path, filename=doc.filename)

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.case import Case
from app.models.entity import Person, Phone, Vehicle, Document
from app.models.relationship import Relationship

client = TestClient(app)

def get_auth_token():
    # Login as investigator
    res = client.post("/api/v1/auth/login", json={
        "username": "investigator",
        "password": "demo123"
    })
    assert res.status_code == 200
    return res.json()["access_token"]

def test_real_fir_ingestion_and_case_creation():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Ingest real FIR Report with Unique Case ID via raw text paste
    fir_text = """
    FIRST INFORMATION REPORT
    Police Station: Indiranagar Police Station, Bengaluru
    FIR No. 142/2024 Date: 15/08/2024
    Acts & Sections: Sec. 420, 406, 120B IPC and 66D IT Act
    Complainant: Ramesh Chandra s/o Anand Chandra
    Accused: Suresh Kumar @ Chhotu, operating mobile +91-9876543210
    Vehicle: White SUV bearing registration KA01AB1234
    Bank Account: Acc No. 9876543210123 with IFSC SBIN0001234, UPI: suspect@okhdfcbank
    Incident Details: Complainant was defrauded of ₹2,50,000 via fraudulent investment scheme.
    Accused Suresh Kumar received multiple transfers and fled near MG Road Junction.
    """

    res = client.post(
        "/api/v1/documents/upload",
        data={
            "case_number": "FIR-2024-IND-0142",
            "case_title": "Indiranagar Cyber Fraud & Extortion Ring",
            "case_type": "Cyber Fraud",
            "case_description": "Investigation into Suresh Kumar and syndicate defrauding victims under Sec 420 IPC.",
            "document_type": "FIR_REPORT",
            "raw_text": fir_text
        },
        headers=headers
    )

    assert res.status_code == 200
    data = res.json()
    assert "document" in data
    assert data["document"]["case_id"] is not None
    doc_id = data["document"]["id"]
    case_id = data["document"]["case_id"]
    entities = data["entities"]

    # Verify extracted entities
    extracted_types = [e["entity_type"] for e in entities]
    extracted_values = [e["normalized_value"] for e in entities]

    assert "PERSON" in extracted_types
    assert "PHONE" in extracted_types
    assert "VEHICLE" in extracted_types
    assert "KA01AB1234" in extracted_values
    assert "9876543210" in extracted_values

    # 2. Approve Entities
    entity_ids = [e["id"] for e in entities if "id" in e]
    approve_res = client.post(
        f"/api/v1/documents/{doc_id}/approve-entities",
        json={"accepted_entity_ids": entity_ids},
        headers=headers
    )
    assert approve_res.status_code == 200

    # 3. Verify Database Persistence
    db = SessionLocal()
    try:
        case = db.query(Case).filter(Case.case_number == "FIR-2024-IND-0142").first()
        assert case is not None
        assert case.title == "Indiranagar Cyber Fraud & Extortion Ring"

        # Verify Person, Phone, Vehicle, Relationships exist in DB
        persons = db.query(Person).all()
        phones = db.query(Phone).all()
        vehicles = db.query(Vehicle).all()
        rels = db.query(Relationship).filter(Relationship.case_id == case_id).all()

        assert len(persons) >= 1
        assert len(phones) >= 1
        assert len(vehicles) >= 1
        assert len(rels) >= 1
    finally:
        db.close()

    # 4. Generate PDF Intelligence Report
    report_res = client.post(
        f"/api/v1/reports/generate/{case_id}",
        headers=headers
    )
    assert report_res.status_code == 200
    assert report_res.headers["content-type"] == "application/pdf"
    assert len(report_res.content) > 1000 # Valid PDF bytes returned

def test_cross_case_link_detection():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Ingest a second FIR sharing the same phone number 9876543210 and vehicle KA01AB1234
    second_fir = """
    FIRST INFORMATION REPORT
    Police Station: Koramangala PS
    FIR No. 89/2024 Date: 20/08/2024
    Accused: Vikram Rathore @ Vicky, contact mobile 9876543210
    Vehicle: Spotted driving KA01AB1234 near Koramangala 5th Block.
    Crime: Vehicle theft and interstate smuggling under Sec 379 IPC.
    """

    res = client.post(
        "/api/v1/documents/upload",
        data={
            "case_number": "FIR-2024-KOR-0089",
            "case_title": "Koramangala Vehicle Smuggling Syndicate",
            "case_type": "Organized Theft",
            "raw_text": second_fir
        },
        headers=headers
    )
    assert res.status_code == 200
    doc_id = res.json()["document"]["id"]
    entities = res.json()["entities"]

    entity_ids = [e["id"] for e in entities if "id" in e]
    approve_res = client.post(
        f"/api/v1/documents/{doc_id}/approve-entities",
        json={"accepted_entity_ids": entity_ids},
        headers=headers
    )
    assert approve_res.status_code == 200

    # Verify cross-case link discovery endpoint
    cross_res = client.get("/api/v1/cases/cross-links", headers=headers)
    assert cross_res.status_code == 200
    links = cross_res.json()

    assert len(links) >= 1
    shared_values = [l["shared_entity_value"] for l in links]
    assert ("9876543210" in shared_values) or ("KA01AB1234" in shared_values)

import os
import random
import sys
import argparse
from datetime import datetime, timedelta

# Ensure python can import app
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.database import engine, Base, SessionLocal
from app.models.user import User, UserRole
from app.models.case import Case, CaseStatus
from app.models.entity import (
    Person, Phone, Vehicle, Location, Organization, Transaction, Document, ExtractedEntity, Event, Alert
)
from app.models.relationship import Relationship
from app.models.evidence import EvidenceIntegrity
from app.security.auth import get_password_hash
from app.services.evidence.ledger import calculate_sha256, create_evidence_block

def seed_synthetic_data(db, force: bool = False):
    """
    Safely seeds synthetic demonstration data for CrimeGraph AI.
    If data already exists and force is False, skips generation to prevent accidental resets.
    """
    existing_case_count = db.query(Case).count()
    if existing_case_count > 0 and not force:
        print(f"INFO: Database already contains {existing_case_count} cases. Skipping synthetic data generation.")
        return False

    random.seed(42) # Deterministic generation
    print("Initializing Database Schema...")
    Base.metadata.create_all(bind=engine)

    if force or existing_case_count > 0:
        print("Cleaning existing data (--force specified)...")
        db.query(Relationship).delete()
        db.query(ExtractedEntity).delete()
        db.query(EvidenceIntegrity).delete()
        db.query(Document).delete()
        db.query(Event).delete()
        db.query(Alert).delete()
        db.query(Transaction).delete()
        db.query(Organization).delete()
        db.query(Location).delete()
        db.query(Vehicle).delete()
        db.query(Phone).delete()
        db.query(Person).delete()
        db.query(Case).delete()
        db.commit()

    print("Checking default demo user accounts...")
    admin_user = db.query(User).filter(User.username == "admin").first()
    if not admin_user:
        admin_user = User(
            username="admin",
            email="admin@crimegraph.ai",
            password_hash=get_password_hash("admin123"),
            role=UserRole.ADMIN
        )
        db.add(admin_user)

    inv_user = db.query(User).filter(User.username == "investigator").first()
    if not inv_user:
        inv_user = User(
            username="investigator",
            email="investigator@crimegraph.ai",
            password_hash=get_password_hash("demo123"),
            role=UserRole.INVESTIGATOR
        )
        db.add(inv_user)

    analyst_user = db.query(User).filter(User.username == "analyst").first()
    if not analyst_user:
        analyst_user = User(
            username="analyst",
            email="analyst@crimegraph.ai",
            password_hash=get_password_hash("analyst123"),
            role=UserRole.ANALYST
        )
        db.add(analyst_user)

    db.commit()
    db.refresh(inv_user)

    print("Generating 150 Core Synthetic Investigation Cases...")
    cases = []
    case_types = ["Cyber Fraud", "Financial Smuggling", "Organized Theft", "Narcotics Network", "Extortion Ring", "Identity Theft"]
    
    # Specific demo scenario cases for cross-case intelligence
    demo_cases_spec = [
        (101, "CASE-101", "Suspicious Multi-Node Communication & MG Road Surveillance", "Cyber Fraud", CaseStatus.UNDER_INVESTIGATION),
        (205, "CASE-205", "Inter-State Money Laundering & Wire Transfer Probe", "Financial Smuggling", CaseStatus.OPEN),
        (310, "CASE-310", "High-Volume Transaction Syndicate & Vehicle Tracking", "Organized Theft", CaseStatus.OPEN)
    ]
    
    demo_case_objs = {}
    for cid, cnum, title, ctype, cstat in demo_cases_spec:
        c = Case(id=cid, case_number=cnum, title=title, description=f"Investigation record for {title}. Target elements involve communication P101 and vehicle KA01AB1234.", case_type=ctype, status=cstat)
        db.add(c)
        demo_case_objs[cid] = c
    
    # Fill cases
    for i in range(1, 151):
        if i in [101, 205, 310]:
            continue
        cnum = f"CASE-{(1000 + i)}"
        ctype = random.choice(case_types)
        c = Case(
            case_number=cnum,
            title=f"Operation {ctype} Target #{i}",
            description=f"Synthetic case investigation report into {ctype.lower()} activities across multiple nodes.",
            case_type=ctype,
            status=random.choice(list(CaseStatus))
        )
        cases.append(c)
    
    db.add_all(cases)
    db.commit()

    all_cases = db.query(Case).all()

    print("Generating Entities (Persons, Phones, Vehicles, Locations, Orgs)...")
    # Specific Key Demo Entities
    p1 = Person(id=1, person_code="P001", name="Ravi Kumar", aliases="Ravi, R. Kumar", notes="Central network entity observed in CASE-101 and CASE-205.")
    p2 = Person(id=2, person_code="P002", name="Vikram Singh", aliases="Vicky", notes="Key associate linked to phone P101.")
    p3 = Person(id=3, person_code="P003", name="Ananya Sharma", aliases="Ana", notes="Transaction receiver in wire network.")
    db.add_all([p1, p2, p3])

    persons = [p1, p2, p3]
    for i in range(4, 251):
        p = Person(
            person_code=f"P{i:04d}",
            name=f"Person_{i}",
            aliases=f"Alias_{i}",
            notes=f"Synthetic suspect entity record #{i}"
        )
        persons.append(p)
    db.add_all(persons[3:])
    db.commit()

    # Phones
    ph1 = Phone(id=1, phone_code="P101", masked_number="+91-98765-00101", owner_person_id=1)
    ph2 = Phone(id=2, phone_code="P102", masked_number="+91-98765-00102", owner_person_id=2)
    phones = [ph1, ph2]
    for i in range(3, 151):
        phones.append(Phone(phone_code=f"PH-{i:04d}", masked_number=f"+91-98765-{i:05d}", owner_person_id=random.choice(persons).id))
    db.add_all(phones)

    # Vehicles
    v1 = Vehicle(id=1, vehicle_code="V101", registration_number="KA01AB1234", vehicle_type="SUV", owner_person_id=1)
    vehicles = [v1]
    for i in range(2, 101):
        vehicles.append(Vehicle(vehicle_code=f"V-{i:04d}", registration_number=f"KA{i%90+10:02d}XY{i:04d}", vehicle_type=random.choice(["SEDAN", "SUV", "TRUCK", "VAN"]), owner_person_id=random.choice(persons).id))
    db.add_all(vehicles)

    # Locations
    l1 = Location(id=1, location_code="L101", name="MG Road Junction", address="MG Road, Bengaluru", latitude=12.9756, longitude=77.6066)
    l2 = Location(id=2, location_code="L102", name="Indiranagar Hub", address="100ft Road, Indiranagar", latitude=12.9784, longitude=77.6408)
    locations = [l1, l2]
    for i in range(3, 101):
        locations.append(Location(
            location_code=f"LOC-{i:04d}",
            name=f"Sector {i} Facility",
            address=f"Street {i}, Zone {i%10}",
            latitude=12.9 + random.uniform(-0.1, 0.1),
            longitude=77.6 + random.uniform(-0.1, 0.1)
        ))
    db.add_all(locations)

    # Organizations
    orgs = []
    for i in range(1, 51):
        orgs.append(Organization(organization_code=f"ORG-{i:04d}", name=f"Global Apex Corp #{i}", type=random.choice(["SHELL_COMPANY", "LOGISTICS", "FINANCIAL_SERVICES"])))
    db.add_all(orgs)

    db.commit()

    print("Generating Transactions & Events...")
    transactions = []
    # Dynamic anomalous burst transactions
    transactions.append(Transaction(transaction_code="T101", sender_entity="P001", receiver_entity="P002", amount=50000.0, transaction_type="WIRE_TRANSFER", case_id=101))
    transactions.append(Transaction(transaction_code="T102", sender_entity="P001", receiver_entity="P003", amount=450000.0, transaction_type="SWIFT_TRANSFER", case_id=205))
    for i in range(3, 301):
        transactions.append(Transaction(
            transaction_code=f"TXN-{i:04d}",
            sender_entity=f"P{random.randint(1, 50):04d}",
            receiver_entity=f"P{random.randint(1, 50):04d}",
            amount=round(random.uniform(500, 25000), 2),
            transaction_type=random.choice(["WIRE_TRANSFER", "CRYPTO", "CASH_DEPOSIT"]),
            case_id=random.choice(all_cases).id
        ))
    db.add_all(transactions)

    events = [
        Event(case_id=101, event_type="PHONE_CONTACT", description="P001 initiated encrypted phone call to P002 using P101.", location_id=1),
        Event(case_id=101, event_type="VEHICLE_OBSERVED", description="Vehicle KA01AB1234 spotted at MG Road Junction.", location_id=1),
        Event(case_id=205, event_type="TRANSACTION_LOGGED", description="Wire transfer T102 processed to account linked with P003.", location_id=2)
    ]
    for i in range(4, 51):
        events.append(Event(
            case_id=random.choice(all_cases).id,
            event_type=random.choice(["COMMUNICATION", "LOCATION_SURVEILLANCE", "BANK_TRANSACTION"]),
            description=f"Synthetic investigative observation event #{i}",
            location_id=random.choice(locations).id
        ))
    db.add_all(events)
    db.commit()

    print("Generating Knowledge Graph Relationships...")
    relationships = []
    demo_rels = [
        ("PERSON", "P001", "PERSON", "P002", "KNOWS", 101, "P001 and P002 are linked via repeated voice communication."),
        ("PERSON", "P001", "PHONE", "P101", "USES", 101, "P001 identified as primary operator of P101."),
        ("PERSON", "P002", "PHONE", "P101", "CONTACTED", 101, "P002 received multiple calls from P101."),
        ("PERSON", "P001", "VEHICLE", "KA01AB1234", "ASSOCIATED_WITH", 101, "P001 observed driving KA01AB1234."),
        ("PERSON", "P002", "LOCATION", "L101", "LOCATED_AT", 101, "P002 spotted at MG Road Junction."),
        ("PHONE", "P101", "PERSON", "P003", "CONTACTED", 205, "Phone P101 contacted P003 in secondary investigation CASE-205."),
        ("PERSON", "P003", "VEHICLE", "KA01AB1234", "ASSOCIATED_WITH", 205, "KA01AB1234 recorded in surveillance log of CASE-205."),
        ("PERSON", "P001", "PERSON", "P003", "KNOWS", 310, "Cross-link connection in CASE-310.")
    ]
    for stype, sid, ttype, tid, rtype, cid, exp in demo_rels:
        relationships.append(Relationship(
            source_entity_type=stype, source_entity_id=sid,
            target_entity_type=ttype, target_entity_id=tid,
            relationship_type=rtype, confidence=0.92, case_id=cid, explanation=exp
        ))

    for i in range(1, 501):
        p_src = f"P{random.randint(1, 50):04d}"
        relationships.append(Relationship(
            source_entity_type="PERSON",
            source_entity_id=p_src,
            target_entity_type=random.choice(["PERSON", "PHONE", "VEHICLE", "LOCATION"]),
            target_entity_id=f"P{random.randint(51, 150):04d}",
            relationship_type=random.choice(["KNOWS", "CONTACTED", "USES", "ASSOCIATED_WITH", "LOCATED_AT"]),
            confidence=round(random.uniform(0.75, 0.98), 2),
            case_id=random.choice(all_cases).id,
            explanation=f"Extracted relationship pattern #{i}"
        ))
    db.add_all(relationships)
    db.commit()

    print("Generating Synthetic FIR Documents and Blockchain Ledger...")
    fir_templates = [
        ("FIR-2026-001.txt", 101, "On 12 June 2026, complainant reported suspicious encrypted communications from phone P101. Person P001 (also known as Ravi) was observed near MG Road Junction (L101) operating vehicle KA01AB1234. Investigation records indicate P001 maintained direct links with P002 and transferred ₹50,000 via transaction T101."),
        ("FIR-2026-002.txt", 205, "Surveillance report regarding multi-state financial fraud. Phone P101 was again logged calling Person P003. Vehicle KA01AB1234 was identified parked near Sector 10 Facility. Financial analysis revealed a massive wire transfer T102 of ₹450,000 sent from P001 to P003."),
        ("FIR-2026-003.txt", 310, "Intelligence report on syndicate vehicle movement. Target Person P001 was tracked driving vehicle KA01AB1234 across multiple sector checkpoints. Phone contact P101 registered 18 incoming transmissions within a 24-hour window."),
    ]

    for i in range(4, 11):
        fname = f"FIR-2026-{i:03d}.txt"
        text_content = f"Synthetic FIR Report #{i}. Investigation details record Person P{i:04d} operating phone PH-{i:04d} near Location LOC-{i:04d}. Transaction TXN-{i:04d} logged."
        fir_templates.append((fname, random.choice(all_cases).id, text_content))

    for fname, cid, content in fir_templates:
        file_bytes = content.encode('utf-8')
        doc_hash = calculate_sha256(file_bytes)
        
        doc = Document(
            document_code=fname.replace(".txt", ""),
            case_id=cid,
            filename=fname,
            document_type="FIR_REPORT",
            extracted_text=content,
            sha256_hash=doc_hash,
            uploaded_by=inv_user.id
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)

        create_evidence_block(db, evidence_id=doc.document_code, case_id=cid, file_bytes=file_bytes, user_id=inv_user.id)

    db.commit()
    print("SUCCESS: CrimeGraph AI Synthetic Database Seeded Successfully!")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed CrimeGraph AI Synthetic Data")
    parser.add_argument("--force", action="store_true", help="Force recreate and clear existing data")
    args = parser.parse_args()

    db = SessionLocal()
    try:
        seed_synthetic_data(db, force=args.force)
    finally:
        db.close()

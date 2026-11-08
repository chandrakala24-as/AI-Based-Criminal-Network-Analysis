import os
import sys
import glob

# Ensure python can import app
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.database import engine, Base, SessionLocal
from app.models.user import User, UserRole
from app.models.case import Case
from app.models.entity import (
    Person, Phone, Vehicle, Location, Organization, Transaction, Document, ExtractedEntity, Event, Alert
)
from app.models.relationship import Relationship
from app.models.evidence import EvidenceIntegrity
from app.security.auth import get_password_hash

def clear_mock_data():
    print("Connecting to CrimeGraph database...")
    db = SessionLocal()
    try:
        print("Clearing all mock/synthetic cases, entities, and relationships...")
        deleted_rels = db.query(Relationship).delete()
        deleted_ee = db.query(ExtractedEntity).delete()
        deleted_ev = db.query(EvidenceIntegrity).delete()
        deleted_docs = db.query(Document).delete()
        deleted_events = db.query(Event).delete()
        deleted_alerts = db.query(Alert).delete()
        deleted_txns = db.query(Transaction).delete()
        deleted_orgs = db.query(Organization).delete()
        deleted_locs = db.query(Location).delete()
        deleted_veh = db.query(Vehicle).delete()
        deleted_ph = db.query(Phone).delete()
        deleted_persons = db.query(Person).delete()
        deleted_cases = db.query(Case).delete()
        db.commit()

        # Reset SQLite sequence if sqlite
        try:
            with engine.connect() as conn:
                tables_to_reset = [
                    'cases', 'persons', 'phones', 'vehicles', 'locations',
                    'organizations', 'transactions', 'documents', 'alerts',
                    'evidence_integrity', 'extracted_entities', 'events', 'relationships'
                ]
                for tbl in tables_to_reset:
                    conn.exec_driver_sql(f"DELETE FROM sqlite_sequence WHERE name='{tbl}';")
                conn.commit()
        except Exception:
            pass

        # Ensure default investigator and admin users exist
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            admin = User(
                username="admin",
                email="admin@crimegraph.ai",
                password_hash=get_password_hash("admin123"),
                role=UserRole.ADMIN
            )
            db.add(admin)

        inv = db.query(User).filter(User.username == "investigator").first()
        if not inv:
            inv = User(
                username="investigator",
                email="investigator@crimegraph.ai",
                password_hash=get_password_hash("demo123"),
                role=UserRole.INVESTIGATOR
            )
            db.add(inv)
        db.commit()

        # Clean synthetic reports from data/synthetic/reports
        reports_pattern = os.path.join(os.path.dirname(__file__), "..", "data", "synthetic", "reports", "*.txt")
        files = glob.glob(reports_pattern)
        for f in files:
            try:
                os.remove(f)
            except Exception:
                pass

        print("PURGE COMPLETE:")
        print(f"  - Deleted {deleted_cases} mock cases")
        print(f"  - Deleted {deleted_persons} persons, {deleted_ph} phones, {deleted_veh} vehicles, {deleted_locs} locations")
        print(f"  - Deleted {deleted_rels} relationships, {deleted_docs} documents, {deleted_txns} transactions")
        print(f"  - Cleaned {len(files)} synthetic report files")
        print("  - Users preserved: 'investigator' (password: demo123), 'admin' (password: admin123)")
        print("Database is completely clean and ready for real FIR reports!")
    finally:
        db.close()

if __name__ == "__main__":
    clear_mock_data()

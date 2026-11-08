# Implementation Plan - CrimeGraph AI System

CrimeGraph AI is an AI-powered criminal network analysis and investigation decision-support system designed to automate entity extraction, relationship discovery, cross-case intelligence, graph analytics, anomaly detection, map/timeline visualization, tamper-evident evidence verification, and explainable AI query processing.

---

## User Review Required

> [!IMPORTANT]
> **Investigation Decision-Support Policy**: All AI/ML outputs (centrality scores, cross-case links, anomalies) are presented strictly as **analytical leads requiring human investigator verification**. No automated guilt or legal conclusions are drawn.
> **Synthetic Data**: The system operates out-of-the-box using synthetic, anonymized demonstration data generated deterministically.
> **Zero GPU / Key Dependency**: NLP uses a robust hybrid engine (spaCy + fallback Regex) and the AI Assistant uses grounded retrieval (RAG) with local rule fallback if no external LLM API key (`OPENAI_API_KEY`) is configured.

---

## Proposed System Architecture

### 1. Database Layer (`backend/app/models` & `backend/app/database.py`)
- SQLite by default (`crimegraph.db`) for instant local running; compatible with PostgreSQL via SQLAlchemy.
- Tables:
  - `users`: Authentication & RBAC (ADMIN, INVESTIGATOR, ANALYST, VIEWER)
  - `cases`: Case details, case type, status
  - `persons`, `phones`, `vehicles`, `locations`, `organizations`, `transactions`: Domain entities with relationships
  - `relationships`: Directed multi-type relationships with confidence scores, source doc IDs, and timestamped explanations
  - `documents`: Raw and extracted text, SHA-256 hashes, uploaded metadata
  - `extracted_entities`: Extracted raw vs normalized entities with offset ranges and confidence
  - `events`: Case timeline events tied to locations and documents
  - `alerts`: Anomaly alerts with severity, score, and verification status
  - `audit_logs`: Detailed action logging (User, Action, Resource, IP, Timestamp)
  - `evidence_integrity`: Block ledger references, SHA-256 document hash snapshots

### 2. Backend Services (`backend/app/services/`)
- **NLP Engine** (`nlp/`): Text extraction from PDF/DOCX/TXT/CSV/JSON. Regex + spaCy hybrid NER for 15 entity types (PERSON, ALIAS, PHONE, VEHICLE, LOCATION, ORGANIZATION, CASE_ID, DATE, TIME, MONEY, ACCOUNT, TRANSACTION, EMAIL, EVIDENCE, EVENT). Human-in-the-loop entity acceptance workflow. Entity deduplication/resolution using normalized fuzzy string matching & attribute overlap.
- **Knowledge Graph Analytics** (`graph/`): NetworkX model supporting degree centrality, betweenness centrality, PageRank, shortest path finding, connected components, and community detection.
- **Cross-Case Linkage** (`similarity/` & `graph/`): Automatic detection of shared phones, vehicles, persons, locations, and accounts across cases with confidence scoring.
- **Case Similarity** (`similarity/`): TF-IDF + Cosine similarity over case descriptions, event patterns, and entity overlaps.
- **Anomaly & Pattern Detection** (`anomaly/`): Isolation Forest + statistical rules identifying transaction surges, multi-case sudden appearances, and dense network hub anomalies.
- **Evidence Blockchain Ledger** (`evidence/`): Local cryptographic block ledger linking SHA-256 hashes of uploaded documents with previous block hashes for tamper-evident validation.
- **PDF Report Generator** (`reports/`): ReportLab generator compiling full case dossier (Summary, Entities, Network, Cross-Case, Timeline, Maps, Evidence Verification, Disclaimer).
- **Explainable AI Assistant** (`assistant/`): Grounded retrieval assistant querying database records, returning structured answers with exact source document references, confidence levels, and disclaimers.

### 3. Frontend UI/UX (`frontend/src/`)
- **Theme & Design System**: Dark intelligence dashboard styled with Tailwind CSS, custom glassmorphic cards, vibrant accent colors, and custom scrollbars.
- **Views & Modules**:
  - **Dashboard**: High-level KPI metrics, network quick preview, recent alerts, recent cases, evidence integrity status.
  - **Case Management & Detail Page**: Multi-tab interface (Overview, Entities, Network, Timeline, Map, Cross-Case Links, Similar Cases, Alerts, Documents, Evidence Ledger).
  - **Interactive Network Graph**: Cytoscape.js / React Flow network canvas with node filtering, zooming, node details modal, layout switches (cose, concentric, grid, circle), and centrality highlights.
  - **Cross-Case Intelligence Hub**: Dedicated view mapping shared entities between cases with confidence scores and source document triggers.
  - **Timeline & Map Intelligence**: Interactive timeline of case events and Leaflet OpenStreetMap displaying synthetic geo-tagged case nodes and events.
  - **Document Upload & Human-in-the-Loop Review**: Drag-and-drop file upload with live extraction preview, entity accept/edit/reject table.
  - **AI Investigation Assistant**: Embedded interactive drawer/chat answering investigation queries with direct file source traceability links.
  - **Evidence Integrity Verification**: Integrity hash verification tool showing real-time ledger status.
  - **Audit Log & Security Center**: Admin dashboard detailing all user activities.
  - **Report Export**: Instant PDF generation & download.

### 4. Synthetic Data & CLI Scripts (`backend/generate_data.py`)
- Python script using `faker` or standard libraries to generate 500+ cases, 1,000+ entities, 500 phones, 300 vehicles, 300 locations, 1,000 transactions, 2,000 relationships, and 20 sample FIR text documents featuring deliberate cross-case links and anomalies.

---

## Proposed File Tree & Changes

### Backend Structure (`backend/`)
#### [NEW] [config.py](file:///d:/SIH/backend/app/config.py)
#### [NEW] [database.py](file:///d:/SIH/backend/app/database.py)
#### [NEW] [main.py](file:///d:/SIH/backend/app/main.py)
#### [NEW] Models: `user.py`, `case.py`, `entity.py`, `relationship.py`, `evidence.py`, `audit.py`
#### [NEW] Schemas: `auth.py`, `case.py`, `entity.py`, `graph.py`, `document.py`, `analytics.py`, `evidence.py`, `assistant.py`
#### [NEW] API Routes: `auth.py`, `cases.py`, `entities.py`, `documents.py`, `analytics.py`, `alerts.py`, `locations.py`, `audit.py`, `evidence.py`, `reports.py`, `assistant.py`
#### [NEW] Services:
  - `nlp/extractor.py`, `nlp/resolution.py`, `nlp/relationship_extractor.py`
  - `graph/network_service.py`
  - `anomaly/anomaly_detector.py`
  - `similarity/case_similarity.py`
  - `evidence/ledger.py`
  - `reports/pdf_generator.py`
  - `assistant/rag_assistant.py`
#### [NEW] Security: `auth.py`, `rbac.py`, `audit_logger.py`
#### [NEW] `requirements.txt`
#### [NEW] `generate_data.py`
#### [NEW] Tests: `tests/test_auth.py`, `tests/test_nlp.py`, `tests/test_graph.py`, `tests/test_similarity.py`, `tests/test_evidence.py`, `tests/test_api.py`

### Frontend Structure (`frontend/`)
#### [NEW] `package.json`, `vite.config.ts`, `tailwind.config.js`, `tsconfig.json`
#### [NEW] `src/App.tsx`, `src/main.tsx`, `src/index.css`
#### [NEW] Components:
  - Common: `Navbar.tsx`, `Sidebar.tsx`, `Badge.tsx`, `Modal.tsx`, `Disclaimer.tsx`
  - Graph: `NetworkGraph.tsx`
  - Map: `MapViewer.tsx`
  - Timeline: `TimelineViewer.tsx`
  - Upload: `DocumentUploadModal.tsx`, `EntityReviewTable.tsx`
  - Assistant: `ChatAssistant.tsx`
  - Evidence: `EvidenceLedgerViewer.tsx`
#### [NEW] Pages:
  - `Login.tsx`, `Dashboard.tsx`, `CasesPage.tsx`, `CaseDetailPage.tsx`, `EntitiesPage.tsx`, `EntityDetailPage.tsx`, `GraphPage.tsx`, `CrossCasePage.tsx`, `TimelinePage.tsx`, `MapPage.tsx`, `AlertsPage.tsx`, `EvidencePage.tsx`, `AssistantPage.tsx`, `AuditLogsPage.tsx`, `ReportsPage.tsx`, `SettingsPage.tsx`
#### [NEW] Services: `api.ts`, `authService.ts`, `caseService.ts`, `entityService.ts`, `documentService.ts`, `analyticsService.ts`, `evidenceService.ts`, `assistantService.ts`, `auditService.ts`

### Documentation & Infrastructure (`/`)
#### [NEW] [README.md](file:///d:/SIH/README.md)
#### [NEW] [docker-compose.yml](file:///d:/SIH/docker-compose.yml)
#### [NEW] [.env.example](file:///d:/SIH/.env.example)

---

## Verification Plan

### Automated Testing
1. Run backend `pytest` covering auth, NLP extraction, entity resolution, NetworkX graph centrality, cross-case matching, anomaly detection, evidence hashing, and API endpoints:
   ```bash
   cd backend && python -m pytest
   ```
2. Run data generation script to verify synthetic database seeding:
   ```bash
   python backend/generate_data.py
   ```
3. Test frontend build using Vite compiler to ensure TypeScript typing & JSX build cleanly:
   ```bash
   cd frontend && npm run build
   ```

### Manual Verification Workflow
1. Launch FastAPI backend (`uvicorn app.main:app --reload --port 8000`).
2. Launch Vite frontend (`npm run dev`).
3. Log in with demo credentials (`investigator` / `demo123`).
4. Perform full 35-step end-to-end investigation scenario (FIR Upload -> NLP parsing -> Entity acceptance -> Knowledge Graph update -> Cross-Case discovery -> Anomaly inspection -> Map/Timeline view -> AI Assistant grounded query -> Evidence SHA-256 verification -> Audit log entry -> PDF report generation).

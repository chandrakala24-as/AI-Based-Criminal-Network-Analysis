# 🛡️ CrimeGraph AI
### AI-Powered Criminal Network Analysis & Investigation Intelligence System

> **LEGAL & ETHICAL COMPLIANCE DISCLAIMER**  
> **Investigation Decision-Support System Only**: CrimeGraph AI is strictly an investigative decision-support and analytical tool designed for authorized law enforcement and intelligence personnel. It **does not** automatically determine guilt, accuse individuals of crimes, or make legal determinations. All extracted entities, connection graphs, risk scores, community clusters, and AI assistant suggestions are probabilistic analytical leads that **mandate independent human verification** by certified investigators prior to any operational or evidentiary use.  
> **Synthetic / Anonymized Data**: All demonstrated FIRs, CDR records, bank transactions, vehicle numbers, and entities are synthetically generated for educational, benchmarking, and demonstration purposes.

---

## 🌟 Key Capabilities & Features

1. **Automated FIR & Intelligence Ingestion (NLP Engine)**:
   - Rule-based & regex entity extraction for Indian names, aliases, IPC / BNS legal sections, phone numbers, vehicle registrations (e.g. `DL01AB1234`), bank account numbers, crypto wallet addresses, money amounts, dates, and locations.
   - Fallback and integration ready for HuggingFace `spacy-transformers` / LLMs.
   - Multi-language translation & transliteration support (Hindi, Hinglish, regional languages to English).

2. **Graph Analytics & Intelligence (NetworkX + Cytoscape.js)**:
   - Entity-Relationship Knowledge Graph generation across Suspects, Victims, Witnesses, Vehicles, Phones, Bank Accounts, Locations, and Cases.
   - Centrality computation: Degree, Betweenness, Closeness, and PageRank to identify key kingpins, facilitators, and money mules.
   - Louvain Community Detection to discover hidden crime syndicates and sub-cells.
   - Shortest Path / Multi-hop link discovery between disparate suspects.

3. **Cross-Case Link Analysis & Cold Case Matching**:
   - TF-IDF + Cosine similarity engine for Modus Operandi (MO) and incident matching.
   - Shared identifier overlap detection (common phone numbers, bank accounts, vehicles across unlinked FIRs).
   - Multi-FIR correlation matrices.

4. **Anomaly & Threat Scoring Engine**:
   - Multi-factor risk heuristics: Network centrality, criminal history / past cases, weapon mentions, transaction frequency, and high-degree bridge positioning.
   - Risk categorization: Low (0-30), Moderate (31-60), High (61-80), Critical (81-100).
   - Automated alerts on syndicate burst activity, burner phone clusters, and structuring/smurfing money flows.

5. **Geospatial & Spatiotemporal Incident Analysis**:
   - Interactive OpenStreetMap (Leaflet) visualization of crime scenes, suspect movements, cell tower pings, and rendezvous points.
   - Clustered heatmap views and chronological timeline scrubbers.

6. **Tamper-Evident Evidence Ledger**:
   - Cryptographic SHA-256 digital fingerprinting and chained audit logging.
   - Immutable timeline of evidence chain-of-custody and user access tracking (RBAC).

7. **Conversational AI Investigation Assistant**:
   - Context-aware copilot capable of answering natural-language queries about entities, connections, timelines, and case summaries.
   - Direct citations to underlying evidence tokens with strict analytical disclaimers.

8. **Automated Intelligence Dossier Export**:
   - One-click Case Summary & PDF/JSON analytical briefing report generation.

---

## 🏗️ Architecture & Tech Stack

```
d:/SIH/
├── backend/
│   ├── app/
│   │   ├── api/routes/          # FastAPI REST Endpoints (auth, cases, entities, graph, timeline, cross-case, alerts, evidence, assistant, reports, audit)
│   │   ├── models/              # SQLAlchemy Database ORM Models
│   │   ├── schemas/             # Pydantic Schemas for Request/Response validation
│   │   ├── security/            # JWT Auth, Password Hashing, RBAC
│   │   ├── services/            # NLP, Graph Analytics, Anomaly, Similarity, Evidence, Report, Assistant
│   │   ├── config.py            # App Settings & Environment Configuration
│   │   ├── database.py          # SQLAlchemy Session Factory & DB Init
│   │   └── main.py              # FastAPI Main Entrypoint & Middleware
│   ├── generate_data.py         # Synthetic Data Generator (10 Realistic Cases, 100+ Entities)
│   ├── requirements.txt         # Python Backend Dependencies
│   └── tests/                   # Pytest Integration & Unit Test Suite
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable UI & Visualizers (Cytoscape Graph, Leaflet Map, Timeline, Chat Drawer, Badges)
│   │   ├── context/             # Auth Context & State Management
│   │   ├── pages/               # Dashboard, Cases, CaseDetail, Entities, EntityDetail, Graph, CrossCase, Timeline, Map, Alerts, Evidence, Reports, AuditLogs, Settings, Login
│   │   ├── services/            # Axios API Clients
│   │   ├── types/               # TypeScript Type Definitions
│   │   ├── App.tsx              # Router & Shell
│   │   └── main.tsx             # React DOM Entrypoint
│   ├── package.json             # Frontend Dependencies & Scripts
│   ├── tailwind.config.js       # Modern Dark Mode Palette & Styling
│   └── vite.config.ts           # Vite Build Configuration
├── data/                        # Sample FIR Documents & Export Storage
├── docker-compose.yml           # Multi-container Deployment Config
└── .env.example                 # Configuration Template
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.10+**
- **Node.js 18+ & npm**
- *(Optional)* Docker & Docker Compose

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Generate Synthetic Investigation Data
```bash
python generate_data.py
```
*This populates `crimegraph.db` with 10 synthetic Indian law-enforcement case FIRs (cyber fraud syndicates, illicit supply chains, vehicle theft rings, hawala networks), 100+ entities, phone numbers, vehicles, bank transactions, and audit logs.*

### 3. Start Backend Server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)
- Interactive OpenAPI Specs: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### 4. Start Frontend Client
```bash
cd ../frontend
npm install
npm run dev
```
- Web Application: [http://localhost:5173](http://localhost:5173)

---

## 🔑 Default Investigator Credentials

| Role | Username | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Lead Investigator** | `investigator` | `demo123` | Full Access: Cases, Graph Analysis, Ingestion, Reports, Evidence |
| **System Admin** | `admin` | `admin123` | User Management, Audit Logs, Global Configuration |
| **Junior Analyst** | `analyst` | `analyst123` | Read-only graph exploration, Case review, Query assistant |

> [!NOTE]
> Demo accounts can be disabled in production by setting `ENABLE_DEMO_USERS=false` in environment variables.

---

## 🌐 Production Deployment on Render

CrimeGraph AI is fully pre-configured for automated or manual deployment on Render using the included [`render.yaml`](./render.yaml) Blueprint or individual Render services.

### Option A: 1-Click Render Blueprint (Recommended)
1. Push this repository to GitHub.
2. In the Render Dashboard, click **New +** > **Blueprint**.
3. Connect your repository. Render reads `render.yaml` and provisions:
   - **Render PostgreSQL**: Managed persistent database (`crimegraph-db`).
   - **Backend Web Service**: Python 3.11 FastAPI server (`crimegraph-backend`).
   - **Frontend Static Site**: React/Vite client (`crimegraph-frontend`) with SPA rewrites.
4. Once deployed:
   - Copy the deployed frontend URL (e.g. `https://crimegraph-frontend.onrender.com`) and paste into backend `CORS_ORIGINS`.
   - Copy the backend URL (e.g. `https://crimegraph-backend.onrender.com`) and set as `VITE_API_BASE_URL` on the frontend static site environment, then trigger a quick redeploy.

### Option B: Manual Service Setup on Render

#### 1. PostgreSQL Database
- **Name**: `crimegraph-postgres`
- **Database**: `crimegraph`
- **User**: `crimegraph`
- Copy the **Internal Database URL** for the backend.

#### 2. Backend Web Service
- **Runtime**: Python 3
- **Root Directory**: `backend`
- **Build Command**: `pip install -r requirements.txt && python -m spacy download en_core_web_sm`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Health Check Path**: `/health`
- **Environment Variables**:
  - `DATABASE_URL`: *(Your Render PostgreSQL Connection String)*
  - `JWT_SECRET`: *(Generate via `python -c "import secrets; print(secrets.token_urlsafe(64))"`)*
  - `ENVIRONMENT`: `production`
  - `CORS_ORIGIN_REGEX`: `^https:\/\/.*\.onrender\.com$`
  - `ENABLE_DEMO_USERS`: `true` *(or `false` for hardened production)*
  - `AUTO_SEED_DEMO_DATA`: `true` *(seeds synthetic demonstration cases safely on first boot without resetting)*

#### 3. Frontend Static Site
- **Runtime**: Static Site
- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Routes / Rewrites**: `/*` → `/index.html` (SPA routing)
- **Environment Variables**:
  - `VITE_API_BASE_URL`: `https://your-backend-name.onrender.com`

---

## 🐳 Docker & Docker Compose Deployment

```bash
# Set your production JWT secret and DB password
cp .env.example .env

# Build and start all services (PostgreSQL, Backend, Frontend)
docker compose up -d --build
```
- Frontend: `http://localhost:80`
- Backend API & Docs: `http://localhost:8000/docs`
- Healthcheck: `http://localhost:8000/health`

---

## 🧪 Running Automated Tests

```bash
cd backend
pytest tests/ -v
```

---

## 🔒 Security & Privacy Features
- **Zero Raw PII Leaks**: Built-in pseudonymization filters.
- **SHA-256 Evidence Hashing**: Every uploaded FIR, document, and note is cryptographically hashed upon ingestion.
- **Role-Based Access Control (RBAC)**: Fine-grained permissions enforced at the API layer.
- **Immutable Audit Trail**: User actions (login, view, search, export, delete) are recorded in the audit ledger.

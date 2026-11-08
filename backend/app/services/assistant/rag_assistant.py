import re
import os
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.config import settings
from app.models.case import Case
from app.models.entity import Person, Phone, Vehicle, Location, Organization, Transaction, Document, Event, ExtractedEntity, Alert
from app.models.relationship import Relationship
from app.services.graph.network_service import NetworkGraphService
from app.services.similarity.case_similarity import find_cross_case_links, find_similar_cases
from app.services.anomaly.anomaly_detector import detect_anomalies_and_patterns

def process_assistant_query(query: str, db: Session, case_id: Optional[int] = None, scope: Optional[str] = "global") -> Dict[str, Any]:
    q_lower = query.lower().strip()
    sources = []
    answer = ""
    confidence = 0.95

    # Fetch context data from database
    cases = db.query(Case).all()
    documents = db.query(Document).all()
    persons = db.query(Person).all()
    phones = db.query(Phone).all()
    vehicles = db.query(Vehicle).all()
    locations = db.query(Location).all()
    organizations = db.query(Organization).all()
    transactions = db.query(Transaction).all()
    events = db.query(Event).all()
    relationships = db.query(Relationship).all()
    
    doc_map = {d.id: d for d in documents}
    case_map = {c.id: c for c in cases}
    person_map = {p.id: p for p in persons}

    # Case focus filter if requested
    if case_id and case_id in case_map and scope == "case":
        documents = [d for d in documents if d.case_id == case_id]
        transactions = [t for t in transactions if t.case_id == case_id]
        events = [e for e in events if e.case_id == case_id]
        relationships = [r for r in relationships if r.case_id == case_id]

    # Helper function to add traceable source
    seen_sources = set()
    def add_source(doc_id: Optional[int], doc_code: str, case_num: str, filename: str, snippet: str, date: str = ""):
        key = (doc_code, filename, snippet[:50])
        if key not in seen_sources:
            seen_sources.add(key)
            sources.append({
                "document_id": doc_id,
                "document_code": doc_code,
                "case_number": case_num,
                "filename": filename,
                "date": date or "Active Record",
                "relevance_snippet": snippet
            })

    # Strategy 1: Explicit Case Number or Specific Case Search
    matched_case = None
    if case_id and case_id in case_map:
        matched_case = case_map[case_id]
    else:
        for c in cases:
            if c.case_number.lower() in q_lower or (len(c.title) > 4 and c.title.lower() in q_lower):
                matched_case = c
                break

    if matched_case and ("summarize" in q_lower or "summary" in q_lower or "case" in q_lower or "dossier" in q_lower or "detail" in q_lower or "about" in q_lower or matched_case.case_number.lower() in q_lower):
        c = matched_case
        case_docs = [d for d in documents if d.case_id == c.id]
        case_rels = [r for r in relationships if r.case_id == c.id]
        case_evts = [e for e in events if e.case_id == c.id]
        case_txns = [t for t in transactions if t.case_id == c.id]
        
        # Collect distinct entities involved in this case
        entity_nodes = set()
        for r in case_rels:
            entity_nodes.add(f"{r.source_entity_type}: {r.source_entity_id}")
            entity_nodes.add(f"{r.target_entity_type}: {r.target_entity_id}")

        answer = f"### Case Dossier: {c.case_number} — {c.title}\n\n"
        answer += f"- **Status**: `{c.status}` | **Classification**: `{c.case_type}`\n"
        answer += f"- **Overview**: {c.description or 'Case active in repository.'}\n"
        answer += f"- **Key Metrics**: {len(case_docs)} Ingested Document(s), {len(case_rels)} Relationship Link(s), {len(case_evts)} Recorded Event(s).\n\n"
        
        if entity_nodes:
            answer += f"**Identified Entities ({len(entity_nodes)})**:\n"
            for en in list(entity_nodes)[:6]:
                answer += f"  - {en}\n"
            if len(entity_nodes) > 6:
                answer += f"  - *...and {len(entity_nodes) - 6} more entities in knowledge graph*\n"
            answer += "\n"

        if case_evts:
            answer += "**Timeline Highlights**:\n"
            for ev in sorted(case_evts, key=lambda x: x.timestamp or x.id)[:3]:
                ev_time = ev.timestamp.strftime("%Y-%m-%d %H:%M") if hasattr(ev.timestamp, "strftime") else str(ev.timestamp)
                answer += f"  - `{ev_time}`: [{ev.event_type}] {ev.description}\n"
            answer += "\n"

        if case_txns:
            total_amt = sum(t.amount for t in case_txns)
            answer += f"**Financial Trails**: {len(case_txns)} transaction(s) totaling **₹{total_amt:,.2f}**.\n"

        for d in case_docs[:5]:
            d_date = d.uploaded_at.strftime("%Y-%m-%d") if hasattr(d.uploaded_at, "strftime") else str(d.uploaded_at)
            add_source(
                doc_id=d.id,
                doc_code=d.document_code,
                case_num=c.case_number,
                filename=d.filename,
                snippet=d.extracted_text[:180] if d.extracted_text else f"Case {c.case_number} dossier file.",
                date=d_date
            )
        confidence = 0.98

    # Strategy 2: Specific Person / Suspect / Phone / Vehicle Search
    elif any(term in q_lower for term in ["who is", "person", "suspect", "victim", "phone", "mobile", "vehicle", "car", "bike", "location", "address", "organization", "p0", "ph0", "v0"]) or any(p.name.lower() in q_lower for p in persons if len(p.name) > 3) or any(v.registration_number.lower().replace(" ", "").replace("-", "") in q_lower.replace(" ", "").replace("-", "") for v in vehicles) or any(ph.masked_number in q_lower for ph in phones):
        
        # Check matching person
        matched_person = None
        for p in persons:
            if (p.name and len(p.name) > 2 and p.name.lower() in q_lower) or (p.person_code and p.person_code.lower() in q_lower) or (p.aliases and any(a.strip().lower() in q_lower for a in p.aliases.split(","))):
                matched_person = p
                break

        # Check matching phone
        matched_phone = None
        for ph in phones:
            cleaned_ph = re.sub(r'[\s\-\+]', '', ph.masked_number)
            cleaned_q = re.sub(r'[\s\-\+]', '', q_lower)
            if (cleaned_ph and len(cleaned_ph) >= 7 and cleaned_ph in cleaned_q) or (ph.phone_code and ph.phone_code.lower() in q_lower):
                matched_phone = ph
                break

        # Check matching vehicle
        matched_vehicle = None
        for v in vehicles:
            clean_v = re.sub(r'[\s\-]', '', v.registration_number.lower())
            clean_q = re.sub(r'[\s\-]', '', q_lower)
            if (clean_v and len(clean_v) >= 5 and clean_v in clean_q) or (v.vehicle_code and v.vehicle_code.lower() in q_lower):
                matched_vehicle = v
                break

        # Check matching location
        matched_location = None
        for loc in locations:
            if loc.name and len(loc.name) > 3 and loc.name.lower() in q_lower:
                matched_location = loc
                break

        if matched_person:
            p = matched_person
            # Find all relationships mentioning this person
            person_rels = [
                r for r in relationships 
                if r.source_entity_id == p.name or r.target_entity_id == p.name or r.source_entity_id == p.person_code or r.target_entity_id == p.person_code
            ]
            
            # Find phones owned
            owned_phones = [ph.masked_number for ph in phones if ph.owner_person_id == p.id]
            owned_vehicles = [v.registration_number for v in vehicles if v.owner_person_id == p.id]
            
            case_ids = list(set([r.case_id for r in person_rels if r.case_id]))
            case_names = [case_map[cid].case_number for cid in case_ids if cid in case_map]

            answer = f"### Entity Dossier: {p.name} (`{p.person_code}`)\n\n"
            if p.aliases:
                answer += f"- **Known Aliases**: {p.aliases}\n"
            if p.date_of_birth:
                answer += f"- **DOB**: {p.date_of_birth}\n"
            if p.notes:
                answer += f"- **Investigative Notes**: {p.notes}\n"
            if owned_phones:
                answer += f"- **Associated Mobile(s)**: {', '.join(owned_phones)}\n"
            if owned_vehicles:
                answer += f"- **Registered Vehicle(s)**: {', '.join(owned_vehicles)}\n"
            answer += f"- **Linked Cases ({len(case_names)})**: {', '.join(case_names) if case_names else 'No direct case association'}\n\n"
            
            if person_rels:
                answer += f"**Direct Network Graph Connections ({len(person_rels)})**:\n"
                for r in person_rels[:6]:
                    other_entity = r.target_entity_id if (r.source_entity_id == p.name or r.source_entity_id == p.person_code) else r.source_entity_id
                    answer += f"  - **{r.relationship_type}** → `{other_entity}` (Confidence: {int(r.confidence*100)}%)\n"
                    if r.source_document_id and r.source_document_id in doc_map:
                        d = doc_map[r.source_document_id]
                        add_source(
                            doc_id=d.id,
                            doc_code=d.document_code,
                            case_num=case_map.get(d.case_id, Case(case_number="")).case_number,
                            filename=d.filename,
                            snippet=r.explanation or f"Direct connection: {p.name} {r.relationship_type} {other_entity}"
                        )
            confidence = 0.96

        elif matched_phone:
            ph = matched_phone
            owner = person_map.get(ph.owner_person_id)
            phone_rels = [
                r for r in relationships
                if r.source_entity_id == ph.masked_number or r.target_entity_id == ph.masked_number or r.source_entity_id == ph.phone_code or r.target_entity_id == ph.phone_code
            ]
            c_ids = list(set([r.case_id for r in phone_rels if r.case_id]))
            c_nums = [case_map[cid].case_number for cid in c_ids if cid in case_map]

            answer = f"### Phone Record Analysis: `{ph.masked_number}` ({ph.phone_code})\n\n"
            answer += f"- **Subscriber / Operator**: {owner.name if owner else 'Unassigned / Extracted from CDR'}\n"
            answer += f"- **Cross-Case Appearances ({len(c_nums)})**: {', '.join(c_nums) if c_nums else 'Single Case'}\n"
            answer += f"- **Total Call / Association Links**: {len(phone_rels)} interactions in graph.\n\n"

            if phone_rels:
                answer += "**Observed Communication Nodes**:\n"
                for r in phone_rels[:5]:
                    tgt = r.target_entity_id if r.source_entity_id in [ph.masked_number, ph.phone_code] else r.source_entity_id
                    answer += f"  - `{r.relationship_type}` ↔ `{tgt}`\n"
                    if r.source_document_id and r.source_document_id in doc_map:
                        d = doc_map[r.source_document_id]
                        add_source(
                            doc_id=d.id,
                            doc_code=d.document_code,
                            case_num=case_map.get(d.case_id, Case(case_number="")).case_number,
                            filename=d.filename,
                            snippet=r.explanation or f"Phone link {ph.masked_number} to {tgt}"
                        )
            confidence = 0.95

        elif matched_vehicle:
            v = matched_vehicle
            owner = person_map.get(v.owner_person_id)
            v_rels = [
                r for r in relationships
                if r.source_entity_id == v.registration_number or r.target_entity_id == v.registration_number or r.source_entity_id == v.vehicle_code or r.target_entity_id == v.vehicle_code
            ]
            c_ids = list(set([r.case_id for r in v_rels if r.case_id]))
            c_nums = [case_map[cid].case_number for cid in c_ids if cid in case_map]

            answer = f"### Vehicle Intelligence Dossier: `{v.registration_number}`\n\n"
            answer += f"- **Type**: `{v.vehicle_type}` | **Code**: `{v.vehicle_code}`\n"
            answer += f"- **Registered To**: {owner.name if owner else 'Extracted from FIR / ANPR Log'}\n"
            answer += f"- **Active Cases Linked**: {', '.join(c_nums) if c_nums else 'Recorded in Database'}\n\n"

            if v_rels:
                answer += "**Vehicle Graph Connections**:\n"
                for r in v_rels[:5]:
                    tgt = r.target_entity_id if r.source_entity_id in [v.registration_number, v.vehicle_code] else r.source_entity_id
                    answer += f"  - `{r.relationship_type}` ↔ `{tgt}`\n"
                    if r.source_document_id and r.source_document_id in doc_map:
                        d = doc_map[r.source_document_id]
                        add_source(
                            doc_id=d.id,
                            doc_code=d.document_code,
                            case_num=case_map.get(d.case_id, Case(case_number="")).case_number,
                            filename=d.filename,
                            snippet=r.explanation or f"Vehicle {v.registration_number} linked to {tgt}"
                        )
            confidence = 0.95

        elif matched_location:
            loc = matched_location
            answer = f"### Location Intelligence: {loc.name} (`{loc.location_code}`)\n\n"
            if loc.address:
                answer += f"- **Address**: {loc.address}\n"
            if loc.latitude and loc.longitude:
                answer += f"- **Coordinates**: Latitude `{loc.latitude}`, Longitude `{loc.longitude}`\n"
            confidence = 0.92

        else:
            # Fallback to search extracted entities
            raw_matches = db.query(ExtractedEntity).filter(
                (ExtractedEntity.entity_value.ilike(f"%{q_lower}%")) | (ExtractedEntity.normalized_value.ilike(f"%{q_lower}%"))
            ).limit(6).all()

            if raw_matches:
                answer = f"### Extracted Entity Findings for '{query}':\n\n"
                for em in raw_matches:
                    doc = doc_map.get(em.document_id)
                    case_num = case_map.get(doc.case_id, Case(case_number="")).case_number if doc else "N/A"
                    answer += f"- **[{em.entity_type}]** `{em.entity_value}` (Doc: `{doc.document_code if doc else 'N/A'}` in Case: `{case_num}`)\n"
                    if doc:
                        add_source(
                            doc_id=doc.id,
                            doc_code=doc.document_code,
                            case_num=case_num,
                            filename=doc.filename,
                            snippet=f"Extracted {em.entity_type} '{em.entity_value}' at index {em.start_position}."
                        )
                confidence = 0.90
            else:
                answer = f"Entity matching '{query}' was not found in the verified repository. Upload additional FIR documents or check spelling."
                confidence = 0.70

    # Strategy 3: Financial Transactions & Money Trail Search
    elif any(term in q_lower for term in ["transaction", "money", "transfer", "amount", "payment", "bank", "account", "₹", "rs", "lakh", "crore", "txn"]):
        txns = transactions
        total_volume = sum(t.amount for t in txns) if txns else 0.0
        high_val_txns = [t for t in txns if t.amount >= 50000]

        answer = f"### Financial Trail Intelligence ({len(txns)} Total Recorded Transactions)\n\n"
        answer += f"- **Aggregate Volume Tracked**: **₹{total_volume:,.2f}**\n"
        answer += f"- **High-Value Flags (≥ ₹50,000)**: {len(high_val_txns)} transfer(s)\n\n"

        if txns:
            answer += "**Notable Transaction Records**:\n"
            for t in sorted(txns, key=lambda x: x.amount, reverse=True)[:5]:
                t_date = t.timestamp.strftime("%Y-%m-%d") if hasattr(t.timestamp, "strftime") else str(t.timestamp)
                c_num = case_map[t.case_id].case_number if t.case_id and t.case_id in case_map else "Unassigned"
                answer += f"- **₹{t.amount:,.2f}** via `{t.transaction_type}`: `{t.sender_entity}` → `{t.receiver_entity}` (`{t.transaction_code}`, Date: {t_date}, Case: {c_num})\n"
                
                # Check for matching document
                c_docs = [d for d in documents if d.case_id == t.case_id]
                if c_docs:
                    d = c_docs[0]
                    add_source(
                        doc_id=d.id,
                        doc_code=d.document_code,
                        case_num=c_num,
                        filename=d.filename,
                        snippet=f"Transaction {t.transaction_code}: {t.sender_entity} to {t.receiver_entity} of ₹{t.amount:,.2f}"
                    )
        confidence = 0.94

    # Strategy 4: Chronological Events & Timeline
    elif any(term in q_lower for term in ["timeline", "event", "when", "date", "happen", "chronolog", "sequence"]):
        evts = events
        answer = f"### Chronological Investigation Events ({len(evts)} Total Events Recorded)\n\n"
        if evts:
            for ev in sorted(evts, key=lambda x: x.timestamp or x.id)[:6]:
                e_date = ev.timestamp.strftime("%Y-%m-%d %H:%M") if hasattr(ev.timestamp, "strftime") else str(ev.timestamp)
                c_num = case_map[ev.case_id].case_number if ev.case_id and ev.case_id in case_map else "N/A"
                answer += f"- `{e_date}` **[{ev.event_type}]** ({c_num}): {ev.description}\n"
                if ev.source_document_id and ev.source_document_id in doc_map:
                    d = doc_map[ev.source_document_id]
                    add_source(
                        doc_id=d.id,
                        doc_code=d.document_code,
                        case_num=c_num,
                        filename=d.filename,
                        snippet=ev.description
                    )
        else:
            answer += "No timeline events recorded yet. Ingest documents to automatically populate case milestones."
        confidence = 0.93

    # Strategy 5: Network Graph Centrality & Top Hubs
    elif any(term in q_lower for term in ["connected", "central", "hub", "important", "top", "prioritized", "network", "graph"]):
        graph_svc = NetworkGraphService(db)
        top = graph_svc.get_top_key_entities(limit=6)
        
        answer = "### Network Graph Centrality & High-Priority Hubs\n\n"
        if top:
            for k in top:
                answer += f"- **{k['entity_name']}** (`{k['entity_type']}`): **{k['connections_count']}** direct connections (Degree Centrality: `{k['degree_centrality']}`)\n"
            answer += "\n*These entities act as primary bridge nodes or communication hubs connecting multiple investigation branches.*"
            
            # Add sources for top entity
            if top:
                first_ent = top[0]["entity_name"]
                top_rels = [r for r in relationships if r.source_entity_id == first_ent or r.target_entity_id == first_ent]
                for r in top_rels[:3]:
                    if r.source_document_id and r.source_document_id in doc_map:
                        d = doc_map[r.source_document_id]
                        add_source(
                            doc_id=d.id,
                            doc_code=d.document_code,
                            case_num=case_map.get(d.case_id, Case(case_number="")).case_number,
                            filename=d.filename,
                            snippet=r.explanation or f"Key hub connection involving {first_ent}"
                        )
        else:
            answer += "Knowledge graph is currently building. Ingest FIR documents to compute centrality scores."
        confidence = 0.95

    # Strategy 6: Cross-Case Linkages & Shared Nodes
    elif any(term in q_lower for term in ["cross", "share", "overlap", "linked", "common", "repeat"]):
        cross_links = find_cross_case_links(db)
        answer = f"### Cross-Case Intelligence Linkages ({len(cross_links)} Detected)\n\n"
        if cross_links:
            for cl in cross_links[:6]:
                answer += f"- **{cl['case_a_number']} ↔ {cl['case_b_number']}**: Shared **{cl['shared_entity_type']}** `{cl['shared_entity_value']}` (Confidence: `{int(cl['confidence']*100)}%`)\n"
                for s in cl["sources"]:
                    add_source(
                        doc_id=None,
                        doc_code="CROSS-REF",
                        case_num=f"{cl['case_a_number']} & {cl['case_b_number']}",
                        filename=s,
                        snippet=f"Shared entity {cl['shared_entity_type']} '{cl['shared_entity_value']}' connects both investigation dossiers."
                    )
        else:
            answer += "No cross-case entity overlaps currently detected across active investigation dossiers."
        confidence = 0.96

    # Strategy 7: Anomalies, Patterns & Fraud Alerts
    elif any(term in q_lower for term in ["anomal", "pattern", "flag", "suspicious", "fraud", "deviation", "alert"]):
        anomalies = detect_anomalies_and_patterns(db)
        answer = f"### Detected Analytical Anomalies & Patterns ({len(anomalies)} Leads)\n\n"
        if anomalies:
            for a in anomalies[:5]:
                answer += f"- **[{a['severity']}] {a['alert_type']}**: {a['explanation']}\n"
        else:
            answer += "No significant anomalies or transaction burst patterns detected at this time."
        confidence = 0.93

    # Strategy 8: Full-Text Document Keyword Search
    else:
        # Perform keyword search across all extracted document text
        keywords = [w for w in re.findall(r'\b\w{3,}\b', q_lower) if w not in ["the", "and", "for", "with", "what", "are", "show", "tell", "from", "this", "that"]]
        matched_doc_snippets = []
        
        for d in documents:
            if d.extracted_text:
                d_text_lower = d.extracted_text.lower()
                match_count = sum(1 for kw in keywords if kw in d_text_lower)
                if match_count > 0:
                    # Find snippet around first match
                    for kw in keywords:
                        pos = d_text_lower.find(kw)
                        if pos != -1:
                            start = max(0, pos - 60)
                            end = min(len(d.extracted_text), pos + 140)
                            snippet = d.extracted_text[start:end].replace("\n", " ").strip()
                            matched_doc_snippets.append((match_count, d, snippet))
                            break

        if matched_doc_snippets:
            matched_doc_snippets.sort(key=lambda x: x[0], reverse=True)
            answer = f"### Intelligence Search Results for '{query}':\n\n"
            for score, d, snip in matched_doc_snippets[:4]:
                c_num = case_map[d.case_id].case_number if d.case_id in case_map else "General"
                answer += f"- **Case {c_num}** (`{d.filename}`, `{d.document_code}`):\n  *\"{snip}\"*\n\n"
                add_source(
                    doc_id=d.id,
                    doc_code=d.document_code,
                    case_num=c_num,
                    filename=d.filename,
                    snippet=snip
                )
            confidence = 0.88
        else:
            # General system intelligence summary
            answer = (
                f"### CrimeGraph Knowledge Base Overview\n\n"
                f"- **Active Cases**: {len(cases)} registered dossiers\n"
                f"- **Indexed Documents**: {len(documents)} FIRs, CDRs, and reports\n"
                f"- **Entity Repository**: {len(persons)} Persons, {len(phones)} Mobile Numbers, {len(vehicles)} Vehicles\n"
                f"- **Graph Relationships**: {len(relationships)} verifiable linkage connections\n\n"
                f"**Suggested Queries**:\n"
                f"- `Who are the most connected suspects?`\n"
                f"- `Summarize FIR-2024-0001`\n"
                f"- `Find vehicle KA01AB1234 or phone 9876543210`\n"
                f"- `What financial transactions were recorded?`\n"
                f"- `Are there any cross-case entity overlaps?`"
            )
            confidence = 0.85

    return {
        "query": query,
        "answer": answer,
        "confidence": confidence,
        "sources": sources,
        "disclaimer": "Requires investigator verification."
    }


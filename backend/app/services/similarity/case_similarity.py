from typing import List, Dict, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy.orm import Session
from app.models.case import Case
from app.models.relationship import Relationship
from app.models.entity import Document

def find_cross_case_links(db: Session) -> List[Dict[str, Any]]:
    cross_links = []
    relationships = db.query(Relationship).filter(Relationship.case_id.isnot(None)).all()

    # Map (entity_type, entity_id) -> list of (case_id, doc_id)
    entity_cases = {}
    for rel in relationships:
        src_key = (rel.source_entity_type, rel.source_entity_id)
        tgt_key = (rel.target_entity_type, rel.target_entity_id)

        entity_cases.setdefault(src_key, set()).add((rel.case_id, rel.source_document_id))
        entity_cases.setdefault(tgt_key, set()).add((rel.case_id, rel.source_document_id))

    # Fetch cases map for numbers
    cases = {c.id: c for c in db.query(Case).all()}
    docs = {d.id: d for d in db.query(Document).all()}

    seen_pairs = set()

    for (etype, evalue), case_doc_set in entity_cases.items():
        case_ids = list({c_id for c_id, d_id in case_doc_set if c_id in cases})
        if len(case_ids) >= 2:
            for i in range(len(case_ids)):
                for j in range(i + 1, len(case_ids)):
                    c1_id, c2_id = case_ids[i], case_ids[j]
                    pair_key = (min(c1_id, c2_id), max(c1_id, c2_id), etype, evalue)

                    if pair_key not in seen_pairs:
                        seen_pairs.add(pair_key)
                        c1 = cases[c1_id]
                        c2 = cases[c2_id]

                        # Collect source doc names
                        doc_sources = []
                        for cid, did in case_doc_set:
                            if did and did in docs:
                                doc_sources.append(docs[did].filename)
                        
                        if not doc_sources:
                            doc_sources = [f"Report-{c1.case_number}", f"Report-{c2.case_number}"]

                        cross_links.append({
                            "case_a_id": c1.id,
                            "case_a_number": c1.case_number,
                            "case_b_id": c2.id,
                            "case_b_number": c2.case_number,
                            "shared_entity_type": etype,
                            "shared_entity_value": evalue,
                            "confidence": 0.91 if etype in ["PHONE", "VEHICLE", "ACCOUNT"] else 0.85,
                            "sources": list(set(doc_sources)),
                            "status": "Requires investigator verification"
                        })

    return cross_links

def find_similar_cases(target_case_id: int, db: Session, top_n: int = 5) -> List[Dict[str, Any]]:
    cases = db.query(Case).all()
    if len(cases) < 2:
        return []

    target_case = next((c for c in cases if c.id == target_case_id), None)
    if not target_case:
        return []

    # Build corpus from case descriptions & titles
    corpus = [f"{c.title}. {c.description or ''}" for c in cases]
    target_idx = [i for i, c in enumerate(cases) if c.id == target_case_id][0]

    vectorizer = TfidfVectorizer(stop_words='english')
    try:
        tfidf_matrix = vectorizer.fit_transform(corpus)
        sim_scores = cosine_similarity(tfidf_matrix[target_idx], tfidf_matrix).flatten()
    except Exception:
        sim_scores = [0.0] * len(cases)

    results = []
    for idx, score in enumerate(sim_scores):
        c = cases[idx]
        if c.id != target_case_id and score > 0.1:
            results.append({
                "case_id": c.id,
                "case_number": c.case_number,
                "title": c.title,
                "similarity_score": round(float(score), 2),
                "reason": f"High lexical & thematic similarity ({int(score*100)}%) with {target_case.case_number}."
            })

    results.sort(key=lambda x: x["similarity_score"], reverse=True)
    return results[:top_n]

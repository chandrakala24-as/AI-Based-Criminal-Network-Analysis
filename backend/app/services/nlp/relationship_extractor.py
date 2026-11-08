import re
from typing import List, Dict, Any

RELATIONSHIP_VERBS = {
    "CONTACTED": ["contacted", "called", "messaged", "spoke with", "communicated with", "texted"],
    "KNOWS": ["knows", "associated with", "friend of", "associate of", "accomplice of", "links with"],
    "USES": ["uses", "operating phone", "contacted using", "owner of", "registered to"],
    "ASSOCIATED_WITH": ["associated with", "seen near", "drove", "operating vehicle", "linked to"],
    "LOCATED_AT": ["seen near", "located at", "resides at", "spotted at", "observed near"],
    "MEMBER_OF": ["member of", "works at", "employed by", "affiliated with"],
    "INVOLVED_IN": ["involved in", "suspect in", "witness in", "complainant in"],
    "TRANSFERRED_TO": ["transferred", "sent money to", "paid", "wired"]
}

def extract_relationships_from_text_and_entities(
    text: str,
    entities: List[Dict[str, Any]],
    case_id: int = None,
    document_id: int = None
) -> List[Dict[str, Any]]:
    relationships = []
    seen = set()

    # Group entities by type
    persons = [e for e in entities if e["entity_type"] == "PERSON"]
    phones = [e for e in entities if e["entity_type"] == "PHONE"]
    vehicles = [e for e in entities if e["entity_type"] == "VEHICLE"]
    locations = [e for e in entities if e["entity_type"] == "LOCATION"]
    orgs = [e for e in entities if e["entity_type"] == "ORGANIZATION"]
    accounts = [e for e in entities if e["entity_type"] == "ACCOUNT"]
    cases = [e for e in entities if e["entity_type"] == "CASE_ID"]
    evidences = [e for e in entities if e["entity_type"] == "EVIDENCE"]

    text_lower = text.lower()

    # 1. PERSON -> CONTACTED -> PERSON or KNOWS -> PERSON
    for i in range(len(persons)):
        for j in range(i + 1, len(persons)):
            p1 = persons[i]["normalized_value"]
            p2 = persons[j]["normalized_value"]
            rel_type = "KNOWS"
            for verb in RELATIONSHIP_VERBS["CONTACTED"]:
                if verb in text_lower:
                    rel_type = "CONTACTED"
                    break

            key = ("PERSON", p1, "PERSON", p2, rel_type)
            if key not in seen and p1 != p2:
                seen.add(key)
                relationships.append({
                    "source_entity_type": "PERSON",
                    "source_entity_id": p1,
                    "target_entity_type": "PERSON",
                    "target_entity_id": p2,
                    "relationship_type": rel_type,
                    "confidence": 0.90,
                    "case_id": case_id,
                    "source_document_id": document_id,
                    "explanation": f"Document text indicates relationship '{rel_type}' between {p1} and {p2}."
                })

    # 2. PERSON -> USES -> PHONE
    for p in persons:
        for ph in phones:
            p_val = p["normalized_value"]
            ph_val = ph["normalized_value"]
            key = ("PERSON", p_val, "PHONE", ph_val, "USES")
            if key not in seen:
                seen.add(key)
                relationships.append({
                    "source_entity_type": "PERSON",
                    "source_entity_id": p_val,
                    "target_entity_type": "PHONE",
                    "target_entity_id": ph_val,
                    "relationship_type": "USES",
                    "confidence": 0.92,
                    "case_id": case_id,
                    "source_document_id": document_id,
                    "explanation": f"{p_val} identified using or linked to phone {ph_val}."
                })

    # 3. PHONE -> CONNECTED_TO -> PHONE (if multiple phones in document)
    for i in range(len(phones)):
        for j in range(i + 1, len(phones)):
            ph1 = phones[i]["normalized_value"]
            ph2 = phones[j]["normalized_value"]
            key = ("PHONE", ph1, "PHONE", ph2, "CONNECTED_TO")
            if key not in seen and ph1 != ph2:
                seen.add(key)
                relationships.append({
                    "source_entity_type": "PHONE",
                    "source_entity_id": ph1,
                    "target_entity_type": "PHONE",
                    "target_entity_id": ph2,
                    "relationship_type": "CONNECTED_TO",
                    "confidence": 0.88,
                    "case_id": case_id,
                    "source_document_id": document_id,
                    "explanation": f"Call or communication link recorded between phone {ph1} and {ph2}."
                })

    # 4. PERSON -> ASSOCIATED_WITH -> VEHICLE
    for p in persons:
        for v in vehicles:
            p_val = p["normalized_value"]
            v_val = v["normalized_value"]
            key = ("PERSON", p_val, "VEHICLE", v_val, "ASSOCIATED_WITH")
            if key not in seen:
                seen.add(key)
                relationships.append({
                    "source_entity_type": "PERSON",
                    "source_entity_id": p_val,
                    "target_entity_type": "VEHICLE",
                    "target_entity_id": v_val,
                    "relationship_type": "ASSOCIATED_WITH",
                    "confidence": 0.90,
                    "case_id": case_id,
                    "source_document_id": document_id,
                    "explanation": f"{p_val} associated with vehicle registration {v_val}."
                })

    # 5. PERSON -> LOCATED_AT -> LOCATION
    for p in persons:
        for loc in locations:
            p_val = p["normalized_value"]
            loc_val = loc["normalized_value"]
            key = ("PERSON", p_val, "LOCATION", loc_val, "LOCATED_AT")
            if key not in seen:
                seen.add(key)
                relationships.append({
                    "source_entity_type": "PERSON",
                    "source_entity_id": p_val,
                    "target_entity_type": "LOCATION",
                    "target_entity_id": loc_val,
                    "relationship_type": "LOCATED_AT",
                    "confidence": 0.85,
                    "case_id": case_id,
                    "source_document_id": document_id,
                    "explanation": f"{p_val} observed or reported near location {loc_val}."
                })

    # 6. PERSON -> MEMBER_OF -> ORGANIZATION
    for p in persons:
        for org in orgs:
            p_val = p["normalized_value"]
            o_val = org["normalized_value"]
            key = ("PERSON", p_val, "ORGANIZATION", o_val, "MEMBER_OF")
            if key not in seen:
                seen.add(key)
                relationships.append({
                    "source_entity_type": "PERSON",
                    "source_entity_id": p_val,
                    "target_entity_type": "ORGANIZATION",
                    "target_entity_id": o_val,
                    "relationship_type": "MEMBER_OF",
                    "confidence": 0.87,
                    "case_id": case_id,
                    "source_document_id": document_id,
                    "explanation": f"{p_val} affiliated with organization {o_val}."
                })

    return relationships

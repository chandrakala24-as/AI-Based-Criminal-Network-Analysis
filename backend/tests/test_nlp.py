import pytest
from app.services.nlp.extractor import extract_entities_hybrid
from app.services.nlp.relationship_extractor import extract_relationships_from_text_and_entities
from app.services.nlp.resolution import find_possible_entity_matches

def test_nlp_entity_extraction():
    sample_text = "Person A, also known as Ravi, was seen near MG Road on 12 June 2026. He was associated with vehicle KA01AB1234 and contacted Person B using phone P101."
    entities = extract_entities_hybrid(sample_text)
    
    types = [e["entity_type"] for e in entities]
    vals = [e["normalized_value"] for e in entities]

    assert "VEHICLE" in types
    assert "KA01AB1234" in vals
    assert "PHONE" in types
    assert "P101" in vals

def test_relationship_extraction():
    sample_text = "Person P001 contacted Person P002 using phone P101 near location L101."
    entities = [
        {"entity_type": "PERSON", "entity_value": "P001", "normalized_value": "P001"},
        {"entity_type": "PERSON", "entity_value": "P002", "normalized_value": "P002"},
        {"entity_type": "PHONE", "entity_value": "P101", "normalized_value": "P101"},
        {"entity_type": "LOCATION", "entity_value": "L101", "normalized_value": "L101"}
    ]
    rels = extract_relationships_from_text_and_entities(sample_text, entities, case_id=101)
    assert len(rels) >= 2
    rel_types = [r["relationship_type"] for r in rels]
    assert "KNOWS" in rel_types or "CONTACTED" in rel_types
    assert "USES" in rel_types

def test_entity_resolution_fuzzy_matching():
    matches = find_possible_entity_matches("R. Kumar", "PERSON", ["Ravi Kumar", "Vikram Singh", "Ananya Sharma"])
    assert len(matches) >= 1
    assert matches[0]["matched_entity"] == "Ravi Kumar"
    assert matches[0]["similarity_score"] >= 0.75

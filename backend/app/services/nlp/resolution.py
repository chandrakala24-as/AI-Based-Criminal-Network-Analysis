from typing import List, Dict, Any
try:
    from thefuzz import fuzz
except ImportError:
    # Simple ratio fallback if thefuzz is loading
    class fuzz:
        @staticmethod
        def ratio(s1, s2):
            s1, s2 = s1.lower(), s2.lower()
            if s1 == s2: return 100
            if s1 in s2 or s2 in s1: return 80
            return 50
        @staticmethod
        def token_sort_ratio(s1, s2):
            return fuzz.ratio(s1, s2)

def find_possible_entity_matches(
    new_entity: str,
    entity_type: str,
    existing_entities: List[str],
    threshold: int = 75
) -> List[Dict[str, Any]]:
    matches = []
    new_norm = new_entity.strip().lower()

    for existing in existing_entities:
        ext_norm = existing.strip().lower()
        if new_norm == ext_norm:
            continue # Exact match is already normalized

        score = fuzz.token_sort_ratio(new_norm, ext_norm)
        
        # Abbreviation heuristics like "R. Kumar" vs "Ravi Kumar"
        parts_new = new_norm.split()
        parts_ext = ext_norm.split()
        if len(parts_new) >= 2 and len(parts_ext) >= 2:
            if parts_new[-1] == parts_ext[-1]: # Same surname
                if parts_new[0][0] == parts_ext[0][0]: # Same initial
                    score = max(score, 82)

        if score >= threshold:
            matches.append({
                "original_entity": new_entity,
                "matched_entity": existing,
                "similarity_score": round(score / 100.0, 2),
                "entity_type": entity_type,
                "recommendation": "Possible entity match — investigator verification required."
            })

    # Sort descending by score
    matches.sort(key=lambda x: x["similarity_score"], reverse=True)
    return matches

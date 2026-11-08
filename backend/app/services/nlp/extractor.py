import re
import json
import csv
import io
from typing import List, Dict, Any, Tuple
import dateparser

# Attempt spaCy import gracefully
try:
    import spacy
    try:
        nlp_spacy = spacy.load("en_core_web_sm")
    except Exception:
        nlp_spacy = None
except ImportError:
    nlp_spacy = None

# Comprehensive Regex rules for real FIR entity extraction
REGEX_PATTERNS = {
    "VEHICLE": [
        r'\b[A-Z]{2}[-\s]?[0-9]{1,2}[-\s]?[A-Z]{1,3}[-\s]?[0-9]{4}\b', # KA01AB1234, DL-03-C-9988, MH 12 DE 1432
        r'\bVEHICLE\s+([A-Z0-9\-]+)\b',
        r'\bReg(?:istration)?\.?\s*(?:No\.?|Number)?\s*[:.-]?\s*([A-Z0-9\-\s]{6,15})\b'
    ],
    "PHONE": [
        r'\b(?:\+91[-\s]?|0)?[6-9]\d{9}\b', # Standard 10-digit Indian mobile: 9876543210, +91-9876543210
        r'\b(?:\+91[-\s]?)?[6-9]\d{4}[-\s]?\d{5}\b', # 98765 43210
        r'\bP[0-9]{3,4}\b', # P101, P1002
        r'\bPHONE\s*[:.-]?\s*([A-Z0-9\+\-]+)\b',
        r'\b(?:Mob(?:ile)?|Cell|Tel|Ph)\s*[:.-]?\s*(\+?[0-9\-\s]{10,15})\b'
    ],
    "CASE_ID": [
        r'\bFIR\s*(?:No\.?|Number)?\s*[:.-]?\s*(\d+[/\\-]\d+)\b', # FIR No. 123/2024, FIR 45/2023
        r'\bCrime\s*(?:No\.?|Number)?\s*[:.-]?\s*(\d+[/\\-]\d+)\b', # Crime No. 89/2024
        r'\bFIR-[A-Za-z0-9\-]+\b', # FIR-2024-BLR-0123
        r'\bCASE-[A-Za-z0-9\-]+\b',
        r'\bCRIME-[A-Za-z0-9\-]+\b'
    ],
    "LEGAL_SECTION": [
        r'\b(?:Sec(?:tion)?\.?|U/s|under\s+section)\s*[\d\s,/-]+(?:\([A-Za-z0-9]+\))*\s*(?:IPC|BNS|IT\s*Act|NDPS\s*Act|NDPS|Arms\s*Act|CrPC|BNSS)?\b',
        r'\b\d{3}[A-Z]?\s*(?:IPC|BNS)\b',
        r'\b66[A-F]?\s*IT\s*Act\b',
        r'\b(?:302|307|376|379|384|406|411|419|420|467|468|471|120-?B|34)\s*IPC\b'
    ],
    "UPI_ID": [
        r'\b[a-zA-Z0-9.\-_]{2,64}@(?!gmail|yahoo|hotmail|outlook)[a-zA-Z]{2,32}\b' # suspect@okhdfcbank, fraud@upi
    ],
    "IFSC": [
        r'\b[A-Z]{4}0[A-Z0-9]{6}\b' # SBIN0001234, HDFC0000456
    ],
    "MONEY": [
        r'₹\s*[\d,]+(?:\.\d{2})?', # ₹50,000
        r'Rs\.?\s*[\d,]+(?:\.\d{2})?(?:/-)?', # Rs. 50,000/-
        r'\$\s*[\d,]+(?:\.\d{2})?',
        r'\b\d+(?:\.\d+)?\s*(?:Lakhs?|Crores?|Lakh|Crore|INR|USD|Rupees|Dollars)\b'
    ],
    "EMAIL": [
        r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    ],
    "ACCOUNT": [
        r'\bACC-\d{4}-\d{4}\b',
        r'\b(?:A/c|Account|Acc|Acct)\s*(?:No\.?|Number)?\s*[:.-]?\s*(\d{9,18})\b',
        r'\bACCOUNT\s+([A-Z0-9\-]+)\b'
    ],
    "EVIDENCE": [
        r'\bEVID-\d{3,5}\b',
        r'\bEVIDENCE-\d{3,5}\b'
    ],
    "TRANSACTION": [
        r'\bTXN-\d{4,12}\b',
        r'\bUTR\s*[:.-]?\s*([A-Za-z0-9]{12,22})\b',
        r'\bT\d{3,4}\b'
    ],
    "PERSON_CODE": [
        r'\bP0\d{2,4}\b'
    ],
    "LOCATION_CODE": [
        r'\bL\d{3,4}\b'
    ]
}

def extract_text_from_file(file_content: bytes, filename: str) -> str:
    ext = filename.lower().split('.')[-1]
    text = ""
    
    if ext == 'txt':
        text = file_content.decode('utf-8', errors='ignore')
    elif ext == 'json':
        try:
            data = json.loads(file_content.decode('utf-8', errors='ignore'))
            text = json.dumps(data, indent=2)
        except Exception:
            text = file_content.decode('utf-8', errors='ignore')
    elif ext == 'csv':
        try:
            csv_str = file_content.decode('utf-8', errors='ignore')
            reader = csv.reader(io.StringIO(csv_str))
            rows = [", ".join(row) for row in reader]
            text = "\n".join(rows)
        except Exception:
            text = file_content.decode('utf-8', errors='ignore')
    elif ext == 'pdf':
        try:
            import pypdf
            pdf_reader = pypdf.PdfReader(io.BytesIO(file_content))
            pages = []
            for page in pdf_reader.pages:
                t = page.extract_text()
                if t:
                    pages.append(t)
            text = "\n".join(pages)
        except Exception:
            text = f"[PDF Text Extraction Failed for {filename}]"
    elif ext == 'docx':
        try:
            import docx
            doc = docx.Document(io.BytesIO(file_content))
            text = "\n".join([p.text for p in doc.paragraphs if p.text])
        except Exception:
            text = f"[DOCX Text Extraction Failed for {filename}]"
    else:
        text = file_content.decode('utf-8', errors='ignore')
        
    return text

def extract_entities_hybrid(text: str) -> List[Dict[str, Any]]:
    extracted = []
    seen = set()
    
    # Helper normalizers
    def normalize_entity(etype: str, raw: str) -> str:
        if etype == "PHONE":
            cleaned = re.sub(r'[\s\-\(\)\.]', '', raw)
            if cleaned.startswith('+91') and len(cleaned) == 13:
                cleaned = cleaned[3:]
            elif cleaned.startswith('0') and len(cleaned) == 11:
                cleaned = cleaned[1:]
            return cleaned.upper()
        elif etype == "VEHICLE":
            return re.sub(r'[\s\-]', '', raw).upper()
        elif etype in ["CASE_ID", "ACCOUNT", "EVIDENCE", "TRANSACTION", "UPI_ID", "IFSC", "PERSON_CODE", "LOCATION_CODE"]:
            return raw.strip().upper()
        return raw.strip()

    # 1. Regex rule extraction
    for entity_type, patterns in REGEX_PATTERNS.items():
        for pattern in patterns:
            for match in re.finditer(pattern, text, re.IGNORECASE if entity_type != "VEHICLE" else 0):
                val = match.group(0).strip()
                normalized_val = normalize_entity(entity_type, val)
                
                # Map internal types
                mapped_type = entity_type
                if entity_type == "PERSON_CODE": mapped_type = "PERSON"
                elif entity_type == "LOCATION_CODE": mapped_type = "LOCATION"
                elif entity_type == "UPI_ID": mapped_type = "ACCOUNT"
                elif entity_type == "IFSC": mapped_type = "ORGANIZATION"

                key = (mapped_type, normalized_val, match.start(), match.end())
                if key not in seen:
                    seen.add(key)
                    extracted.append({
                        "entity_type": mapped_type,
                        "entity_value": val,
                        "normalized_value": normalized_val,
                        "confidence": 0.95,
                        "start_position": match.start(),
                        "end_position": match.end()
                    })

    # 2. spaCy NER (if available)
    if nlp_spacy:
        try:
            doc = nlp_spacy(text)
            for ent in doc.ents:
                etype = ent.label_
                mapped_type = None
                if etype in ["PERSON"]:
                    mapped_type = "PERSON"
                elif etype in ["GPE", "LOC", "FAC"]:
                    mapped_type = "LOCATION"
                elif etype in ["ORG"]:
                    mapped_type = "ORGANIZATION"
                elif etype in ["DATE"]:
                    mapped_type = "DATE"
                elif etype in ["TIME"]:
                    mapped_type = "TIME"
                elif etype in ["MONEY"]:
                    mapped_type = "MONEY"
                
                if mapped_type:
                    val = ent.text.strip()
                    norm_val = val.title() if mapped_type == "PERSON" else val
                    key = (mapped_type, norm_val, ent.start_char, ent.end_char)
                    if key not in seen and len(val) > 2:
                        seen.add(key)
                        extracted.append({
                            "entity_type": mapped_type,
                            "entity_value": val,
                            "normalized_value": norm_val,
                            "confidence": 0.88,
                            "start_position": ent.start_char,
                            "end_position": ent.end_char
                        })
        except Exception:
            pass

    # 3. Enhanced heuristic keyword extraction for PERSON, ALIAS, ACCUSED, COMPLAINANT, LOCATION
    role_person_patterns = [
        (r'\b(?:Accused|Suspect)\s*[:.-]?\s*([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){1,3})', "PERSON"),
        (r'\b(?:Complainant|Informant|Victim|Witness)\s*[:.-]?\s*([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){1,3})', "PERSON"),
        (r'\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\s*@\s*([A-Za-z0-9_]+)\b', "ALIAS"),
        (r'\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){1,2})\s+(?:s/o|d/o|w/o)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)', "PERSON"),
        (r'\bPerson\s+[A-Z0-9]+\b', "PERSON"),
        (r'\bMr\.\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b', "PERSON"),
        (r'\bMrs\.\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b', "PERSON"),
        (r'\bknown as\s+([A-Z][a-z]+)\b', "ALIAS"),
        (r'\balias\s+([A-Z][a-z]+)\b', "ALIAS"),
        (r'\b(?:Police\s*Station|PS|P\.S\.)\s*[:.-]?\s*([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\b', "LOCATION"),
        (r'\b(?:near|at|opposite|behind)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){1,2})\b', "LOCATION")
    ]
    for pattern, etype in role_person_patterns:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            val = match.group(1).strip() if match.groups() else match.group(0).strip()
            norm_val = val.title()
            key = (etype, norm_val, match.start(), match.end())
            if key not in seen and len(val) > 2:
                seen.add(key)
                extracted.append({
                    "entity_type": etype,
                    "entity_value": val,
                    "normalized_value": norm_val,
                    "confidence": 0.92,
                    "start_position": match.start(),
                    "end_position": match.end()
                })

    # Sort by start_position
    extracted.sort(key=lambda x: x["start_position"])
    return extracted

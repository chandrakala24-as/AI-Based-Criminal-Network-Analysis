import pytest
from app.services.evidence.ledger import calculate_sha256

def test_sha256_hashing():
    content = b"FIR-2026-001 Synthetic text content"
    hash1 = calculate_sha256(content)
    hash2 = calculate_sha256(content)
    assert hash1 == hash2
    assert len(hash1) == 64 # SHA-256 hex string length

def test_sha256_tamper_detection():
    orig_content = b"FIR Original Content"
    tampered_content = b"FIR Tampered Content"
    assert calculate_sha256(orig_content) != calculate_sha256(tampered_content)

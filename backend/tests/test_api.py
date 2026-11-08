import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "CrimeGraph AI"
    assert data["status"] == "Online"

def test_login_demo_user():
    # Register test investigator
    reg_res = client.post("/api/v1/auth/register", json={
        "username": "test_investigator",
        "email": "test_inv@crimegraph.ai",
        "password": "testpassword123",
        "role": "INVESTIGATOR"
    })
    assert reg_res.status_code in [200, 400] # 200 on creation, 400 if already exists

    response = client.post("/api/v1/auth/login", json={
        "username": "test_investigator",
        "password": "testpassword123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["username"] == "test_investigator"

def test_assistant_queries():
    # Login to get token
    login_res = client.post("/api/v1/auth/login", json={
        "username": "test_investigator",
        "password": "testpassword123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Test 1: General cases summary query
    res1 = client.post("/api/v1/assistant/query", json={
        "query": "Summarize active investigation cases."
    }, headers=headers)
    assert res1.status_code == 200
    data1 = res1.json()
    assert "answer" in data1
    assert "confidence" in data1
    assert data1["confidence"] > 0.5
    assert "sources" in data1

    # Test 2: Network hubs query
    res2 = client.post("/api/v1/assistant/query", json={
        "query": "Who are the top connected entities?"
    }, headers=headers)
    assert res2.status_code == 200
    data2 = res2.json()
    assert "answer" in data2

    # Test 3: Financial transaction query
    res3 = client.post("/api/v1/assistant/query", json={
        "query": "What financial transactions were recorded?"
    }, headers=headers)
    assert res3.status_code == 200
    data3 = res3.json()
    assert "answer" in data3

    # Test 4: Cross case link query
    res4 = client.post("/api/v1/assistant/query", json={
        "query": "Are there shared phone numbers across cases?"
    }, headers=headers)
    assert res4.status_code == 200
    data4 = res4.json()
    assert "answer" in data4

"""
Test 09-tech-debt: Rate limiting → 429 when limit exceeded.
Uses a minimal FastAPI app with slowapi to avoid DB/auth dependencies.
"""
import os
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("ALGORITHM", "HS256")

import pytest
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Build a minimal app with a tight limit so the test runs fast
_test_limiter = Limiter(key_func=get_remote_address)

app = FastAPI()
app.state.limiter = _test_limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


@app.get("/ping")
@_test_limiter.limit("2/hour")
def ping(request: Request):
    return {"pong": True}


@app.get("/generous")
@_test_limiter.limit("100/hour")
def generous(request: Request):
    return {"pong": True}


@pytest.fixture
def client():
    """Fresh TestClient — slowapi state resets because _test_limiter is module-level
    but limits are keyed by remote address which is always 127.0.0.1 in TestClient.
    We reset the limiter storage between tests so they are isolated.
    """
    _test_limiter.reset()
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c


def test_first_request_passes(client):
    resp = client.get("/ping")
    assert resp.status_code == 200


def test_requests_within_limit_pass(client):
    for _ in range(2):
        resp = client.get("/ping")
        assert resp.status_code == 200


def test_exceeding_limit_returns_429(client):
    # First 2 should pass
    for i in range(2):
        resp = client.get("/ping")
        assert resp.status_code == 200, f"Request {i + 1} should have passed"

    # 3rd request must be rate-limited
    resp = client.get("/ping")
    assert resp.status_code == 429


def test_429_response_has_expected_structure(client):
    for _ in range(2):
        client.get("/ping")

    resp = client.get("/ping")
    assert resp.status_code == 429
    # slowapi returns JSON with an "error" key
    body = resp.json()
    assert "error" in body


def test_generous_limit_never_triggers_within_small_burst(client):
    """A 100/hour limit should not trigger during a small burst of 10 requests."""
    for _ in range(10):
        resp = client.get("/generous")
        assert resp.status_code == 200

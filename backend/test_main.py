import pytest
from fastapi.testclient import TestClient

from backend.main import app, engine


client = TestClient(app)


@pytest.fixture(autouse=True)
def force_deterministic_classifier(monkeypatch: pytest.MonkeyPatch) -> None:
    """Tests must remain offline even when a developer has configured backend/.env."""
    monkeypatch.setattr(engine, "client", None)


def test_analyze_all_supported_vectors() -> None:
    vectors = {
        "SQL Injection": ("CRITICAL", "T1190"),
        "Layer 7 DDoS": ("CRITICAL", "T1498"),
        "Slowloris DoS": ("HIGH", "T1499"),
        "Stored XSS": ("HIGH", "T1059.007"),
        "SSH Brute Force": ("HIGH", "T1110"),
    }

    for attack_type, (severity, technique) in vectors.items():
        response = client.post(
            "/api/v1/threxis/analyze", json={"attack_type": attack_type}
        )
        assert response.status_code == 200
        payload = response.json()
        assert payload["severity"] == severity
        assert payload["mitre_technique"] == technique
        assert payload["payload_sample"]
        assert len(payload["compliance_frameworks"]) == 2
        assert all(control["framework"] for control in payload["compliance_frameworks"])


def test_compliance_mappings_match_attack_families() -> None:
    injection = client.post(
        "/api/v1/threxis/analyze", json={"attack_type": "SQL Injection"}
    ).json()["compliance_frameworks"]
    denial_of_service = client.post(
        "/api/v1/threxis/analyze", json={"attack_type": "Layer 7 DDoS"}
    ).json()["compliance_frameworks"]

    assert {control["framework"] for control in injection} == {
        "OWASP Top 10",
        "NIST SP 800-53",
    }
    assert {control["framework"] for control in denial_of_service} == {
        "ISO 27001",
        "SOC 2 TSC",
    }


def test_remediation_returns_complete_execution_log() -> None:
    response = client.post(
        "/api/v1/threxis/remediate", json={"attack_type": "SSH Brute Force"}
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "NEUTRALIZED"
    assert len(payload["execution_log"]) >= 5
    assert payload["execution_log"][-1].startswith("[00:02.601] DONE")


def test_unknown_vector_is_rejected() -> None:
    response = client.post(
        "/api/v1/threxis/analyze", json={"attack_type": "Unknown"}
    )
    assert response.status_code == 422


def test_cors_preflight_allows_any_origin() -> None:
    response = client.options(
        "/api/v1/threxis/analyze",
        headers={
            "Origin": "https://soc.example.test",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "*"
    assert "POST" in response.headers["access-control-allow-methods"]

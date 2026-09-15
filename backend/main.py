"""THREXIS Security Operations API."""

from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from openai import AsyncOpenAI
from pydantic import BaseModel

load_dotenv(Path(__file__).with_name(".env"))

LOGGER = logging.getLogger("threxis")
AttackType = Literal[
    "SQL Injection",
    "Layer 7 DDoS",
    "Slowloris DoS",
    "Stored XSS",
    "SSH Brute Force",
]


class AttackRequest(BaseModel):
    attack_type: AttackType


class ComplianceControl(BaseModel):
    framework: str
    control: str
    requirement: str


class ThreatAnalysis(BaseModel):
    severity: Literal["CRITICAL", "HIGH"]
    attack_type: AttackType
    mitre_technique: str
    summary: str
    recommended_action: str
    payload_sample: str
    compliance_frameworks: list[ComplianceControl]


class RemediationResponse(BaseModel):
    attack_type: AttackType
    status: Literal["NEUTRALIZED"]
    execution_log: list[str]


THREAT_CATALOG: dict[str, dict[str, object]] = {
    "SQL Injection": {
        "severity": "CRITICAL",
        "mitre_technique": "T1190",
        "summary": "A crafted database expression was detected in an application request, indicating an attempt to bypass query boundaries and access protected records.",
        "recommended_action": "Quarantine the source, enable the managed SQL injection rule set, revoke affected sessions, and review database audit logs for unauthorized queries.",
        "payload_sample": "' OR 1=1 --",
        "compliance_frameworks": [
            {"framework": "OWASP Top 10", "control": "A03:2021 Injection", "requirement": "Prevent untrusted input from altering interpreter commands."},
            {"framework": "NIST SP 800-53", "control": "SI-10 Information Input Validation", "requirement": "Validate information inputs for accuracy, completeness, and validity."},
        ],
    },
    "Layer 7 DDoS": {
        "severity": "CRITICAL",
        "mitre_technique": "T1498",
        "summary": "A coordinated HTTP request flood is exhausting application workers and creating abnormal pressure on the public service edge.",
        "recommended_action": "Activate edge rate limiting, challenge anomalous clients, isolate abusive autonomous systems, and scale protected origin capacity.",
        "payload_sample": "GET /api/search?q=health HTTP/1.1 × 48,000 req/s",
        "compliance_frameworks": [
            {"framework": "ISO 27001", "control": "A.12.1.3 Capacity Management", "requirement": "Monitor and tune resource use to meet availability requirements."},
            {"framework": "SOC 2 TSC", "control": "CC6.6", "requirement": "Protect systems against threats originating outside system boundaries."},
        ],
    },
    "Slowloris DoS": {
        "severity": "HIGH",
        "mitre_technique": "T1499",
        "summary": "Multiple clients are holding partial HTTP sessions open to deplete the server connection pool without completing requests.",
        "recommended_action": "Reduce header timeouts, cap per-source connections, terminate incomplete sessions, and enforce reverse-proxy request buffering.",
        "payload_sample": "X-a: keep-alive\\r\\n [header drip: 1 byte / 15s]",
        "compliance_frameworks": [
            {"framework": "ISO 27001", "control": "A.12.1.3 Capacity Management", "requirement": "Project future capacity requirements and prevent resource exhaustion."},
            {"framework": "SOC 2 TSC", "control": "CC6.6", "requirement": "Implement controls that restrict malicious external traffic."},
        ],
    },
    "Stored XSS": {
        "severity": "HIGH",
        "mitre_technique": "T1059.007",
        "summary": "Persistent script content was identified in user-controlled data and may execute in the browsers of privileged application users.",
        "recommended_action": "Quarantine the record, purge cached copies, deploy output encoding and CSP controls, and invalidate sessions exposed to the payload.",
        "payload_sample": '<img src=x onerror="alert(\'THREXIS\')">',
        "compliance_frameworks": [
            {"framework": "OWASP Top 10", "control": "A03:2021 Injection", "requirement": "Encode untrusted browser content and enforce a restrictive CSP."},
            {"framework": "NIST SP 800-53", "control": "SI-10 Information Input Validation", "requirement": "Validate and sanitize persisted user-controlled input."},
        ],
    },
    "SSH Brute Force": {
        "severity": "HIGH",
        "mitre_technique": "T1110",
        "summary": "A remote host is cycling credentials against SSH at a rate consistent with automated password guessing.",
        "recommended_action": "Block the source, enforce key-only authentication, rotate exposed credentials, and audit successful logins from related infrastructure.",
        "payload_sample": "auth.log: 327 failed passwords for root from 203.0.113.42",
        "compliance_frameworks": [
            {"framework": "NIST SP 800-53", "control": "AC-7 Unsuccessful Logon Attempts", "requirement": "Enforce limits and automatic lockout for repeated failed authentication."},
            {"framework": "SOC 2 TSC", "control": "CC6.1", "requirement": "Manage logical access through authorized identities and credentials."},
        ],
    },
}


REMEDIATION_PLAYBOOKS: dict[str, list[str]] = {
    "SQL Injection": [
        "[00:00.000] ALERT  Confirmed SQL injection signature at edge gateway",
        "[00:00.284] BLOCK  iptables -I INPUT -s 203.0.113.42 -j DROP",
        "[00:00.731] WAF    Enabled OWASP CRS rule group 942 / SQLi",
        "[00:01.206] AUTH   Revoked 14 sessions associated with source fingerprint",
        "[00:01.844] DB     Started immutable query-log capture and integrity scan",
        "[00:02.317] VERIFY Malicious request replay returned HTTP 403",
        "[00:02.902] DONE   SQL injection path contained; evidence preserved",
    ],
    "Layer 7 DDoS": [
        "[00:00.000] ALERT  HTTP flood threshold exceeded across 3 edge regions",
        "[00:00.318] EDGE   Cloudflare rate-limit rule deployed: 120 req/min/client",
        "[00:00.803] BOT    Managed challenge enabled for anomalous fingerprints",
        "[00:01.340] ROUTE  Origin access restricted to trusted proxy ranges",
        "[00:01.978] SCALE  Added 4 protected application workers",
        "[00:02.512] VERIFY Origin request rate returned below saturation threshold",
        "[00:03.004] DONE   Layer 7 denial-of-service campaign absorbed",
    ],
    "Slowloris DoS": [
        "[00:00.000] ALERT  Incomplete HTTP connection pool at 91% capacity",
        "[00:00.245] PROXY  client_header_timeout reduced to 10s",
        "[00:00.699] LIMIT  Per-source concurrent connection ceiling set to 20",
        "[00:01.116] KILL   Terminated 1,284 stale partial-request workers",
        "[00:01.722] BLOCK  Added repeat offenders to edge deny set",
        "[00:02.183] VERIFY Connection pool utilization stable at 22%",
        "[00:02.698] DONE   Slowloris resource exhaustion contained",
    ],
    "Stored XSS": [
        "[00:00.000] ALERT  Persistent browser-executable payload confirmed",
        "[00:00.306] DATA   Quarantined affected content record ID 7F2A",
        "[00:00.754] CACHE  Purged payload from CDN and application caches",
        "[00:01.208] CSP    Enforced script-src 'self' with rotating nonce",
        "[00:01.761] AUTH   Invalidated sessions that rendered affected record",
        "[00:02.269] VERIFY Sanitized render passed DOM execution probe",
        "[00:02.815] DONE   Stored XSS exposure removed and users protected",
    ],
    "SSH Brute Force": [
        "[00:00.000] ALERT  Distributed SSH credential guessing confirmed",
        "[00:00.221] BLOCK  iptables -I INPUT -s 203.0.113.42 -p tcp --dport 22 -j DROP",
        "[00:00.647] BAN    fail2ban jail updated with 24-hour recidive policy",
        "[00:01.074] SSHD   PasswordAuthentication disabled; key-only mode active",
        "[00:01.625] AUDIT  Reviewed successful logins and privileged shell history",
        "[00:02.087] VERIFY No unauthorized sessions or new authentication attempts",
        "[00:02.601] DONE   SSH brute-force campaign neutralized",
    ],
}


class ClassificationEngine:
    """Use OpenAI for narrative refinement, with deterministic local fallback."""

    def __init__(self) -> None:
        key = os.getenv("OPENAI_API_KEY", "").strip()
        self.client = (
            AsyncOpenAI(api_key=key, timeout=6.0, max_retries=0) if key else None
        )

    async def classify(self, attack_type: AttackType) -> ThreatAnalysis:
        fallback = THREAT_CATALOG[attack_type]
        if self.client is None:
            return ThreatAnalysis(attack_type=attack_type, **fallback)

        try:
            response = await self.client.chat.completions.create(
                model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                temperature=0.1,
                response_format={"type": "json_object"},
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are a SOC classifier. Return JSON with concise keys "
                            "summary and recommended_action only. Do not include commands."
                        ),
                    },
                    {
                        "role": "user",
                        "content": (
                            f"Refine this known {attack_type} finding. "
                            f"Context: {fallback['summary']}"
                        ),
                    },
                ],
            )
            content = response.choices[0].message.content or "{}"
            refinement = json.loads(content)
            summary = str(refinement.get("summary", "")).strip()
            action = str(refinement.get("recommended_action", "")).strip()
            if not summary or not action:
                raise ValueError("Classification response omitted required fields")
            return ThreatAnalysis(
                attack_type=attack_type,
                severity=fallback["severity"],
                mitre_technique=fallback["mitre_technique"],
                summary=summary,
                recommended_action=action,
                payload_sample=fallback["payload_sample"],
                compliance_frameworks=fallback["compliance_frameworks"],
            )
        except Exception as exc:  # Network/auth/model failures must not take SOC offline.
            LOGGER.warning("AI classification unavailable; using local engine: %s", exc)
            return ThreatAnalysis(attack_type=attack_type, **fallback)


engine = ClassificationEngine()
app = FastAPI(
    title="THREXIS Security Operations API",
    version="1.0.0",
    description="Threat classification and containment orchestration for THREXIS.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "operational", "system": "THREXIS"}


@app.post("/api/v1/threxis/analyze", response_model=ThreatAnalysis)
async def analyze(request: AttackRequest) -> ThreatAnalysis:
    return await engine.classify(request.attack_type)


@app.post("/api/v1/threxis/remediate", response_model=RemediationResponse)
async def remediate(request: AttackRequest) -> RemediationResponse:
    return RemediationResponse(
        attack_type=request.attack_type,
        status="NEUTRALIZED",
        execution_log=REMEDIATION_PLAYBOOKS[request.attack_type],
    )

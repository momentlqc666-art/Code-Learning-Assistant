"use client";

import {
  Activity,
  Ban,
  Bot,
  Braces,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  CloudCog,
  Code2,
  Cpu,
  Download,
  Database,
  DollarSign,
  Gauge,
  GitBranch,
  History,
  LayoutDashboard,
  ListTree,
  LockKeyhole,
  Map,
  MapPin,
  MemoryStick,
  Pause,
  Play,
  Radar,
  Send,
  ServerCrash,
  Shield,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Swords,
  TerminalSquare,
  Volume2,
  VolumeX,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type AttackType =
  | "SQL Injection"
  | "Layer 7 DDoS"
  | "Slowloris DoS"
  | "Stored XSS"
  | "SSH Brute Force";

type Analysis = {
  severity: "CRITICAL" | "HIGH";
  attack_type: AttackType;
  mitre_technique: string;
  summary: string;
  recommended_action: string;
  payload_sample: string;
  compliance_frameworks: Array<{
    framework: string;
    control: string;
    requirement: string;
  }>;
};

type Remediation = {
  attack_type: AttackType;
  status: "NEUTRALIZED";
  execution_log: string[];
};

type StreamEntry = {
  id: number;
  time: string;
  source: string;
  message: string;
  attack?: boolean;
};

type DashboardTab = "overview" | "analysis" | "containment" | "history";

type IncidentRecord = {
  id: number;
  timestamp: string;
  attackType: AttackType;
  technique: string;
  severity: "CRITICAL" | "HIGH";
  source: string;
  status: "BLOCKED";
};

type DefenseProtocol = "rateLimit" | "bgpNull" | "fail2ban" | "domSanitization";

type CopilotMessage = {
  id: number;
  role: "operator" | "copilot";
  content: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

const attacks: Array<{
  type: AttackType;
  short: string;
  vector: string;
  port: string;
  icon: typeof Braces;
}> = [
  { type: "SQL Injection", short: "SQLi", vector: "WEB / DATABASE", port: "TCP 443", icon: Braces },
  { type: "Layer 7 DDoS", short: "L7 DDoS", vector: "EDGE / HTTP FLOOD", port: "TCP 443", icon: CloudCog },
  { type: "Slowloris DoS", short: "SLOWLORIS", vector: "CONNECTION EXHAUST", port: "TCP 80", icon: ServerCrash },
  { type: "Stored XSS", short: "STORED XSS", vector: "BROWSER / PERSISTENT", port: "APP", icon: Code2 },
  { type: "SSH Brute Force", short: "SSH BRUTE", vector: "IDENTITY / ACCESS", port: "TCP 22", icon: LockKeyhole },
];

const dashboardTabs: Array<{
  id: DashboardTab;
  label: string;
  icon: typeof Activity;
}> = [
  { id: "overview", label: "OVERVIEW / ATTACK MAP", icon: LayoutDashboard },
  { id: "analysis", label: "THREAT ANALYSIS", icon: Radar },
  { id: "containment", label: "CONTAINMENT LOGS", icon: ListTree },
  { id: "history", label: "INCIDENT HISTORY", icon: History },
];

const initialIncidentHistory: IncidentRecord[] = [
  { id: 1042, timestamp: "09:32:18 UTC", attackType: "SSH Brute Force", technique: "T1110", severity: "HIGH", source: "203.0.113.42", status: "BLOCKED" },
  { id: 1041, timestamp: "08:47:03 UTC", attackType: "Stored XSS", technique: "T1059.007", severity: "HIGH", source: "APP-NODE-07", status: "BLOCKED" },
  { id: 1040, timestamp: "07:19:51 UTC", attackType: "Layer 7 DDoS", technique: "T1498", severity: "CRITICAL", source: "EDGE-FRA-02", status: "BLOCKED" },
  { id: 1039, timestamp: "04:56:22 UTC", attackType: "SQL Injection", technique: "T1190", severity: "CRITICAL", source: "198.51.100.17", status: "BLOCKED" },
  { id: 1038, timestamp: "02:11:09 UTC", attackType: "Slowloris DoS", technique: "T1499", severity: "HIGH", source: "EDGE-IAD-04", status: "BLOCKED" },
];

const protocolDefinitions: Array<{
  id: DefenseProtocol;
  label: string;
  provider: string;
  enableCommand: string;
  disableCommand: string;
}> = [
  { id: "rateLimit", label: "Rate Limiting", provider: "Cloudflare WAF", enableCommand: "cfctl waf rate-limit deploy --zone threxis-edge --rps 120", disableCommand: "cfctl waf rate-limit rollback --zone threxis-edge" },
  { id: "bgpNull", label: "BGP Route Nullification", provider: "Edge Router Fabric", enableCommand: "birdc 'route add blackhole 185.220.101.5/32 community 65535:666'", disableCommand: "birdc 'route delete 185.220.101.5/32'" },
  { id: "fail2ban", label: "Fail2Ban IP Jail", provider: "Identity Perimeter", enableCommand: "fail2ban-client set sshd banip 185.220.101.5", disableCommand: "fail2ban-client set sshd unbanip 185.220.101.5" },
  { id: "domSanitization", label: "DOM Sanitization", provider: "CSP Enforcement", enableCommand: "cspctl enforce --directive \"script-src 'self' 'nonce-*'\"", disableCommand: "cspctl monitor --directive \"script-src\"" },
];

const campaignStages: Array<{
  attack: AttackType;
  phase: string;
  objective: string;
}> = [
  { attack: "SSH Brute Force", phase: "INITIAL ACCESS", objective: "Establish credential foothold" },
  { attack: "SQL Injection", phase: "PRIVILEGE ESCALATION", objective: "Escalate database privileges" },
  { attack: "Layer 7 DDoS", phase: "COVER TRACK / SERVICE DISRUPTION", objective: "Obscure activity and disrupt service" },
];

const blastRadiusModels: Record<AttackType, { lossPerMinute: number; impactedAssets: number; assets: string[] }> = {
  "SQL Injection": { lossPerMinute: 18400, impactedAssets: 7, assets: ["User Auth DB Cluster", "3 API Instances", "Billing Read Replica"] },
  "Layer 7 DDoS": { lossPerMinute: 27500, impactedAssets: 12, assets: ["Edge Gateway Fleet", "3 API Instances", "Customer API Routes"] },
  "Slowloris DoS": { lossPerMinute: 12300, impactedAssets: 6, assets: ["HTTP Worker Pool", "2 Reverse Proxies", "Checkout API"] },
  "Stored XSS": { lossPerMinute: 15600, impactedAssets: 4, assets: ["Admin Web Console", "Session Cache", "Customer Profiles"] },
  "SSH Brute Force": { lossPerMinute: 8700, impactedAssets: 3, assets: ["Identity Bastion", "Privileged Shell", "Audit Log Store"] },
};

const copilotPrompts = [
  "Explain T1498 Mitigation",
  "Generate Firewall Rule",
  "Summarize Blast Radius",
];

const normalEvents = [
  ["fw-edge-02", "ALLOW tcp/443 10.42.18.9 → app-cluster-3 policy=zero-trust"],
  ["sentinel", "Behavioral baseline scan complete · 18,402 signals correlated"],
  ["auth-gw", "mTLS certificate rotation verified for service mesh segment C"],
  ["waf-prod", "OWASP CRS inspection passed · request_id=8f71a9"],
  ["edr-node-7", "Process telemetry ingested · integrity hash verified"],
  ["netflow", "Packet entropy nominal · east-west traffic within baseline"],
  ["threxis-ai", "Hunt graph refreshed · no lateral movement indicators"],
  ["vault", "Privileged access lease expired and revoked automatically"],
];

const initialLogs: StreamEntry[] = normalEvents.slice(0, 6).map((event, index) => ({
  id: index,
  time: `09:41:${String(31 + index * 3).padStart(2, "0")}.0${index}`,
  source: event[0],
  message: event[1],
}));

function formatLogTime() {
  return new Date().toISOString().slice(11, 23);
}

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function isThreatAnalysis(value: unknown): value is Analysis {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Analysis>;
  return (
    attacks.some((attack) => attack.type === candidate.attack_type) &&
    (candidate.severity === "CRITICAL" || candidate.severity === "HIGH") &&
    typeof candidate.mitre_technique === "string" &&
    typeof candidate.summary === "string" &&
    typeof candidate.recommended_action === "string" &&
    typeof candidate.payload_sample === "string" &&
    Array.isArray(candidate.compliance_frameworks) &&
    candidate.compliance_frameworks.every(
      (control) =>
        typeof control?.framework === "string" &&
        typeof control.control === "string" &&
        typeof control.requirement === "string",
    )
  );
}

function buildCopilotResponse(prompt: string, analysis: Analysis | null) {
  const normalized = prompt.toLowerCase();
  if (normalized.includes("t1498") || normalized.includes("ddos")) {
    return `## T1498 Network Denial-of-Service Playbook

**Assessment:** Volumetric or application-layer traffic is attempting to degrade edge availability.

### Containment sequence
1. Baseline legitimate request rate by route and client fingerprint.
2. Deploy a 120 req/min edge policy with managed challenges.
3. Restrict origin ingress to trusted reverse-proxy ranges.
4. Null-route confirmed hostile /32 sources only after collateral review.

\`\`\`bash
cfctl waf rate-limit deploy --zone threxis-edge --rps 120
iptables -A INPUT -p tcp --dport 443 -m connlimit --connlimit-above 40 -j REJECT
\`\`\`

**Verify:** Origin saturation < 65%, error rate < 1%, and p95 latency returns to baseline.`;
  }

  if (normalized.includes("firewall") || normalized.includes("rule")) {
    return `## Scoped Firewall Containment Rule

**Objective:** Block the selected hostile source while preserving trusted proxy ingress.

\`\`\`bash
iptables -I INPUT 1 -s 185.220.101.5/32 -p tcp --dport 443 -m comment --comment "THREXIS-INCIDENT" -j DROP
iptables -C INPUT -s 185.220.101.5/32 -j DROP
\`\`\`

### Guardrails
- Apply to the edge security group before origin hosts.
- Set a 24-hour expiry and preserve packet evidence.
- Validate health probes and trusted CDN ranges after deployment.`;
  }

  if (normalized.includes("blast") || normalized.includes("summar")) {
    return `## Blast Radius Summary

| Signal | Current finding |
| --- | --- |
| Vector | ${analysis?.attack_type ?? "No active incident"} |
| MITRE | ${analysis?.mitre_technique ?? "Pending classification"} |
| Severity | ${analysis?.severity ?? "N/A"} |
| Affected zone | Edge ingress / Segment C |
| Data exposure | No confirmed exfiltration |

### Executive advice
Contain the ingress path, revoke correlated sessions, preserve edge logs, and monitor adjacent segments for 30 minutes before closure.`;
  }

  return `## THREXIS SOC Recommendation

**Operator request:** ${prompt}

1. Validate the signal across WAF, NetFlow, identity, and endpoint telemetry.
2. Scope containment to the observed indicator and preserve forensic evidence.
3. Execute the least-disruptive control, then verify service health.
4. Record the action in the incident ledger and maintain heightened monitoring.

**Current context:** ${analysis ? `${analysis.severity} ${analysis.attack_type} (${analysis.mitre_technique})` : "Sensor mesh nominal; no classified incident."}`;
}

export default function ThrexisCommandCenter() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [selected, setSelected] = useState<AttackType>("SQL Injection");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [status, setStatus] = useState<"MONITORING" | "ANALYZING" | "CONTAINMENT REQUIRED" | "NEUTRALIZED">("MONITORING");
  const [muted, setMuted] = useState(false);
  const [blocked, setBlocked] = useState(2847);
  const [telemetry, setTelemetry] = useState({ cpu: 31, memory: 62, latency: 12 });
  const [stream, setStream] = useState<StreamEntry[]>(initialLogs);
  const [terminalLines, setTerminalLines] = useState<string[]>([
    "THREXIS containment shell v4.8.2",
    "Secure orchestrator ready. Awaiting incident selection...",
  ]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRemediating, setIsRemediating] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [trafficRps, setTrafficRps] = useState(18400);
  const [campaignActive, setCampaignActive] = useState(false);
  const [campaignStage, setCampaignStage] = useState(-1);
  const [incidentHistory, setIncidentHistory] = useState<IncidentRecord[]>(initialIncidentHistory);
  const [selectedIncidentId, setSelectedIncidentId] = useState(1040);
  const [defenseProtocols, setDefenseProtocols] = useState<Record<DefenseProtocol, boolean>>({ rateLimit: false, bgpNull: false, fail2ban: false, domSanitization: false });
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [copilotPrompt, setCopilotPrompt] = useState("");
  const [copilotThinking, setCopilotThinking] = useState(false);
  const [copilotMessages, setCopilotMessages] = useState<CopilotMessage[]>([
    { id: 1, role: "copilot", content: "## THREXIS AI online\n\nSensor context is synchronized. Select a tactical prompt or ask for a containment playbook." },
  ]);
  const [error, setError] = useState<string | null>(null);
  const pausedRef = useRef(false);
  const busyRef = useRef(false);
  const demoGenerationRef = useRef(0);
  const campaignGenerationRef = useRef(0);
  const logIdRef = useRef(initialLogs.length);
  const incidentIdRef = useRef(1043);
  const copilotMessageIdRef = useRef(2);
  const copilotTimerRef = useRef<number | null>(null);
  const copilotInputRef = useRef<HTMLInputElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sirenRef = useRef<{ carrier: OscillatorNode; lfo: OscillatorNode } | null>(null);
  const previousStatusRef = useRef(status);

  useEffect(() => {
    const stress = (trafficRps - 100) / 49900;
    const streamInterval = Math.round(1450 - stress * 1230);
    const streamTimer = window.setInterval(() => {
      if (pausedRef.current) return;
      const event = normalEvents[logIdRef.current % normalEvents.length];
      setStream((current) => [
        ...current.slice(-27),
        {
          id: logIdRef.current++,
          time: formatLogTime(),
          source: event[0],
          message: event[1],
        },
      ]);
    }, streamInterval);

    const telemetryTimer = window.setInterval(() => {
      const targetCpu = 25 + stress * 68;
      const targetMemory = 54 + stress * 29;
      const targetLatency = 8 + stress * 26;
      setTelemetry((current) => ({
        cpu: Math.max(20, Math.min(96, Math.round(current.cpu * 0.3 + targetCpu * 0.7 + Math.random() * 4 - 2))),
        memory: Math.max(48, Math.min(92, Math.round(current.memory * 0.35 + targetMemory * 0.65 + Math.random() * 3 - 1.5))),
        latency: Math.max(7, Math.min(42, Math.round(current.latency * 0.25 + targetLatency * 0.75 + Math.random() * 4 - 2))),
      }));
    }, 900);

    return () => {
      window.clearInterval(streamTimer);
      window.clearInterval(telemetryTimer);
    };
  }, [trafficRps]);

  useEffect(() => () => {
    demoGenerationRef.current += 1;
    campaignGenerationRef.current += 1;
    if (copilotTimerRef.current !== null) window.clearTimeout(copilotTimerRef.current);
  }, []);

  const ensureAudioContext = useCallback(() => {
    const existingContext = audioContextRef.current;
    if (existingContext && existingContext.state !== "closed") {
      if (existingContext.state === "suspended") void existingContext.resume();
      return existingContext;
    }
    const context = new AudioContext();
    audioContextRef.current = context;
    return context;
  }, []);

  const stopSiren = useCallback(() => {
    if (!sirenRef.current) return;
    try {
      sirenRef.current.carrier.stop();
      sirenRef.current.lfo.stop();
    } catch {
      // Oscillators may already have ended during a rapid state transition.
    }
    sirenRef.current = null;
  }, []);

  const playClickSfx = useCallback(() => {
    if (muted) return;
    const context = ensureAudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(920, now);
    oscillator.frequency.exponentialRampToValueAtTime(1480, now + 0.055);
    gain.gain.setValueAtTime(0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.085);
  }, [ensureAudioContext, muted]);

  useEffect(() => {
    const previousStatus = previousStatusRef.current;
    stopSiren();

    if (!muted && status === "CONTAINMENT REQUIRED") {
      const context = ensureAudioContext();
      const carrier = context.createOscillator();
      const carrierGain = context.createGain();
      const lfo = context.createOscillator();
      const lfoGain = context.createGain();
      carrier.type = "sine";
      carrier.frequency.value = 138;
      carrierGain.gain.value = 0.032;
      lfo.type = "sine";
      lfo.frequency.value = 1.45;
      lfoGain.gain.value = 0.026;
      lfo.connect(lfoGain).connect(carrierGain.gain);
      carrier.connect(carrierGain).connect(context.destination);
      carrier.start();
      lfo.start();
      sirenRef.current = { carrier, lfo };
    }

    if (!muted && status === "NEUTRALIZED" && previousStatus !== "NEUTRALIZED") {
      const context = ensureAudioContext();
      [659.25, 880].forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const start = context.currentTime + index * 0.13;
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.06, start + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.32);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(start);
        oscillator.stop(start + 0.34);
      });
    }

    previousStatusRef.current = status;
    return stopSiren;
  }, [ensureAudioContext, muted, status, stopSiren]);

  useEffect(() => () => {
    stopSiren();
    if (audioContextRef.current?.state !== "closed") void audioContextRef.current?.close();
  }, [stopSiren]);

  useEffect(() => {
    if (!copilotOpen) return;
    const focusFrame = window.requestAnimationFrame(() => copilotInputRef.current?.focus());
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCopilotOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [copilotOpen]);

  const speakAlert = useCallback(
    (result: Analysis) => {
      if (muted || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        `Tactical alert. ${result.severity} ${result.attack_type} detected. MITRE technique ${result.mitre_technique}. Containment authorization required.`,
      );
      utterance.rate = 0.92;
      utterance.pitch = 0.78;
      window.speechSynthesis.speak(utterance);
    },
    [muted],
  );

  async function triggerAttack(attackType: AttackType): Promise<Analysis | null> {
    if (busyRef.current) return null;
    busyRef.current = true;
    setActiveTab("analysis");
    setSelected(attackType);
    setStatus("ANALYZING");
    setIsAnalyzing(true);
    setAnalysis(null);
    setError(null);
    setTerminalLines([
      "THREXIS containment shell v4.8.2",
      `> ingest --vector "${attackType}" --priority immediate`,
      "Correlating edge, identity, application, and EDR telemetry...",
    ]);

    pausedRef.current = true;
    setStream((current) => [
      ...current.slice(-25),
      {
        id: logIdRef.current++,
        time: formatLogTime(),
        source: "THREAT-DETECT",
        message: `${attackType.toUpperCase()} signature matched · packet capture isolated`,
        attack: true,
      },
    ]);

    try {
      const response = await fetch(`${API_BASE}/api/v1/threxis/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attack_type: attackType }),
      });
      if (!response.ok) throw new Error(`Analysis service returned HTTP ${response.status}`);
      const result: unknown = await response.json();
      if (!isThreatAnalysis(result)) throw new Error("Analysis service returned an invalid threat payload");
      setAnalysis(result);
      setStatus("CONTAINMENT REQUIRED");
      setTerminalLines((lines) => [
        ...lines,
        `> classification: ${result.severity} / ${result.mitre_technique}`,
        "> playbook resolved. Human authorization required for auto-fix.",
      ]);
      speakAlert(result);
      return result;
    } catch (caught) {
      setStatus("MONITORING");
      setError(caught instanceof Error ? caught.message : "Analysis service unavailable");
      return null;
    } finally {
      busyRef.current = false;
      setIsAnalyzing(false);
      window.setTimeout(() => {
        pausedRef.current = false;
      }, 1300);
    }
  }

  async function executeRemediation(target: Analysis | null = analysis, campaignContext?: string): Promise<boolean> {
    if (!target || busyRef.current) return false;
    busyRef.current = true;
    setActiveTab("containment");
    setIsRemediating(true);
    setError(null);
    setTerminalLines([
      "THREXIS containment shell v4.8.2",
      "> authorization accepted · operator=SOC_COMMAND",
      ...(campaignContext ? [`> ${campaignContext}`] : []),
      `> loading playbook for ${target.attack_type}...`,
    ]);

    try {
      const response = await fetch(`${API_BASE}/api/v1/threxis/remediate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attack_type: target.attack_type }),
      });
      if (!response.ok) throw new Error(`Remediation service returned HTTP ${response.status}`);
      const result = (await response.json()) as Remediation;
      for (const line of result.execution_log) {
        await delay(430);
        setTerminalLines((current) => [...current, line]);
      }
      setStatus("NEUTRALIZED");
      setBlocked((current) => current + 1);
      setStream((current) => [
        ...current.slice(-27),
        {
          id: logIdRef.current++,
          time: formatLogTime(),
          source: "THREXIS-AUTO",
          message: `${target.attack_type} neutralized · control plane synchronized`,
        },
      ]);
      const newIncidentId = incidentIdRef.current++;
      setSelectedIncidentId(newIncidentId);
      setIncidentHistory((current) => [
        {
          id: newIncidentId,
          timestamp: `${new Date().toISOString().slice(11, 19)} UTC`,
          attackType: target.attack_type,
          technique: target.mitre_technique,
          severity: target.severity,
          source: target.attack_type === "Layer 7 DDoS" ? "EDGE-GLOBAL" : "THREXIS-SIM",
          status: "BLOCKED" as const,
        },
        ...current,
      ].slice(0, 12));
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Remediation service unavailable");
      setTerminalLines((lines) => [...lines, "[ERROR] Orchestrator aborted safely. No controls changed."]);
      return false;
    } finally {
      busyRef.current = false;
      setIsRemediating(false);
    }
  }

  async function runDemoLoop(generation: number) {
    while (demoGenerationRef.current === generation) {
      const cycleStarted = Date.now();
      setActiveTab("overview");
      await delay(900);
      if (demoGenerationRef.current !== generation) break;

      const result = await triggerAttack("Layer 7 DDoS");
      if (demoGenerationRef.current !== generation) break;
      if (result) setActiveTab("overview");
      await delay(900);
      if (demoGenerationRef.current !== generation) break;

      setActiveTab("analysis");
      await delay(900);
      if (demoGenerationRef.current !== generation) break;

      if (result) await executeRemediation(result);
      if (demoGenerationRef.current !== generation) break;
      await delay(850);
      setActiveTab("history");

      const remaining = Math.max(700, 15000 - (Date.now() - cycleStarted));
      await delay(remaining);
    }
  }

  function toggleDemoMode() {
    if (campaignActive) return;
    ensureAudioContext();
    playClickSfx();
    if (demoMode) {
      demoGenerationRef.current += 1;
      setDemoMode(false);
      return;
    }

    const generation = demoGenerationRef.current + 1;
    demoGenerationRef.current = generation;
    setDemoMode(true);
    window.speechSynthesis?.cancel();
    void runDemoLoop(generation);
  }

  async function runCampaign(generation: number) {
    setCampaignActive(true);
    setCampaignStage(0);
    setTerminalLines([
      "THREXIS red-team orchestrator v4.8.2",
      "> campaign initialize --stages 3 --containment automatic",
      "> kill-chain telemetry channel synchronized",
    ]);

    for (let index = 0; index < campaignStages.length; index += 1) {
      if (campaignGenerationRef.current !== generation) break;
      const stage = campaignStages[index];
      setCampaignStage(index);
      setActiveTab("overview");
      setStream((current) => [
        ...current.slice(-26),
        {
          id: logIdRef.current++,
          time: formatLogTime(),
          source: "RED-TEAM",
          message: `CAMPAIGN ${index + 1}/3 · ${stage.phase} · ${stage.attack}`,
          attack: true,
        },
      ]);
      await delay(650);
      if (campaignGenerationRef.current !== generation) break;

      const result = await triggerAttack(stage.attack);
      if (!result || campaignGenerationRef.current !== generation) break;
      await delay(850);
      if (campaignGenerationRef.current !== generation) break;

      const remediated = await executeRemediation(
        result,
        `CAMPAIGN STAGE ${index + 1}/3 · ${stage.phase} · ${stage.objective}`,
      );
      if (!remediated || campaignGenerationRef.current !== generation) break;
      setStream((current) => [
        ...current.slice(-27),
        {
          id: logIdRef.current++,
          time: formatLogTime(),
          source: "CAMPAIGN-SOAR",
          message: `STAGE ${index + 1}/3 CONTAINED · advancing kill chain`,
        },
      ]);
      await delay(750);
    }

    if (campaignGenerationRef.current === generation) {
      setTerminalLines((current) => [
        ...current,
        "[CAMPAIGN] DONE   All three attack stages detected, contained, and recorded",
      ]);
      setActiveTab("history");
    }
    setCampaignActive(false);
    setCampaignStage(-1);
  }

  function orchestrateCampaign() {
    if (campaignActive || busyRef.current) return;
    ensureAudioContext();
    playClickSfx();
    if (demoMode) {
      demoGenerationRef.current += 1;
      setDemoMode(false);
    }
    const generation = campaignGenerationRef.current + 1;
    campaignGenerationRef.current = generation;
    window.speechSynthesis?.cancel();
    void runCampaign(generation);
  }

  function toggleDefenseProtocol(protocolId: DefenseProtocol) {
    const definition = protocolDefinitions.find((protocol) => protocol.id === protocolId);
    if (!definition) return;
    const enabled = !defenseProtocols[protocolId];
    playClickSfx();
    setDefenseProtocols((current) => ({ ...current, [protocolId]: enabled }));
    const timestamp = formatLogTime();
    const command = enabled ? definition.enableCommand : definition.disableCommand;
    setTerminalLines((current) => [
      ...current.slice(-38),
      `[${timestamp}] MANUAL $ ${command}`,
      `[${timestamp}] ${enabled ? "APPLIED" : "ROLLED BACK"} ${definition.label} // control-plane ACK`,
    ]);
  }

  function submitCopilotPrompt(promptOverride?: string) {
    const prompt = (promptOverride ?? copilotPrompt).trim().slice(0, 240);
    if (!prompt || copilotThinking) return;
    playClickSfx();
    setCopilotPrompt("");
    setCopilotThinking(true);
    setCopilotMessages((current) => [
      ...current,
      { id: copilotMessageIdRef.current++, role: "operator", content: prompt },
    ]);
    if (copilotTimerRef.current !== null) window.clearTimeout(copilotTimerRef.current);
    copilotTimerRef.current = window.setTimeout(() => {
      setCopilotMessages((current) => [
        ...current,
        { id: copilotMessageIdRef.current++, role: "copilot", content: buildCopilotResponse(prompt, analysis) },
      ]);
      setCopilotThinking(false);
      copilotTimerRef.current = null;
    }, 650);
  }

  function toggleCopilot() {
    playClickSfx();
    setCopilotOpen((current) => !current);
  }

  function exportReport() {
    if (!analysis) return;
    const timestamp = new Date().toISOString();
    const defensiveActions = terminalLines.filter((line) => line.startsWith("["));
    const report = `# THREXIS CISO Incident Report

**Generated:** ${timestamp}  
**Incident status:** ${status}  
**Severity:** ${analysis.severity}  
**Attack vector:** ${analysis.attack_type}  
**MITRE ATT&CK technique:** ${analysis.mitre_technique}

## Executive Summary

${analysis.summary}

## Observed Payload

\`\`\`text
${analysis.payload_sample}
\`\`\`

## Recommended Action

${analysis.recommended_action}

## Defensive Actions Executed

${defensiveActions.length ? defensiveActions.map((line) => `- ${line}`).join("\n") : "- Auto-containment has not yet been executed."}

## Control Attestation

- THREXIS sensor mesh: ONLINE
- Evidence chain: PRESERVED
- Current disposition: ${status}

---
Generated by THREXIS — Threat Hunting & Real-Time Exploitation Exposure Intelligent System
`;
    const blob = new Blob([report], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `THREXIS-INCIDENT-${timestamp.replace(/[:.]/g, "-")}.md`;
    anchor.style.display = "none";
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  const active = status === "ANALYZING" || status === "CONTAINMENT REQUIRED";
  const neutralized = status === "NEUTRALIZED";
  const stressLevel = (trafficRps - 100) / 49900;
  const streamVelocity = `${(0.52 - stressLevel * 0.38).toFixed(2)}s`;
  const selectedIncident = incidentHistory.find((incident) => incident.id === selectedIncidentId) ?? incidentHistory[0];

  return (
    <main className="command-center min-h-screen bg-slate-950 text-slate-200">
      <div className="scanlines" aria-hidden="true" />

      <header className="relative z-20 border-b border-slate-800/90 bg-slate-950/90 backdrop-blur-xl">
        <div className="flex min-h-16 items-center justify-between gap-5 px-4 lg:px-7">
          <div className="flex items-center gap-4">
            <div className="logo-mark"><Shield className="h-5 w-5" /></div>
            <div>
              <div className="flex items-baseline gap-3">
                <h1 className="font-display text-xl font-black tracking-[0.24em] text-white sm:text-2xl">THREXIS</h1>
                <span className="hidden font-mono text-[9px] tracking-[0.24em] text-emerald-400 lg:block">SOC // PRIME</span>
              </div>
              <p className="hidden text-[9px] uppercase tracking-[0.18em] text-slate-500 sm:block">Threat Hunting & Real-Time Exploitation Exposure Intelligent System</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="stress-control">
              <div>
                <span>SIMULATE NETWORK STRESS</span>
                <output>{trafficRps.toLocaleString()} REQ/S</output>
              </div>
              <input
                type="range"
                min="100"
                max="50000"
                step="100"
                value={trafficRps}
                onChange={(event) => setTrafficRps(Number(event.target.value))}
                aria-label="Simulate network stress in requests per second"
                aria-valuetext={`${trafficRps.toLocaleString()} requests per second`}
              />
            </div>
            <div className="hidden items-center gap-2 border-r border-slate-800 pr-4 xl:flex">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="font-mono text-[10px] tracking-[0.16em] text-emerald-400">SENSOR MESH ONLINE</span>
            </div>
            <button className="copilot-toggle" onClick={toggleCopilot} aria-expanded={copilotOpen}>
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI COPILOT</span>
            </button>
            <button
              className={`demo-button ${demoMode ? "demo-button-active" : ""}`}
              onClick={toggleDemoMode}
              aria-pressed={demoMode}
              disabled={campaignActive}
            >
              {demoMode ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              <span>{demoMode ? "DEMO ACTIVE // STOP" : "DEMO MODE"}</span>
            </button>
            <button
              className="icon-button"
              onClick={() => {
                const nextMuted = !muted;
                setMuted(nextMuted);
                if (nextMuted) stopSiren();
                else ensureAudioContext();
                window.speechSynthesis?.cancel();
              }}
              aria-label={muted ? "Enable threat audio" : "Mute threat audio"}
              title={muted ? "Enable threat audio" : "Mute threat audio"}
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <div className="operator-badge">
              <span className="text-[8px] text-slate-500">OPERATOR</span>
              <span className="font-mono text-[10px] text-slate-200">SOC-01</span>
            </div>
          </div>
        </div>
      </header>

      <section className="relative z-10 grid border-b border-slate-800/90 bg-slate-950/70 sm:grid-cols-2 xl:grid-cols-5">
        <TelemetryItem
          icon={active ? ShieldAlert : neutralized ? ShieldCheck : Radar}
          label="ACTIVE THREAT STATE"
          value={status}
          accent={active ? "red" : "green"}
        />
        <TelemetryItem icon={Ban} label="ATTACKS BLOCKED / 24H" value={blocked.toLocaleString()} accent="green" />
        <TelemetryItem icon={Cpu} label="SYSTEM CPU LOAD" value={`${telemetry.cpu}%`} detail="16 CORES" />
        <TelemetryItem icon={MemoryStick} label="MEMORY PRESSURE" value={`${telemetry.memory}%`} detail="39.6 / 64 GB" />
        <TelemetryItem icon={Wifi} label="NETWORK LATENCY" value={`${telemetry.latency}ms`} detail="EDGE P95" />
      </section>

      <div className="relative z-10 grid gap-px bg-slate-800/70 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="bg-slate-950/95 p-4 lg:p-5">
          <SectionTitle eyebrow="ATTACK SURFACE" title="EXPLOIT SIMULATOR" icon={Zap} />
          <p className="mb-4 text-[10px] leading-relaxed text-slate-500">Select a controlled attack vector to evaluate detection and containment readiness.</p>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            {attacks.map((attack, index) => {
              const Icon = attack.icon;
              const isSelected = selected === attack.type;
              return (
                <button
                  key={attack.type}
                  onClick={() => {
                    playClickSfx();
                    void triggerAttack(attack.type);
                  }}
                  disabled={isAnalyzing || isRemediating || demoMode || campaignActive}
                  className={`attack-card ${isSelected ? "attack-card-selected" : ""}`}
                >
                  <span className="attack-index">0{index + 1}</span>
                  <span className="attack-icon"><Icon className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block font-mono text-xs font-bold tracking-[0.06em] text-slate-200">{attack.short}</span>
                    <span className="mt-1 block text-[8px] tracking-[0.12em] text-slate-500">{attack.vector}</span>
                  </span>
                  <span className="text-right">
                    <span className="block font-mono text-[8px] text-slate-600">{attack.port}</span>
                    <ChevronRight className="ml-auto mt-1 h-3 w-3 text-slate-600" />
                  </span>
                </button>
              );
            })}
          </div>
          <button
            className={`campaign-button ${campaignActive ? "campaign-button-active" : ""}`}
            onClick={orchestrateCampaign}
            disabled={campaignActive || isAnalyzing || isRemediating || demoMode}
          >
            <Swords className="h-4 w-4" />
            <span>{campaignActive ? `CAMPAIGN STAGE ${campaignStage + 1}/3` : "ORCHESTRATE MULTI-STAGE CAMPAIGN"}</span>
          </button>
          <div className="campaign-stages" aria-live="polite">
            {campaignStages.map((stage, index) => (
              <div key={stage.phase} className={campaignActive && campaignStage === index ? "campaign-stage-active" : campaignActive && campaignStage > index ? "campaign-stage-complete" : ""}>
                <span>0{index + 1}</span>
                <p>{stage.phase}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 border border-slate-800 bg-slate-900/30 p-3">
            <div className="mb-2 flex items-center justify-between text-[8px] tracking-[0.14em] text-slate-500">
              <span>SIMULATION SAFETY</span><span className="text-emerald-400">ISOLATED</span>
            </div>
            <div className="h-1 overflow-hidden bg-slate-800"><div className="h-full w-full bg-emerald-500/70" /></div>
            <p className="mt-2 text-[9px] leading-relaxed text-slate-600">Payload execution is contained within the THREXIS synthetic telemetry plane.</p>
          </div>
        </aside>

        <section className="min-w-0 bg-slate-950/90">
          <nav className="dashboard-tabs" role="tablist" aria-label="THREXIS dashboard views">
            {dashboardTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  className={`dashboard-tab ${activeTab === tab.id ? "dashboard-tab-active" : ""}`}
                  onClick={() => {
                    playClickSfx();
                    setActiveTab(tab.id);
                  }}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                  {tab.id === "containment" && isRemediating && <i className="tab-live-dot" />}
                </button>
              );
            })}
          </nav>

          <div className="min-h-[570px] p-4 lg:p-6" role="tabpanel">
            {error && (
              <div className="mb-4 border border-red-500/40 bg-red-950/30 px-4 py-3 font-mono text-[11px] text-red-300">
                SERVICE EXCEPTION // {error}. Confirm the FastAPI service is listening on port 8000.
              </div>
            )}

            {activeTab === "overview" && (
              <div>
                <PanelHeader eyebrow="GLOBAL SENSOR FABRIC" title="LIVE ATTACK MAP" icon={Map} status={status} active={active} neutralized={neutralized} />
                <AttackMap active={active} neutralized={neutralized} attackType={analysis?.attack_type ?? null} onInteract={playClickSfx} />
              </div>
            )}

            {activeTab === "analysis" && (
              <div>
                <PanelHeader eyebrow="THREAT INTELLIGENCE" title="TACTICAL ANALYSIS" icon={Activity} status={status} active={active} neutralized={neutralized} />
                {!analysis ? (
                  <div className="analysis-empty">
                    <div className={`radar-scope ${isAnalyzing ? "radar-active" : ""}`}>
                      <div className="radar-ring radar-ring-one" />
                      <div className="radar-ring radar-ring-two" />
                      <div className="radar-sweep" />
                      <Radar className="relative z-10 h-10 w-10 text-emerald-400/80" />
                    </div>
                    <p className="mt-6 font-mono text-xs tracking-[0.18em] text-slate-400">
                      {isAnalyzing ? "CORRELATING HOSTILE SIGNALS..." : "NO ACTIVE INCIDENT SELECTED"}
                    </p>
                    <p className="mt-2 max-w-md text-center text-xs leading-relaxed text-slate-600">Trigger a controlled exploit to initiate multi-layer classification.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_190px]">
                      <div className={`incident-banner ${neutralized ? "incident-neutralized" : ""}`}>
                        <div className="flex items-center gap-4">
                          <div className="incident-icon">{neutralized ? <ShieldCheck /> : <ShieldAlert />}</div>
                          <div>
                            <p className="font-mono text-[9px] tracking-[0.2em] text-red-300/70">INCIDENT // {analysis.mitre_technique}</p>
                            <h2 className="mt-1 text-xl font-bold tracking-wide text-white">{analysis.attack_type}</h2>
                          </div>
                        </div>
                        <div className={`severity-badge ${neutralized ? "severity-safe" : ""}`}>{neutralized ? "CONTAINED" : analysis.severity}</div>
                      </div>
                      <ThreatGauge severity={analysis.severity} neutralized={neutralized} />
                    </div>

                    <div className="grid gap-px bg-slate-800 md:grid-cols-3">
                      <IntelMetric label="CONFIDENCE" value="98.7%" meter={98} />
                      <IntelMetric label="MITRE ATT&CK" value={analysis.mitre_technique} meter={74} />
                      <IntelMetric label="BLAST RADIUS" value="SEGMENT C" meter={42} />
                    </div>
                    <div className="intel-panel">
                      <p className="intel-label">AI SITUATION SUMMARY</p>
                      <p className="mt-3 text-sm leading-7 text-slate-300">{analysis.summary}</p>
                    </div>
                    <ComplianceMapper controls={analysis.compliance_frameworks} compliant={neutralized} />
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="intel-panel">
                        <p className="intel-label">CAPTURED PAYLOAD BREAKDOWN</p>
                        <code className="mt-3 block overflow-x-auto border-l-2 border-red-500 bg-red-950/20 p-3 text-[11px] leading-5 text-red-300">{analysis.payload_sample}</code>
                      </div>
                      <div className="intel-panel">
                        <p className="intel-label">RECOMMENDED CONTROL</p>
                        <p className="mt-3 text-xs leading-6 text-slate-400">{analysis.recommended_action}</p>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                      <button className="remediate-button" onClick={() => { playClickSfx(); void executeRemediation(); }} disabled={isRemediating || neutralized || demoMode || campaignActive}>
                        {isRemediating ? <Gauge className="h-4 w-4 animate-spin" /> : neutralized ? <CheckCircle2 className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                        {isRemediating ? "EXECUTING CONTAINMENT..." : neutralized ? "THREAT NEUTRALIZED" : "EXECUTE THREXIS AUTO-FIX"}
                      </button>
                      <button className="export-button" onClick={() => { playClickSfx(); exportReport(); }}><Download className="h-4 w-4" /> EXPORT CISO INCIDENT REPORT</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "containment" && (
              <div>
                <PanelHeader eyebrow="AUTONOMOUS RESPONSE" title="CONTAINMENT ORCHESTRATOR" icon={TerminalSquare} status={status} active={active} neutralized={neutralized} />
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <DefenseTerminal lines={terminalLines} isRemediating={isRemediating} expanded />
                  <div className="space-y-3">
                    <div className="intel-panel">
                      <p className="intel-label">ACTIVE EXECUTION SCRIPTS</p>
                      <ScriptStatus index="01" label="EDGE INGRESS DENY" active={isRemediating} done={neutralized} />
                      <ScriptStatus index="02" label="RATE LIMIT POLICY" active={isRemediating} done={neutralized} />
                      <ScriptStatus index="03" label="SESSION REVOCATION" active={isRemediating} done={neutralized} />
                      <ScriptStatus index="04" label="INTEGRITY VERIFICATION" active={isRemediating} done={neutralized} />
                    </div>
                    <DefenseProtocolPanel protocols={defenseProtocols} onToggle={toggleDefenseProtocol} />
                    <div className="grid grid-cols-2 gap-2">
                      <ControlStatus label="EDGE WAF" status="ARMED" />
                      <ControlStatus label="EDR FABRIC" status="SYNCED" />
                      <ControlStatus label="SOAR ENGINE" status="READY" />
                      <ControlStatus label="EVIDENCE" status="SEALED" />
                    </div>
                    {analysis && !neutralized && (
                      <button className="remediate-button w-full" onClick={() => { playClickSfx(); void executeRemediation(); }} disabled={isRemediating || demoMode || campaignActive}>
                        <ShieldCheck className="h-4 w-4" /> EXECUTE ACTIVE PLAYBOOK
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "history" && (
              <div>
                <PanelHeader eyebrow="FORENSIC LEDGER" title="INCIDENT HISTORY" icon={History} status={status} active={active} neutralized={neutralized} />
                {selectedIncident && <IncidentIntelligence incident={selectedIncident} />}
                <IncidentHistoryTable incidents={incidentHistory} selectedId={selectedIncident?.id} onSelect={setSelectedIncidentId} />
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="relative z-10 border-t border-slate-800 bg-[#030806]">
        <div className="flex items-center justify-between border-b border-emerald-950 px-4 py-2 lg:px-6">
          <div className="flex items-center gap-3">
            <Bot className="h-3.5 w-3.5 text-emerald-400" />
            <span className="font-mono text-[10px] font-bold tracking-[0.16em] text-emerald-400">MATRIX LIVE LOG STREAM</span>
            <span className="hidden font-mono text-[8px] text-emerald-800 sm:block">// SYSLOG-NG · {trafficRps.toLocaleString()} REQ/S</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[8px] tracking-widest text-emerald-700">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> LIVE INGEST
          </div>
        </div>
        <div className="log-stream" aria-live="polite" style={{ "--stream-velocity": streamVelocity } as React.CSSProperties}>
          {stream.slice(-7).map((entry) => (
            <div key={entry.id} className={`log-entry ${entry.attack ? "log-attack" : ""}`}>
              <span className="text-emerald-800">{entry.time}</span>
              <span className={entry.attack ? "text-red-300" : "text-emerald-500/80"}>[{entry.source}]</span>
              <span className={entry.attack ? "text-red-200" : "text-emerald-300/65"}>{entry.message}</span>
            </div>
          ))}
        </div>
      </section>

      {copilotOpen && (
        <>
          <button className="copilot-backdrop" onClick={toggleCopilot} aria-label="Close THREXIS AI Copilot" />
          <aside className="copilot-drawer" role="dialog" aria-modal="true" aria-labelledby="copilot-title">
            <div className="copilot-header">
              <div className="flex items-center gap-3">
                <div className="copilot-mark"><Bot className="h-5 w-5" /></div>
                <div>
                  <p className="text-[8px] tracking-[0.18em] text-emerald-400">SECURE CONTEXT CHANNEL</p>
                  <h2 id="copilot-title" className="mt-1 font-mono text-sm font-semibold tracking-[0.08em] text-white">THREXIS AI COPILOT</h2>
                </div>
              </div>
              <button className="icon-button" onClick={toggleCopilot} aria-label="Close Copilot"><X className="h-4 w-4" /></button>
            </div>

            <div className="copilot-context">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {analysis ? `${analysis.severity} ${analysis.attack_type} · ${analysis.mitre_technique}` : "GLOBAL SENSOR CONTEXT · MONITORING"}
            </div>

            <div className="copilot-chips">
              {copilotPrompts.map((prompt) => (
                <button key={prompt} onClick={() => submitCopilotPrompt(prompt)} disabled={copilotThinking}>{prompt}</button>
              ))}
            </div>

            <div className="copilot-messages" aria-live="polite">
              {copilotMessages.map((message) => (
                <div key={message.id} className={`copilot-message ${message.role === "operator" ? "copilot-message-operator" : ""}`}>
                  <span>{message.role === "operator" ? "SOC-01" : "THREXIS AI"}</span>
                  <pre>{message.content}</pre>
                </div>
              ))}
              {copilotThinking && (
                <div className="copilot-thinking"><i /><i /><i /> CORRELATING PLAYBOOKS</div>
              )}
            </div>

            <form className="copilot-input" onSubmit={(event) => { event.preventDefault(); submitCopilotPrompt(); }}>
              <input
                ref={copilotInputRef}
                value={copilotPrompt}
                onChange={(event) => setCopilotPrompt(event.target.value)}
                placeholder="Ask for a SOC playbook..."
                aria-label="Ask THREXIS AI Copilot"
                maxLength={240}
              />
              <button type="submit" disabled={!copilotPrompt.trim() || copilotThinking} aria-label="Send prompt"><Send className="h-4 w-4" /></button>
            </form>
            <p className="copilot-disclaimer">AI guidance requires operator validation before production execution.</p>
          </aside>
        </>
      )}

      <footer className="relative z-10 flex flex-wrap items-center justify-between gap-2 border-t border-slate-900 bg-black px-4 py-2 font-mono text-[8px] tracking-[0.12em] text-slate-700 lg:px-6">
        <span>THREXIS CORE v4.8.2 // CLASSIFICATION: SOC INTERNAL</span>
        <span>UPTIME 99.999% · LAST POLICY SYNC 00:00:07 AGO</span>
      </footer>
    </main>
  );
}

function PanelHeader({ eyebrow, title, icon, status, active, neutralized }: { eyebrow: string; title: string; icon: typeof Activity; status: string; active: boolean; neutralized: boolean }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <SectionTitle eyebrow={eyebrow} title={title} icon={icon} />
      <div className={`state-pill ${active ? "state-pill-danger" : neutralized ? "state-pill-safe" : ""}`}>
        <CircleDot className="h-3 w-3" /> {status}
      </div>
    </div>
  );
}

const attackSources = [
  { ip: "185.220.101.5", city: "Moscow", country: "RU", volume: "18.2K PPS", risk: "HIGH", top: "25%" },
  { ip: "103.21.244.0", city: "Frankfurt", country: "DE", volume: "24.6K PPS", risk: "CRITICAL", top: "51%" },
  { ip: "45.155.205.233", city: "Singapore", country: "SG", volume: "5.9K PPS", risk: "ELEVATED", top: "77%" },
] as const;

function AttackMap({ active, neutralized, attackType, onInteract }: { active: boolean; neutralized: boolean; attackType: AttackType | null; onInteract: () => void }) {
  const [selectedSource, setSelectedSource] = useState(0);
  const stateClass = active ? "attack-map-danger" : neutralized ? "attack-map-safe" : "attack-map-monitoring";

  useEffect(() => {
    const timer = window.setInterval(() => setSelectedSource((current) => (current + 1) % attackSources.length), 2800);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className={`attack-map ${stateClass}`}>
      <div className="map-grid" aria-hidden="true" />
      <div className="map-toolbar">
        <div><span className="map-live-dot" /> GEO-IP TRAFFIC RADAR // LIVE</div>
        <span>{attackType ? `TRACKING: ${attackType.toUpperCase()}` : `INSPECTING ${attackSources[selectedSource].ip} · ${attackSources[selectedSource].city.toUpperCase()}`}</span>
      </div>
      <svg className="map-links" viewBox="0 0 1000 480" preserveAspectRatio="none" aria-hidden="true">
        <path className={selectedSource === 0 ? "route-selected" : ""} d="M125 105 Q390 45 650 235" />
        <path className={selectedSource === 1 ? "route-selected" : ""} d="M125 235 Q410 190 650 235" />
        <path className={selectedSource === 2 ? "route-selected" : ""} d="M125 365 Q410 435 650 235" />
        <path d="M650 235 Q790 125 875 145" />
        <path d="M650 235 Q790 350 875 335" />
        <circle r="4">
          <animateMotion dur="2.1s" repeatCount="indefinite" path="M125 105 Q390 45 650 235" />
        </circle>
        <circle r="3">
          <animateMotion begin="-.8s" dur="1.8s" repeatCount="indefinite" path="M125 235 Q410 190 650 235" />
        </circle>
        <circle r="3.5">
          <animateMotion begin="-1.5s" dur="2.7s" repeatCount="indefinite" path="M125 365 Q410 435 650 235" />
        </circle>
      </svg>
      {attackSources.map((source, index) => (
        <button
          key={source.ip}
          className={`source-origin ${selectedSource === index ? "source-origin-selected" : ""}`}
          style={{ left: "12.5%", top: source.top }}
          onClick={() => { setSelectedSource(index); onInteract(); }}
          aria-label={`Inspect traffic from ${source.ip}, ${source.city}`}
        >
          <span><MapPin className="h-3.5 w-3.5" /> {source.country}</span>
          <strong>{source.ip}</strong>
          <small>{source.city} · {source.volume}</small>
        </button>
      ))}
      <div className="edge-gateway map-node-critical" style={{ left: "65%", top: "50%" }}>
        <div className="gateway-rings"><Shield className="h-7 w-7" /></div>
        <p>THREXIS EDGE GATEWAY</p>
        <span>{active ? "HOSTILE INGRESS" : neutralized ? "ROUTE SANITIZED" : "POLICY ENFORCED"}</span>
      </div>
      <MapNode icon={Database} label="DATA VAULT" detail="AES-256" left="88%" top="34%" />
      <MapNode icon={Radar} label="SOC CORE" detail="18.4K EPS" left="88%" top="70%" />
      <div className="source-inspector">
        <span>FOCUSED ORIGIN</span>
        <strong>{attackSources[selectedSource].ip}</strong>
        <i>{attackSources[selectedSource].city} // RISK {attackSources[selectedSource].risk}</i>
      </div>
      <div className="map-legend">
        <span><i className="bg-cyan-400" /> LIVE GEO-IP ORIGIN</span>
        <span><i className={active ? "bg-red-400" : "bg-emerald-400"} /> {active ? "EXPLOIT TRAJECTORY" : neutralized ? "REMEDIATED ROUTE" : "INSPECTED TRAFFIC"}</span>
        <span>3 ORIGINS · 5 ROUTES · EDGE LATENCY 12MS</span>
      </div>
    </div>
  );
}

function MapNode({ icon: Icon, label, detail, left, top, critical = false }: { icon: typeof Activity; label: string; detail: string; left: string; top: string; critical?: boolean }) {
  return (
    <div className={`map-node ${critical ? "map-node-critical" : ""}`} style={{ left, top }}>
      <div className="map-node-icon"><Icon className="h-5 w-5" /></div>
      <p>{label}</p>
      <span>{detail}</span>
    </div>
  );
}

function ThreatGauge({ severity, neutralized }: { severity: Analysis["severity"]; neutralized: boolean }) {
  const value = neutralized ? 18 : severity === "CRITICAL" ? 94 : 78;
  return (
    <div className="threat-gauge-card">
      <p className="intel-label">THREAT PRESSURE</p>
      <div className={`threat-gauge ${neutralized ? "threat-gauge-safe" : ""}`} style={{ "--gauge": `${value * 3.6}deg` } as React.CSSProperties}>
        <div><strong>{value}</strong><span>/100</span></div>
      </div>
      <p className={neutralized ? "text-emerald-400" : "text-red-300"}>{neutralized ? "NOMINAL" : severity}</p>
    </div>
  );
}

function ComplianceMapper({ controls, compliant }: { controls: Analysis["compliance_frameworks"]; compliant: boolean }) {
  return (
    <div className={`compliance-card ${compliant ? "compliance-card-safe" : "compliance-card-danger"}`}>
      <div className="compliance-heading">
        <div>
          <ShieldCheck className="h-4 w-4" />
          <span>REGULATORY &amp; COMPLIANCE MAPPER</span>
        </div>
        <strong>{compliant ? "COMPLIANT" : "NON-COMPLIANT"}</strong>
      </div>
      <div className="compliance-controls">
        {controls.map((control) => (
          <div key={`${control.framework}-${control.control}`}>
            <span className="compliance-indicator">{compliant ? <CheckCircle2 className="h-4 w-4" /> : <X className="h-4 w-4" />}</span>
            <div>
              <p>{control.framework}</p>
              <strong>{control.control}</strong>
              <small>{control.requirement}</small>
            </div>
            <i>{compliant ? "PASS" : "FAIL"}</i>
          </div>
        ))}
      </div>
      <footer>{compliant ? `${controls.length}/${controls.length} CONTROL OBJECTIVES ATTESTED` : `0/${controls.length} CONTROL OBJECTIVES PASSING · ACTIVE EXCEPTION`}</footer>
    </div>
  );
}

function DefenseTerminal({ lines, isRemediating, expanded = false }: { lines: string[]; isRemediating: boolean; expanded?: boolean }) {
  return (
    <div className="terminal">
      <div className="terminal-bar">
        <div className="flex gap-1.5"><i /><i /><i /></div>
        <span>root@threxis-secops:~</span>
        <span className="text-emerald-500/60">AES-256</span>
      </div>
      <div className={`terminal-body ${expanded ? "terminal-body-expanded" : ""}`} aria-live="polite">
        {lines.map((line, index) => (
          <div key={`${index}-${line}`} className={line.includes("DONE") ? "terminal-done" : line.includes("ALERT") || line.includes("ERROR") ? "terminal-alert" : ""}>
            <span className="select-none text-slate-700">{String(index + 1).padStart(2, "0")}</span>
            <span>{line}</span>
          </div>
        ))}
        {isRemediating && <span className="terminal-cursor" />}
      </div>
    </div>
  );
}

function DefenseProtocolPanel({ protocols, onToggle }: { protocols: Record<DefenseProtocol, boolean>; onToggle: (protocol: DefenseProtocol) => void }) {
  return (
    <div className="protocol-panel">
      <div className="protocol-heading">
        <div><SlidersHorizontal className="h-3.5 w-3.5" /><span>MANUAL CONTAINMENT</span></div>
        <small>ROOT AUTHORIZED</small>
      </div>
      {protocolDefinitions.map((protocol) => (
        <div className="protocol-row" key={protocol.id}>
          <div>
            <p>{protocol.label}</p>
            <span>{protocol.provider}</span>
          </div>
          <button
            role="switch"
            aria-checked={protocols[protocol.id]}
            aria-label={`${protocol.label}: ${protocols[protocol.id] ? "enabled" : "disabled"}`}
            className={`protocol-switch ${protocols[protocol.id] ? "protocol-switch-on" : ""}`}
            onClick={() => onToggle(protocol.id)}
          >
            <i />
          </button>
        </div>
      ))}
    </div>
  );
}

function ScriptStatus({ index, label, active, done }: { index: string; label: string; active: boolean; done: boolean }) {
  return (
    <div className={`script-status ${active ? "script-status-active" : done ? "script-status-done" : ""}`}>
      <span>{index}</span>
      <p>{label}</p>
      <i>{active ? "RUN" : done ? "DONE" : "READY"}</i>
    </div>
  );
}

const killChainStages = [
  { label: "Initial Access", detail: "External foothold and credential ingress" },
  { label: "Execution", detail: "Hostile payload or query execution" },
  { label: "Persistence", detail: "Durable access or stored application state" },
  { label: "Defense Evasion", detail: "Telemetry suppression and distraction" },
  { label: "Impact", detail: "Availability, integrity, or business disruption" },
] as const;

function IncidentIntelligence({ incident }: { incident: IncidentRecord }) {
  const defaultStage = incident.attackType === "SSH Brute Force" ? 0 : incident.attackType === "SQL Injection" ? 1 : incident.attackType === "Stored XSS" ? 2 : incident.attackType === "Layer 7 DDoS" || incident.attackType === "Slowloris DoS" ? 4 : 3;
  const [focusedStage, setFocusedStage] = useState(defaultStage);
  const model = blastRadiusModels[incident.attackType] ?? {
    lossPerMinute: 0,
    impactedAssets: 0,
    assets: ["Model unavailable for this vector"],
  };

  useEffect(() => setFocusedStage(defaultStage), [defaultStage, incident.id]);

  return (
    <div className="incident-intelligence">
      <div className="killchain-panel">
        <div className="incident-widget-heading">
          <div><GitBranch className="h-4 w-4" /><span>INTERACTIVE KILL-CHAIN TIMELINE</span></div>
          <small>THX-{incident.id} · {incident.technique}</small>
        </div>
        <div className="killchain-track">
          {killChainStages.map((stage, index) => (
            <div className="killchain-step" key={stage.label}>
              {index > 0 && <i className={index <= defaultStage ? "killchain-link-active" : ""} />}
              <button
                className={`${index <= defaultStage ? "killchain-node-reached" : ""} ${focusedStage === index ? "killchain-node-focused" : ""}`}
                onClick={() => setFocusedStage(index)}
                aria-pressed={focusedStage === index}
              >
                <span>0{index + 1}</span>
                <strong>{stage.label}</strong>
              </button>
            </div>
          ))}
        </div>
        <div className="killchain-detail">
          <span>SELECTED PHASE // {killChainStages[focusedStage].label.toUpperCase()}</span>
          <p>{killChainStages[focusedStage].detail}. {focusedStage === defaultStage ? `${incident.attackType} telemetry was correlated at this phase.` : "No confirmed indicator at this phase; retrospective hunt remains active."}</p>
        </div>
      </div>
      <div className="blast-radius-widget">
        <div className="incident-widget-heading">
          <div><DollarSign className="h-4 w-4" /><span>ESTIMATED BLAST RADIUS</span></div>
          <small>SIMULATED MODEL</small>
        </div>
        <p className="blast-vector">{incident.attackType}</p>
        <div className="blast-loss"><span>$</span><strong>{model.lossPerMinute.toLocaleString()}</strong><small>/ MIN DOWNTIME</small></div>
        <div className="blast-meter"><i style={{ width: `${Math.min(100, model.impactedAssets * 7.5)}%` }} /></div>
        <p className="blast-assets-count">{model.impactedAssets} IMPACTED ASSETS</p>
        <div className="blast-assets">
          {model.assets.map((asset) => <span key={asset}>{asset}</span>)}
        </div>
      </div>
    </div>
  );
}

function IncidentHistoryTable({ incidents, selectedId, onSelect }: { incidents: IncidentRecord[]; selectedId?: number; onSelect: (id: number) => void }) {
  return (
    <div className="history-panel">
      <div className="history-summary">
        <div><span>BLOCKED / 24H</span><strong>2,847</strong></div>
        <div><span>CRITICAL EVENTS</span><strong className="text-red-300">019</strong></div>
        <div><span>MEAN TIME TO CONTAIN</span><strong>2.9s</strong></div>
        <div><span>CONTROL COVERAGE</span><strong className="text-emerald-300">99.98%</strong></div>
      </div>
      <div className="overflow-x-auto">
        <table className="incident-table">
          <thead><tr><th>INCIDENT ID</th><th>TIMESTAMP</th><th>ATTACK VECTOR</th><th>MITRE</th><th>SOURCE</th><th>SEVERITY</th><th>DISPOSITION</th></tr></thead>
          <tbody>
            {incidents.map((incident) => (
              <tr key={incident.id} className={selectedId === incident.id ? "incident-row-selected" : ""}>
                <td className="text-slate-500"><button className="incident-select" onClick={() => onSelect(incident.id)}>THX-{incident.id}</button></td>
                <td>{incident.timestamp}</td>
                <td className="font-semibold text-slate-200">{incident.attackType}</td>
                <td className="text-emerald-300">{incident.technique}</td>
                <td>{incident.source}</td>
                <td><span className={`history-severity ${incident.severity === "CRITICAL" ? "history-critical" : ""}`}>{incident.severity}</span></td>
                <td><span className="history-blocked"><ShieldCheck className="h-3 w-3" /> {incident.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TelemetryItem({ icon: Icon, label, value, detail, accent }: { icon: typeof Activity; label: string; value: string; detail?: string; accent?: "red" | "green" }) {
  return (
    <div className="telemetry-item">
      <Icon className={`h-4 w-4 ${accent === "red" ? "text-red-400" : accent === "green" ? "text-emerald-400" : "text-slate-500"}`} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[8px] tracking-[0.14em] text-slate-600">{label}</p>
        <p className={`mt-0.5 truncate font-mono text-xs font-semibold ${accent === "red" ? "text-red-300" : accent === "green" ? "text-emerald-300" : "text-slate-300"}`}>{value}</p>
      </div>
      {detail && <span className="font-mono text-[8px] text-slate-700">{detail}</span>}
    </div>
  );
}

function SectionTitle({ eyebrow, title, icon: Icon }: { eyebrow: string; title: string; icon: typeof Activity }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <div className="section-icon"><Icon className="h-4 w-4" /></div>
      <div>
        <p className="text-[8px] tracking-[0.2em] text-emerald-500/70">{eyebrow}</p>
        <h2 className="mt-0.5 text-xs font-bold tracking-[0.12em] text-slate-200">{title}</h2>
      </div>
    </div>
  );
}

function IntelMetric({ label, value, meter }: { label: string; value: string; meter: number }) {
  return (
    <div className="bg-slate-950 p-4">
      <p className="intel-label">{label}</p>
      <div className="mt-2 flex items-end justify-between"><span className="font-mono text-lg text-slate-200">{value}</span><span className="text-[8px] text-emerald-600">VERIFIED</span></div>
      <div className="mt-3 h-px bg-slate-800"><div className="h-px bg-emerald-400" style={{ width: `${meter}%` }} /></div>
    </div>
  );
}

function ControlStatus({ label, status }: { label: string; status: string }) {
  return (
    <div className="border border-slate-800/80 bg-slate-900/20 p-2.5">
      <p className="text-[8px] tracking-wider text-slate-600">{label}</p>
      <p className="mt-1 flex items-center gap-1.5 font-mono text-[9px] text-emerald-400"><span className="h-1 w-1 rounded-full bg-emerald-400" />{status}</p>
    </div>
  );
}

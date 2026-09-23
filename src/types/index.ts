export type Decision = "APPROVED" | "BLOCKED" | "VERIFY";
export type TxStatus = "Blocked" | "Investigating" | "Verified" | "Approved";
export type Trust = "HIGH" | "MEDIUM" | "LOW";

export interface RiskFactor { label: string; impact: number }
export interface ContextRow { label: string; normal: string; now: string }

export interface Evidence {
  id: string;
  name: string;
  source: string;
  trust: Trust;
  /** Change to risk in percentage points. Negative = reduces risk. */
  impact: number;
  detail: string;
  /** API mode: which hypothesis the evidence supports. */
  direction?: "legit" | "fraud";
}

export interface Verification {
  label: string;
  method: string;
  outcome: "confirmed" | "failed" | "pending";
  resultLabel: string;
}

export interface TxCore {
  id: string;
  amount: number;
  country: string;
  city: string;
  merchant: string;
  device: string;
  vpn: boolean;
  user: string;
  time: string;
}

export interface Scenario {
  key: string;
  title: string;
  tx: TxCore;
  initialRisk: number;
  factors: RiskFactor[];
  context: ContextRow[];
  evidence: Evidence[];
  verification: Verification | null;
  finalRisk: number;
  decision: Decision;
  reason: string;
  /** API mode: investigation state on the backend. */
  status?: "open" | "running" | "awaiting_verification" | "closed";
}

export interface Transaction extends TxCore {
  /** null = not scored by the model yet (API mode). */
  risk: number | null;
  status: TxStatus;
  date: string;
}

export interface Kpi { key: string; label: string; value: number; prefix?: string; suffix?: string; decimals?: number; delta: string; deltaGood: boolean; spark: number[] }

export interface FlowData {
  total: number; suspicious: number; investigated: number; approved: number; verified: number; blocked: number;
}
export interface DistBucket { range: string; count: number; tone: "low" | "mid" | "high" }
export interface TrendPoint { label: string; transactions: number; fraudRate: number }
export interface RegionPoint { region: string; attempts: number; x: number; y: number }

export interface DashboardOverview {
  kpis: Kpi[];
  flow: FlowData;
  distribution: DistBucket[];
  trends: Record<"7D" | "30D" | "90D", TrendPoint[]>;
  regions: RegionPoint[];
  recent: Transaction[];
  prevented: { value: number; delta: string };
}

export interface AnalyticsMetric { key: string; label: string; traditional: number; alibi: number; unit: "%" | "₸M" | "" ; lowerIsBetter: boolean; decimals?: number }
export interface AnalyticsOverview { metrics: AnalyticsMetric[]; prCurve: { recall: number; traditional: number; alibi: number }[]; loss: { label: string; traditional: number; alibi: number }[] }

export interface SimulatorInput { user: string; amount: number; country: string; merchant: string; device: string; vpn: boolean }
export interface Preset { key: string; label: string; blurb: string; input: SimulatorInput }

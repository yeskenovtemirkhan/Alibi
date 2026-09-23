import type { Scenario, TxCore, Transaction, Evidence, RiskFactor, ContextRow } from "../../types";

/** Flagship demo pair: identical amount, place, merchant and initial risk. */
export const LEGIT_ID = "ATX-7842";
export const FRAUD_ID = "ATX-7843";

const base = (id: string, user: string, device: string, vpn: boolean, time: string): TxCore => ({
  id, user, device, vpn, time,
  amount: 650000, country: "Singapore", city: "Singapore", merchant: "Apple Store",
});

export const LEGIT: Scenario = {
  key: "legit-travel",
  title: "Legitimate travel",
  tx: base(LEGIT_ID, "U•••123", "iPhone 15 Pro (first seen today)", false, "10:24 AM"),
  initialRisk: 91,
  factors: [
    { label: "Amount 36× above normal", impact: 31 },
    { label: "New country", impact: 24 },
    { label: "New device", impact: 18 },
    { label: "Unusual merchant", impact: 11 },
  ],
  context: [
    { label: "Typical amount", normal: "₸18,000", now: "₸650,000" },
    { label: "Usual location", normal: "Almaty, KZ", now: "Singapore" },
    { label: "Usual device", normal: "Galaxy S23", now: "iPhone 15 Pro" },
    { label: "Usual merchants", normal: "Grocery, transit", now: "Apple Store" },
  ],
  evidence: [
    { id: "e1", name: "Flight to Singapore", source: "Travel History", trust: "HIGH", impact: -28, detail: "Ticket bought 2 days earlier, Almaty → Singapore." },
    { id: "e2", name: "Hotel booking", source: "Card Transactions", trust: "HIGH", impact: -19, detail: "3-night stay paid with the same card." },
    { id: "e3", name: "Trusted device", source: "Device Graph", trust: "HIGH", impact: -17, detail: "Device matches the customer's mobile banking enrollment." },
    { id: "e4", name: "Previous airport transaction", source: "Transaction History", trust: "MEDIUM", impact: -13, detail: "Almaty airport purchase 2 days earlier." },
  ],
  verification: { label: "Trusted-device verification", method: "Push confirmation to enrolled device", outcome: "confirmed", resultLabel: "Trusted device confirmed" },
  finalRisk: 0.5,
  decision: "APPROVED",
  reason: "Every anomaly has a documented explanation, and the customer confirmed on a trusted device.",
};

export const FRAUD: Scenario = {
  key: "account-takeover",
  title: "Account takeover",
  tx: base(FRAUD_ID, "U•••204", "Unrecognized Android", true, "10:24 AM"),
  initialRisk: 91,
  factors: LEGIT.factors,
  context: [
    { label: "Typical amount", normal: "₸22,000", now: "₸650,000" },
    { label: "Usual location", normal: "Astana, KZ", now: "Singapore" },
    { label: "Usual device", normal: "iPhone 14", now: "Unrecognized Android" },
    { label: "Network", normal: "Home ISP", now: "Commercial VPN" },
  ],
  evidence: [
    { id: "e1", name: "No travel history", source: "Travel History", trust: "HIGH", impact: 1, detail: "No flight, hotel or visa activity for Singapore." },
    { id: "e2", name: "Unknown device", source: "Device Graph", trust: "HIGH", impact: 1, detail: "Fingerprint never seen on this account." },
    { id: "e3", name: "Suspicious VPN", source: "Network Intelligence", trust: "MEDIUM", impact: 0, detail: "Exit node flagged in prior fraud cases." },
    { id: "e4", name: "No matching behavioral context", source: "Behavior Profile", trust: "HIGH", impact: 0, detail: "Nothing in the customer's history explains this purchase." },
  ],
  verification: { label: "Trusted-device verification", method: "Push confirmation to enrolled device", outcome: "failed", resultLabel: "Owner did not confirm" },
  finalRisk: 99,
  decision: "BLOCKED",
  reason: "No evidence supports the anomaly, and the account owner did not confirm on their trusted device.",
};

const NORMAL: Scenario = {
  key: "normal-purchase",
  title: "Normal purchase",
  tx: { id: "SIM-0003", user: "U•••310", device: "Trusted iPhone 14", vpn: false, time: "now", amount: 8500, country: "Kazakhstan", city: "Almaty", merchant: "Magnum" },
  initialRisk: 12,
  factors: [
    { label: "Late-evening purchase", impact: 5 },
    { label: "Amount above weekly average", impact: 4 },
    { label: "Second purchase within 30 minutes", impact: 3 },
  ],
  context: [
    { label: "Typical amount", normal: "₸6,500", now: "₸8,500" },
    { label: "Usual location", normal: "Almaty, KZ", now: "Almaty, KZ" },
    { label: "Usual device", normal: "iPhone 14", now: "iPhone 14" },
    { label: "Usual merchants", normal: "Grocery", now: "Magnum" },
  ],
  evidence: [
    { id: "e1", name: "Usual merchant", source: "Transaction History", trust: "HIGH", impact: -6, detail: "Shopped here 11 times in 60 days." },
    { id: "e2", name: "Trusted device", source: "Device Graph", trust: "HIGH", impact: -3, detail: "Enrolled device, same location." },
  ],
  verification: null,
  finalRisk: 3,
  decision: "APPROVED",
  reason: "Small deviations, fully explained by the customer's usual behavior. No friction needed.",
};

const VELOCITY: Scenario = {
  key: "high-velocity-fraud",
  title: "High-velocity fraud",
  tx: { id: "SIM-0004", user: "U•••305", device: "Emulated Android", vpn: true, time: "now", amount: 48000, country: "Kazakhstan", city: "Almaty", merchant: "Gift-card marketplace" },
  initialRisk: 88,
  factors: [
    { label: "14 attempts in 6 minutes", impact: 34 },
    { label: "Emulator fingerprint", impact: 22 },
    { label: "New merchant category", impact: 18 },
    { label: "Card-testing amount pattern", impact: 14 },
  ],
  context: [
    { label: "Typical amount", normal: "₸15,000", now: "₸48,000 ×14" },
    { label: "Usual location", normal: "Almaty, KZ", now: "Almaty, KZ" },
    { label: "Usual device", normal: "Pixel 7", now: "Emulated Android" },
    { label: "Attempts / hour", normal: "1–2", now: "14" },
  ],
  evidence: [
    { id: "e1", name: "Burst of rapid attempts", source: "Velocity Engine", trust: "HIGH", impact: 3, detail: "14 authorizations in 6 minutes." },
    { id: "e2", name: "Device shared across accounts", source: "Device Graph", trust: "HIGH", impact: 4, detail: "Same fingerprint on 6 other accounts today." },
    { id: "e3", name: "Small-amount probing", source: "Transaction History", trust: "MEDIUM", impact: 2, detail: "Ascending amounts typical of card testing." },
    { id: "e4", name: "No prior gift-card purchases", source: "Behavior Profile", trust: "MEDIUM", impact: 1, detail: "First purchase in this category." },
  ],
  verification: { label: "Cardholder verification", method: "Push confirmation to enrolled device", outcome: "failed", resultLabel: "Cardholder did not confirm" },
  finalRisk: 99,
  decision: "BLOCKED",
  reason: "Velocity, device sharing and probing amounts all point to automated card testing.",
};

export const SIM_SCENARIOS: Record<string, Scenario> = {
  "legit-travel": LEGIT,
  "account-takeover": FRAUD,
  "normal-purchase": NORMAL,
  "high-velocity-fraud": VELOCITY,
};

const round1 = (n: number) => Math.round(n * 10) / 10;
const split = (total: number, weights: number[]): number[] => {
  const parts = weights.map((w) => Math.round(total * w));
  parts[parts.length - 1] += total - parts.reduce((a, b) => a + b, 0);
  return parts;
};

/** Deterministically derive a scenario for any transaction in the explorer. */
export function scenarioForTransaction(row: Transaction): Scenario {
  const t = { ...row, risk: row.risk ?? 0 }; // demo rows are always scored
  if (t.id === LEGIT_ID) return LEGIT;
  if (t.id === FRAUD_ID) return FRAUD;

  const tx: TxCore = { id: t.id, amount: t.amount, country: t.country, city: t.city, merchant: t.merchant, device: t.device, vpn: t.vpn, user: t.user, time: t.time };
  const domestic = t.country === "Kazakhstan";
  const mult = Math.max(2, Math.round(t.amount / 18000));
  const fImp = split(t.risk - 6, [0.36, 0.28, 0.2, 0.16]);
  const factors: RiskFactor[] = [
    { label: `Amount ${mult}× above normal`, impact: fImp[0] },
    { label: domestic ? "Unusual time of day" : "New country", impact: fImp[1] },
    { label: t.vpn ? "VPN / proxy detected" : "New device", impact: fImp[2] },
    { label: "Unusual merchant", impact: fImp[3] },
  ];
  const context: ContextRow[] = [
    { label: "Typical amount", normal: "₸18,000", now: `₸${t.amount.toLocaleString("en-US")}` },
    { label: "Usual location", normal: "Almaty, KZ", now: t.city },
    { label: "Usual device", normal: "Known device", now: t.device },
    { label: "Usual merchants", normal: "Grocery, transit", now: t.merchant },
  ];

  if (t.status === "Blocked") {
    const evidence: Evidence[] = [
      { id: "e1", name: domestic ? "No local activity" : "No travel history", source: "Travel History", trust: "HIGH", impact: 1, detail: "Nothing in the customer's history explains this." },
      { id: "e2", name: "Unknown device", source: "Device Graph", trust: "HIGH", impact: 1, detail: "Fingerprint never seen on this account." },
      { id: "e3", name: "Risky network", source: "Network Intelligence", trust: "MEDIUM", impact: 0, detail: "Connection linked to prior fraud cases." },
      { id: "e4", name: "No matching behavior", source: "Behavior Profile", trust: "HIGH", impact: 0, detail: "Pattern does not match the account's history." },
    ];
    const after = Math.min(99, t.risk + 2);
    return { key: "generic-block", title: "Blocked", tx, initialRisk: t.risk, factors, context, evidence, verification: { label: "Trusted-device verification", method: "Push confirmation to enrolled device", outcome: "failed", resultLabel: "Owner did not confirm" }, finalRisk: Math.min(99, after + 6), decision: "BLOCKED", reason: "No evidence supports the anomaly, and verification failed." };
  }

  if (t.status === "Investigating") {
    const after = Math.round(t.risk * 0.62);
    const drops = split(t.risk - after, [0.4, 0.3, 0.3]);
    const evidence: Evidence[] = [
      { id: "e1", name: domestic ? "Recent activity nearby" : `Travel booking to ${t.city}`, source: "Travel History", trust: "MEDIUM", impact: -drops[0], detail: "Partial match, dates only loosely overlap." },
      { id: "e2", name: "Device partially recognized", source: "Device Graph", trust: "MEDIUM", impact: -drops[1], detail: "Same model, new fingerprint." },
      { id: "e3", name: "Merchant category seen before", source: "Transaction History", trust: "LOW", impact: -drops[2], detail: "Similar purchases in the last 90 days." },
    ];
    return { key: "generic-verify", title: "Needs verification", tx, initialRisk: t.risk, factors, context, evidence, verification: { label: "Customer verification", method: "Push confirmation to enrolled device", outcome: "pending", resultLabel: "Awaiting customer confirmation" }, finalRisk: after, decision: "VERIFY", reason: "Evidence lowers risk but does not close it. Ask the customer to confirm." };
  }

  const drop = t.risk - 14;
  const d = split(drop, [0.36, 0.25, 0.22, 0.17]);
  const evidence: Evidence[] = [
    { id: "e1", name: domestic ? "Recent purchases at merchant" : `Flight to ${t.city}`, source: domestic ? "Transaction History" : "Travel History", trust: "HIGH", impact: -d[0], detail: "Documented activity that explains the anomaly." },
    { id: "e2", name: domestic ? "Location match" : "Hotel booking", source: "Card Transactions", trust: "HIGH", impact: -d[1], detail: "Consistent with the customer's known location." },
    { id: "e3", name: "Trusted device", source: "Device Graph", trust: "HIGH", impact: -d[2], detail: "Matches the customer's mobile banking enrollment." },
    { id: "e4", name: "Spending pattern match", source: "Behavior Profile", trust: "MEDIUM", impact: -d[3], detail: "Consistent with prior purchases of this kind." },
  ];
  const isApproved = t.status === "Approved";
  return { key: "generic-approve", title: isApproved ? "Approved" : "Verified", tx, initialRisk: t.risk, factors, context, evidence, verification: { label: "Trusted-device verification", method: "Push confirmation to enrolled device", outcome: "confirmed", resultLabel: "Trusted device confirmed" }, finalRisk: round1(isApproved ? 0.5 : 0.8), decision: "APPROVED", reason: "Every anomaly has a documented explanation, and the customer confirmed." };
}

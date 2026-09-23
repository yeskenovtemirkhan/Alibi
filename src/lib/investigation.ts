import type { Scenario } from "../types";

export type Phase = "idle" | "received" | "detected" | "factors" | "searching" | "evidence" | "updated" | "verifying" | "verified" | "decision";
export type VerifyState = "none" | "running" | "confirmed" | "failed" | "pending";

export interface Step {
  phase: Phase;
  label: string;
  ms: number;
  risk: number | null;
  evidenceCount: number;
  showFactors: boolean;
  verify: VerifyState;
  decided: boolean;
}

export const IDLE_STEP: Step = { phase: "idle", label: "Ready", ms: 0, risk: null, evidenceCount: 0, showFactors: false, verify: "none", decided: false };

/** Turns a scenario into a linear, declarative sequence. Every UI that "plays" an investigation reads from this. */
export function buildSteps(s: Scenario): Step[] {
  const steps: Step[] = [];
  const add = (p: Partial<Step> & Pick<Step, "phase" | "label" | "ms">) => {
    const prev = steps[steps.length - 1] ?? IDLE_STEP;
    steps.push({ ...prev, decided: false, ...p });
  };
  add({ phase: "received", label: "Transaction received", ms: 500 });
  add({ phase: "detected", label: "Risk detected", ms: 750, risk: s.initialRisk });
  add({ phase: "factors", label: "Analyzing behavior", ms: 850, showFactors: true });
  add({ phase: "searching", label: "Searching for context…", ms: 750 });
  let risk = s.initialRisk;
  s.evidence.forEach((e, i) => {
    risk = Math.round((risk + e.impact) * 10) / 10;
    add({ phase: "evidence", label: `Evidence found: ${e.name}`, ms: 600, evidenceCount: i + 1, risk });
  });
  add({ phase: "updated", label: "Risk updated", ms: 550 });
  if (s.verification) {
    add({ phase: "verifying", label: s.verification.label, ms: 900, verify: "running" });
    add({ phase: "verified", label: s.verification.resultLabel, ms: 700, verify: s.verification.outcome, risk: s.finalRisk });
  }
  add({ phase: "decision", label: s.decision === "APPROVED" ? "Approved" : s.decision === "BLOCKED" ? "Blocked" : "Verification requested", ms: 0, decided: true, risk: s.finalRisk });
  return steps;
}

export const totalMs = (steps: Step[]) => steps.reduce((a, s) => a + s.ms, 0);

import clsx, { type ClassValue } from "clsx";

export const cn = (...v: ClassValue[]) => clsx(v);

export const fmtKZT = (n: number) => "₸" + Math.round(n).toLocaleString("en-US");
export const fmtInt = (n: number) => Math.round(n).toLocaleString("en-US");
export const fmtRisk = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1)) + "%";

export type RiskTone = "high" | "mid" | "low";
export const riskTone = (r: number): RiskTone => (r >= 70 ? "high" : r >= 30 ? "mid" : "low");
export const RISK_COLOR: Record<RiskTone, string> = { high: "#ff1f32", mid: "#f59e0b", low: "#22c55e" };

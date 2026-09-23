import type { DashboardOverview, TrendPoint } from "../../types";
import { TRANSACTIONS } from "./transactions";

function trend(days: number, seed: number): TrendPoint[] {
  const pts: TrendPoint[] = [];
  const end = new Date("2026-09-21T00:00:00Z");
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end); d.setUTCDate(d.getUTCDate() - i);
    const k = days - i;
    const wave = Math.sin((k + seed) / 2.3) * 0.5 + Math.sin((k + seed) / 5.1) * 0.5;
    pts.push({
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
      transactions: Math.round(10800 + wave * 1700 + k * (days > 30 ? 8 : 24)),
      fraudRate: Math.round((1.05 + Math.cos((k + seed) / 3.2) * 0.28 - k * 0.002) * 100) / 100,
    });
  }
  return pts;
}

export const DASHBOARD: DashboardOverview = {
  kpis: [
    { key: "tx", label: "Transactions analyzed", value: 12482, delta: "12% from yesterday", deltaGood: true, spark: [4, 6, 5, 7, 6, 8, 9, 8, 10, 12] },
    { key: "prevented", label: "Fraud prevented", value: 148, delta: "38% from last week", deltaGood: true, spark: [3, 4, 4, 6, 5, 7, 8, 9, 9, 11] },
    { key: "fpr", label: "False positive rate", value: 2.1, suffix: "%", decimals: 1, delta: "0.4 pts from last week", deltaGood: true, spark: [9, 8, 8, 7, 7, 6, 5, 5, 4, 4] },
    { key: "recall", label: "Model recall", value: 96.3, suffix: "%", decimals: 1, delta: "1.2 pts from last week", deltaGood: true, spark: [5, 5, 6, 6, 7, 7, 8, 8, 9, 9] },
  ],
  flow: { total: 12482, suspicious: 1247, investigated: 892, approved: 642, verified: 118, blocked: 132 },
  distribution: [
    { range: "0–20", count: 8120, tone: "low" },
    { range: "20–40", count: 2315, tone: "low" },
    { range: "40–60", count: 800, tone: "mid" },
    { range: "60–80", count: 712, tone: "high" },
    { range: "80–100", count: 535, tone: "high" },
  ],
  trends: { "7D": trend(7, 1), "30D": trend(30, 4), "90D": trend(90, 9) },
  regions: [
    { region: "Kazakhstan", attempts: 412, x: 0.686, y: 0.29 },
    { region: "East Asia", attempts: 236, x: 0.819, y: 0.377 },
    { region: "Europe", attempts: 188, x: 0.528, y: 0.274 },
    { region: "Middle East", attempts: 154, x: 0.633, y: 0.425 },
    { region: "North America", attempts: 97, x: 0.222, y: 0.342 },
    { region: "Southeast Asia", attempts: 160, x: 0.792, y: 0.548 },
  ],
  recent: TRANSACTIONS.filter((t) => t.date === "2026-09-21" && (t.risk ?? 0) >= 60).slice(0, 7),
  prevented: { value: 28.4, delta: "28% from last week" },
};

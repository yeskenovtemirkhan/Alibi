import type { AnalyticsOverview } from "../../types";

export const ANALYTICS: AnalyticsOverview = {
  metrics: [
    { key: "fp", label: "False positives", traditional: 1840, alibi: 840, unit: "", lowerIsBetter: true },
    { key: "loss", label: "Fraud loss", traditional: 12.6, alibi: 7.9, unit: "₸M", lowerIsBetter: true, decimals: 1 },
    { key: "friction", label: "Customer inconvenience", traditional: 6.8, alibi: 2.9, unit: "%", lowerIsBetter: true, decimals: 1 },
    { key: "total", label: "Total business loss", traditional: 39.4, alibi: 18.2, unit: "₸M", lowerIsBetter: true, decimals: 1 },
    { key: "precision", label: "Precision", traditional: 71.4, alibi: 88.9, unit: "%", lowerIsBetter: false, decimals: 1 },
    { key: "recall", label: "Recall", traditional: 88.1, alibi: 96.3, unit: "%", lowerIsBetter: false, decimals: 1 },
    { key: "prauc", label: "PR-AUC", traditional: 0.842, alibi: 0.931, unit: "", lowerIsBetter: false, decimals: 3 },
    { key: "fpr", label: "FPR", traditional: 4.6, alibi: 2.1, unit: "%", lowerIsBetter: true, decimals: 1 },
  ],
  prCurve: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].map((r) => ({
    recall: r,
    traditional: Math.round((0.98 - 0.12 * r - 0.5 * Math.pow(r, 4) - 0.1 * Math.pow(r, 9)) * 1000) / 1000,
    alibi: Math.round((0.99 - 0.05 * r - 0.28 * Math.pow(r, 5) - 0.08 * Math.pow(r, 10)) * 1000) / 1000,
  })),
  loss: [
    { label: "Fraud loss", traditional: 12.6, alibi: 7.9 },
    { label: "Lost sales from false blocks", traditional: 26.8, alibi: 10.3 },
    { label: "Total", traditional: 39.4, alibi: 18.2 },
  ],
};

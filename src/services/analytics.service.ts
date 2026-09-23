import { ANALYTICS } from "../data/demo/analytics";
import type { AnalyticsOverview } from "../types";

/**
 * The Analytics page is a simulated comparison in every data mode, and the UI labels it that way.
 * Real model metrics live in the backend's artifacts/metadata.json; there is no /model/metrics endpoint yet.
 */
export const analyticsService = {
  async getMetrics(): Promise<AnalyticsOverview> {
    return ANALYTICS;
  },
  async replayPolicy(): Promise<AnalyticsOverview> {
    return ANALYTICS;
  },
};

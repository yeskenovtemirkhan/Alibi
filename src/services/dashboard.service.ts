import { IS_DEMO } from "../lib/config";
import { http } from "../lib/http";
import { DASHBOARD } from "../data/demo/dashboard";
import type { DashboardOverview } from "../types";

export const dashboardService = {
  /** GET /analytics/overview */
  async getOverview(): Promise<DashboardOverview> {
    if (IS_DEMO) return DASHBOARD;
    return http<DashboardOverview>("/analytics/overview");
  },
};

import { analyticsService } from "../../../services/analytics.service";
import { AnalyticsView } from "../../../components/app/AnalyticsView";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const data = await analyticsService.getMetrics();
  return <AnalyticsView data={data} />;
}

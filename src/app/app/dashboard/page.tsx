import { dashboardService } from "../../../services/dashboard.service";
import { DashboardRoute } from "../../../components/app/DashboardRoute";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await dashboardService.getOverview();
  return <DashboardRoute data={data} />;
}

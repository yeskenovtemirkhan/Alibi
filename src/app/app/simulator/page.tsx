import { simulatorService } from "../../../services/simulator.service";
import { SimulatorView } from "../../../components/app/SimulatorView";

export const dynamic = "force-dynamic";

export default async function SimulatorPage() {
  const presets = simulatorService.presets();
  const { legit, fraud } = await simulatorService.comparePair();
  return <SimulatorView presets={presets} legit={legit} fraud={fraud} />;
}

import { IS_DEMO } from "../lib/config";
import { http } from "../lib/http";
import { SIM_SCENARIOS, LEGIT, FRAUD, LEGIT_ID, FRAUD_ID } from "../data/demo/scenarios";
import { PRESETS, resolveScenarioKey } from "../data/demo/simulator";
import { investigationService } from "./investigation.service";
import type { Scenario, SimulatorInput, Preset } from "../types";

export const simulatorService = {
  presets(): Preset[] {
    return PRESETS;
  },
  /** POST /transactions/analyze (real LightGBM + SHAP), then the real investigation of the stored transaction. */
  async analyze(input: SimulatorInput): Promise<Scenario> {
    if (IS_DEMO) {
      const base = SIM_SCENARIOS[resolveScenarioKey(input)];
      return { ...base, tx: { ...base.tx, user: input.user, amount: input.amount, country: input.country, merchant: input.merchant, device: input.device, vpn: input.vpn } };
    }
    const analyzed = await http<{ transaction: { id: string } }>("/transactions/analyze", { method: "POST", body: JSON.stringify(input) });
    const scenario = await investigationService.run(analyzed.transaction.id);
    if (!scenario) throw new Error(`Investigation of ${analyzed.transaction.id} failed`);
    return scenario;
  },
  /** Compare mode: the demo pair, or in API mode the two seeded backend scenarios (A = legit traveler, B = account takeover). */
  async comparePair(): Promise<{ legit: Scenario; fraud: Scenario }> {
    if (IS_DEMO) return { legit: LEGIT, fraud: FRAUD };
    const [legit, fraud] = await Promise.all([investigationService.get(LEGIT_ID), investigationService.get(FRAUD_ID)]);
    if (!legit || !fraud) throw new Error("Backend demo scenarios are missing: run `python -m app.seed` on the backend.");
    return { legit, fraud };
  },
};

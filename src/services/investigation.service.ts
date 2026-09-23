import { IS_DEMO } from "../lib/config";
import { ApiError, http } from "../lib/http";
import { scenarioForTransaction } from "../data/demo/scenarios";
import { transactionsService } from "./transactions.service";
import type { Scenario } from "../types";

/** API mode: run the real engine and, if it asks for it, the trusted-device verification (deterministic on the backend). */
async function runToDecision(id: string): Promise<Scenario> {
  const s = await http<Scenario>(`/investigations/${id}/run`, { method: "POST" });
  return s.status === "awaiting_verification" ? http<Scenario>(`/investigations/${id}/verify`, { method: "POST" }) : s;
}

export const investigationService = {
  /** GET /investigations/{id}. In API mode a transaction that was never investigated is investigated now. */
  async get(id: string): Promise<Scenario | null> {
    if (IS_DEMO) {
      const tx = await transactionsService.get(id);
      return tx ? scenarioForTransaction(tx) : null;
    }
    try {
      const s = await http<Scenario>(`/investigations/${id}`);
      return s.status === "awaiting_verification" ? await http<Scenario>(`/investigations/${id}/verify`, { method: "POST" }) : s;
    } catch (e) {
      if (!(e instanceof ApiError) || e.status !== 404) throw e;
    }
    try {
      return await runToDecision(id);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null; // unknown transaction
      throw e;
    }
  },
  /** POST /investigations/{id}/run (+ /verify when the engine asks for it) */
  async run(id: string): Promise<Scenario | null> {
    if (IS_DEMO) return this.get(id);
    return runToDecision(id);
  },
  /** POST /investigations/{id}/verify */
  async verify(id: string): Promise<Scenario | null> {
    if (IS_DEMO) return this.get(id);
    return http<Scenario>(`/investigations/${id}/verify`, { method: "POST" });
  },
};

import { IS_DEMO } from "../lib/config";
import { http } from "../lib/http";
import { TRANSACTIONS, COUNTRY_OPTIONS } from "../data/demo/transactions";
import type { Transaction } from "../types";

export const transactionsService = {
  /** GET /transactions */
  async list(): Promise<Transaction[]> {
    if (IS_DEMO) return TRANSACTIONS;
    return http<Transaction[]>("/transactions");
  },
  /** GET /transactions/{id} */
  async get(id: string): Promise<Transaction | null> {
    if (IS_DEMO) return TRANSACTIONS.find((t) => t.id === id) ?? null;
    return http<Transaction>(`/transactions/${id}`);
  },
  countries(): string[] {
    return COUNTRY_OPTIONS;
  },
};

import { API_URL } from "./config";

export class ApiError extends Error {
  constructor(public status: number, path: string) {
    super(`ALIBI API ${status}: ${path}`);
  }
}

/** Thin fetch wrapper used by services when NEXT_PUBLIC_DATA_MODE=api. */
export async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  if (!res.ok) throw new ApiError(res.status, path);
  return (await res.json()) as T;
}

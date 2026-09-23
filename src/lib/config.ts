export const DATA_MODE: "demo" | "api" = process.env.NEXT_PUBLIC_DATA_MODE === "api" ? "api" : "demo";
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
export const IS_DEMO = DATA_MODE === "demo";

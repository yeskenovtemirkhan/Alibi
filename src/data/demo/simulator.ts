import type { Preset, SimulatorInput } from "../../types";

export const DEVICE_OPTIONS = ["Trusted iPhone 14", "iPhone 15 Pro (first seen today)", "Unrecognized Android", "Emulated Android"];
export const SIM_COUNTRIES = ["Kazakhstan", "Singapore", "UAE", "Turkey", "UK", "USA"];

export const PRESETS: Preset[] = [
  { key: "legit-travel", label: "Legitimate Travel", blurb: "₸650,000 in Singapore on a new iPhone, days after booking the trip.", input: { user: "U•••123", amount: 650000, country: "Singapore", merchant: "Apple Store", device: "iPhone 15 Pro (first seen today)", vpn: false } },
  { key: "account-takeover", label: "Account Takeover", blurb: "Same purchase, from an unknown device behind a VPN.", input: { user: "U•••204", amount: 650000, country: "Singapore", merchant: "Apple Store", device: "Unrecognized Android", vpn: true } },
  { key: "normal-purchase", label: "Normal Purchase", blurb: "Everyday grocery run on the customer's own phone.", input: { user: "U•••310", amount: 8500, country: "Kazakhstan", merchant: "Magnum", device: "Trusted iPhone 14", vpn: false } },
  { key: "high-velocity-fraud", label: "High Velocity Fraud", blurb: "Fourteen rapid gift-card attempts from an emulator.", input: { user: "U•••305", amount: 48000, country: "Kazakhstan", merchant: "Gift-card marketplace", device: "Emulated Android", vpn: true } },
];

export const DEFAULT_INPUT: SimulatorInput = PRESETS[0].input;

/** Deterministic routing: same input always produces the same investigation. */
export function resolveScenarioKey(i: SimulatorInput): string {
  const exact = PRESETS.find((p) => JSON.stringify(p.input) === JSON.stringify(i));
  if (exact) return exact.key;
  if (i.device === "Emulated Android") return "high-velocity-fraud";
  if (i.vpn && i.device !== "Trusted iPhone 14") return "account-takeover";
  if (i.country !== "Kazakhstan" && i.amount >= 300000 && i.device !== "Unrecognized Android") return "legit-travel";
  if (i.country !== "Kazakhstan" && i.amount >= 300000) return "account-takeover";
  return "normal-purchase";
}

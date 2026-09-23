import type { Transaction, TxStatus } from "../../types";
import { FRAUD_ID, LEGIT_ID } from "./scenarios";

export const DEMO_TODAY = "2026-09-21";

type Seed = Omit<Transaction, "date">;

const head: Seed[] = [
  { id: FRAUD_ID, time: "10:24 AM", user: "U•••204", amount: 650000, country: "Singapore", city: "Singapore", merchant: "Apple Store", device: "Unrecognized Android", vpn: true, risk: 91, status: "Blocked" },
  { id: LEGIT_ID, time: "10:24 AM", user: "U•••123", amount: 650000, country: "Singapore", city: "Singapore", merchant: "Apple Store", device: "iPhone 15 Pro", vpn: false, risk: 91, status: "Approved" },
  { id: "ATX-7841", time: "09:58 AM", user: "U•••456", amount: 435000, country: "UAE", city: "Dubai", merchant: "Emirates", device: "iPhone 14", vpn: false, risk: 87, status: "Investigating" },
  { id: "ATX-7840", time: "09:41 AM", user: "U•••789", amount: 210000, country: "Turkey", city: "Istanbul", merchant: "Trendyol", device: "Galaxy S23", vpn: false, risk: 76, status: "Investigating" },
  { id: "ATX-7839", time: "09:17 AM", user: "U•••321", amount: 125000, country: "Kazakhstan", city: "Almaty", merchant: "Kaspi Red", device: "Pixel 7", vpn: false, risk: 71, status: "Verified" },
  { id: "ATX-7838", time: "08:52 AM", user: "U•••654", amount: 398000, country: "Singapore", city: "Singapore", merchant: "Marina Bay Sands", device: "iPhone 15", vpn: false, risk: 68, status: "Investigating" },
];

const MERCHANTS: Record<string, { city: string; merchants: string[] }> = {
  Kazakhstan: { city: "Almaty", merchants: ["Magnum", "Kaspi Red", "Technodom", "Sulpak", "Air Astana"] },
  UAE: { city: "Dubai", merchants: ["Emirates", "Noon", "Dubai Mall", "Careem"] },
  Turkey: { city: "Istanbul", merchants: ["Trendyol", "Hepsiburada", "Turkish Airlines"] },
  Singapore: { city: "Singapore", merchants: ["Apple Store", "Grab", "Shopee", "Marina Bay Sands"] },
  UK: { city: "London", merchants: ["Selfridges", "Booking.com", "Harrods"] },
  USA: { city: "New York", merchants: ["Best Buy", "Amazon", "Delta"] },
  Germany: { city: "Berlin", merchants: ["MediaMarkt", "Zalando", "Lufthansa"] },
  Georgia: { city: "Tbilisi", merchants: ["Booking.com", "Wolt", "Tbilisi Mall"] },
};
const DEVICES = ["iPhone 15", "iPhone 14", "Galaxy S23", "Pixel 7", "Unrecognized Android", "Windows Chrome", "MacBook Safari"];
const COUNTRIES = Object.keys(MERCHANTS);

// Small deterministic PRNG so the demo never changes between renders or reloads.
function lcg(seed: number) {
  let s = seed;
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
}

function pad(n: number) { return String(n).padStart(2, "0"); }

function build(): Transaction[] {
  const rnd = lcg(7842);
  const out: Seed[] = [...head];
  let id = 7837;
  let minutes = 8 * 60 + 40;
  let day = 0;
  while (out.length < 64) {
    const country = COUNTRIES[Math.floor(rnd() * COUNTRIES.length)];
    const m = MERCHANTS[country];
    const risk = Math.round(8 + rnd() * 90);
    const amount = Math.round((3000 + rnd() * rnd() * 700000) / 500) * 500;
    const status: TxStatus = risk >= 85 ? (rnd() > 0.35 ? "Blocked" : "Investigating") : risk >= 60 ? (rnd() > 0.5 ? "Investigating" : "Verified") : "Approved";
    minutes -= 7 + Math.floor(rnd() * 24);
    if (minutes < 0) { minutes += 24 * 60; day = Math.min(day + 1, 6); }
    const h = Math.floor(minutes / 60);
    const ap = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    const user = `U•••${100 + Math.floor(rnd() * 899)}`;
    out.push({
      id: `ATX-${id--}`,
      time: `${pad(h12)}:${pad(minutes % 60)} ${ap}`,
      user,
      amount,
      country,
      city: m.city,
      merchant: m.merchants[Math.floor(rnd() * m.merchants.length)],
      device: DEVICES[Math.floor(rnd() * DEVICES.length)],
      vpn: rnd() > 0.85,
      risk,
      status,
      // stash the day offset in id order; date assigned below
    } as Seed & { _d?: number });
    (out[out.length - 1] as Seed & { _d?: number })._d = day;
  }
  return out.map((t, i) => {
    const d = (t as Seed & { _d?: number })._d ?? 0;
    const date = new Date(`${DEMO_TODAY}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() - d);
    const { _d, ...rest } = t as Seed & { _d?: number };
    void _d; void i;
    return { ...rest, date: date.toISOString().slice(0, 10) };
  });
}

export const TRANSACTIONS: Transaction[] = build();
export const COUNTRY_OPTIONS = COUNTRIES;

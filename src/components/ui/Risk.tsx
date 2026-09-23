"use client";
import { motion } from "framer-motion";
import { cn, riskTone, RISK_COLOR } from "../../lib/utils";
import { TweenNumber } from "../motion/primitives";
import type { Decision, TxStatus } from "../../types";

/** Circular risk gauge that follows its value. */
export function RiskRing({ value, size = 180, stroke = 14, dark = false, pulse = false, label = "risk", className }: { value: number | null; size?: number; stroke?: number; dark?: boolean; pulse?: boolean; label?: string; className?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = value ?? 0;
  const color = value === null ? (dark ? "#2a3038" : "#e4e4e7") : RISK_COLOR[riskTone(v)];
  return (
    <div className={cn("relative grid place-items-center rounded-full", pulse && v >= 90 && "[animation:blocked-pulse_2.4s_ease-in-out_2]", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={dark ? "#1d232b" : "#f0f0f2"} strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: c * (1 - Math.min(100, Math.max(0, v)) / 100), stroke: color }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className={cn("font-extrabold leading-none tracking-tight", dark ? "text-white" : "text-ink")} style={{ fontSize: size * 0.27 }}>
            {value === null ? "—" : <TweenNumber value={v} suffix="%" />}
          </div>
          <div className={cn("mt-1 font-medium", dark ? "text-mute" : "text-ink-3")} style={{ fontSize: Math.max(11, size * 0.075) }}>{label}</div>
        </div>
      </div>
    </div>
  );
}

const statusStyle: Record<TxStatus, string> = {
  Blocked: "bg-red/12 text-red border-red/25",
  Investigating: "bg-warn/12 text-warn-dark border-warn/25",
  Verified: "bg-sky-400/10 text-sky-300 border-sky-400/25",
  Approved: "bg-ok-dark/12 text-ok-dark border-ok-dark/25",
};
export function StatusBadge({ status }: { status: TxStatus }) {
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11.5px] font-semibold", statusStyle[status])}><span className="size-1.5 rounded-full bg-current" />{status}</span>;
}

export function RiskBadge({ value, dark = true }: { value: number | null; dark?: boolean }) {
  if (value === null) return <span title="Not scored by the model yet" className="tnum inline-flex min-w-[46px] justify-center rounded-md bg-white/[0.06] px-2 py-0.5 text-[12.5px] font-bold text-mute">—</span>;
  const t = riskTone(value);
  const cls = {
    high: dark ? "bg-red/14 text-[#ff5a68]" : "bg-red-50 text-red-700",
    mid: dark ? "bg-warn/14 text-warn-dark" : "bg-amber-50 text-amber-700",
    low: dark ? "bg-ok-dark/14 text-ok-dark" : "bg-emerald-50 text-emerald-700",
  }[t];
  return <span className={cn("tnum inline-flex min-w-[46px] justify-center rounded-md px-2 py-0.5 text-[12.5px] font-bold", cls)}>{value}%</span>;
}

const decisionMeta: Record<Decision, { text: string; light: string; dark: string }> = {
  APPROVED: { text: "APPROVED", light: "bg-emerald-50 text-emerald-700 border-emerald-200", dark: "bg-ok-dark/12 text-ok-dark border-ok-dark/30" },
  BLOCKED: { text: "BLOCKED", light: "bg-red-50 text-red-700 border-red-200", dark: "bg-red/14 text-[#ff5a68] border-red/35" },
  VERIFY: { text: "VERIFY", light: "bg-amber-50 text-amber-700 border-amber-200", dark: "bg-warn/12 text-warn-dark border-warn/30" },
};
export function DecisionBadge({ decision, dark = false, size = "md", className }: { decision: Decision; dark?: boolean; size?: "sm" | "md" | "xl"; className?: string }) {
  const m = decisionMeta[decision];
  const sz = { sm: "px-2.5 py-0.5 text-[11.5px]", md: "px-3.5 py-1.5 text-sm", xl: "px-7 py-3 text-3xl md:text-4xl" }[size];
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.86 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className={cn("inline-flex items-center gap-2 rounded-lg border font-extrabold tracking-wide", dark ? m.dark : m.light, sz, className)}
    >
      {m.text}
    </motion.span>
  );
}

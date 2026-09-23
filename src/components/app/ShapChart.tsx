"use client";
import { motion } from "framer-motion";
import type { RiskFactor, Evidence } from "../../types";
import { cn } from "../../lib/utils";

export function ShapChart({ factors, evidence, revealFactors, revealEvidence }: { factors: RiskFactor[]; evidence: Evidence[]; revealFactors: boolean; revealEvidence: number }) {
  const rows = [...factors.map((f) => ({ label: f.label, v: f.impact, on: revealFactors })), ...evidence.map((e, i) => ({ label: e.name, v: e.impact, on: revealEvidence > i }))];
  const max = Math.max(...rows.map((r) => Math.abs(r.v)), 1);
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1.4fr)_44px] items-center gap-3">
          <span className="truncate text-[13px] font-medium text-snow">{r.label}</span>
          <div className="relative h-2 rounded-full bg-white/[0.06]">
            <span className="absolute left-1/2 top-1/2 h-3.5 w-px -translate-y-1/2 bg-white/20" />
            <motion.div className={cn("absolute top-0 h-full rounded-full", r.v >= 0 ? "left-1/2 bg-red" : "right-1/2 bg-ok-dark")} initial={false} animate={{ width: r.on ? `${(Math.abs(r.v) / max) * 48}%` : 0 }} transition={{ duration: 0.5 }} />
          </div>
          <span className={cn("tnum text-right text-[12.5px] font-bold transition-opacity", r.on ? "opacity-100" : "opacity-0", r.v >= 0 ? "text-red" : "text-ok-dark")}>{r.v > 0 ? "+" : ""}{r.v}</span>
        </li>
      ))}
    </ul>
  );
}

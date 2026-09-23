"use client";
import { ArrowDownRight, ArrowUpRight, Activity, ShieldCheck, Scale, Target } from "lucide-react";
import { AnimatedNumber } from "../motion/primitives";
import type { Kpi } from "../../types";
import { cn } from "../../lib/utils";

const ICON = { tx: Activity, prevented: ShieldCheck, fpr: Scale, recall: Target } as const;

function Spark({ data }: { data: number[] }) {
  const w = 120, h = 44, max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - 4 - ((v - min) / (max - min || 1)) * (h - 10)]);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="absolute bottom-3 right-3 h-11 w-[120px] opacity-70" aria-hidden>
      <defs><linearGradient id="spark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ff1f32" stopOpacity=".35" /><stop offset="1" stopColor="#ff1f32" stopOpacity="0" /></linearGradient></defs>
      <path d={`${d}L${w} ${h}L0 ${h}Z`} fill="url(#spark)" />
      <path d={d} fill="none" stroke="#ff1f32" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function MetricCard({ kpi }: { kpi: Kpi }) {
  const I = ICON[kpi.key as keyof typeof ICON] ?? Activity;
  const Arrow = kpi.deltaGood && kpi.key === "fpr" ? ArrowDownRight : ArrowUpRight;
  return (
    <div className="card-dark relative overflow-hidden p-4 md:p-5">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-mute">{kpi.label}</p>
        <span className="grid size-8 place-items-center rounded-lg bg-red/12 text-red"><I size={16} /></span>
      </div>
      <p className="mt-3 text-[34px] font-extrabold leading-none tracking-tight text-white md:text-[38px]">
        <AnimatedNumber value={kpi.value} decimals={kpi.decimals ?? 0} suffix={kpi.suffix} />
      </p>
      <p className={cn("mt-3 inline-flex items-center gap-1 text-[12.5px] font-bold", kpi.deltaGood ? "text-ok-dark" : "text-red")}>
        <Arrow size={14} />{kpi.delta}
      </p>
      <Spark data={kpi.spark} />
    </div>
  );
}

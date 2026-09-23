"use client";
import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { flatLandPath } from "../../lib/geo";
import type { RegionPoint } from "../../types";

const W = 800, H = 324;

export function FraudMap({ regions }: { regions: RegionPoint[] }) {
  const reduced = useReducedMotion();
  const land = useMemo(() => flatLandPath(W, H, 3), []);
  const max = Math.max(...regions.map((r) => r.attempts));
  const sorted = [...regions].sort((a, b) => b.attempts - a.attempts);
  return (
    <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
      <div className="overflow-hidden rounded-xl bg-night-950/60 p-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Fraud attempts by region, demo data">
          <path d={land} stroke="#39414c" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          {regions.map((r, i) => {
            const cx = r.x * W, cy = r.y * H, rad = 8 + (r.attempts / max) * 22;
            return (
              <g key={r.region}>
                <motion.circle cx={cx} cy={cy} r={rad} fill="#ff1f32" fillOpacity={0.16} initial={reduced ? false : { scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }} style={{ transformOrigin: `${cx}px ${cy}px` }} />
                <circle cx={cx} cy={cy} r="3.6" fill="#ff1f32" stroke="#0d1014" strokeWidth="1.5" />
              </g>
            );
          })}
        </svg>
      </div>
      <ol className="space-y-2.5 self-center">
        {sorted.map((r) => (
          <li key={r.region}>
            <div className="flex justify-between text-[13px]"><span className="font-semibold text-white">{r.region}</span><span className="tnum font-bold text-mute">{r.attempts}</span></div>
            <div className="mt-1 h-1.5 rounded-full bg-white/[0.06]"><motion.div className="h-full rounded-full bg-red" initial={reduced ? false : { width: 0 }} animate={{ width: `${(r.attempts / max) * 100}%` }} transition={{ duration: 0.8, delay: 0.2 }} /></div>
          </li>
        ))}
      </ol>
    </div>
  );
}

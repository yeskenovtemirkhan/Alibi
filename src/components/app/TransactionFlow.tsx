"use client";
import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { FlowData } from "../../types";
import { fmtInt } from "../../lib/utils";

const band = (x0: number, a0: number, a1: number, x1: number, b0: number, b1: number) => {
  const m = (x0 + x1) / 2;
  return `M${x0} ${a0}C${m} ${a0} ${m} ${b0} ${x1} ${b0}L${x1} ${b1}C${m} ${b1} ${m} ${a1} ${x0} ${a1}Z`;
};

/** Schematic flow: band thickness is illustrative, numbers are exact. */
export function TransactionFlow({ flow }: { flow: FlowData }) {
  const id = useId().replace(/:/g, "");
  const reduced = useReducedMotion();
  const auto = flow.suspicious - flow.investigated;
  const W = 120;
  const X = [0, 230, 460, 670];
  const pct = (n: number) => `${((n / flow.investigated) * 100).toFixed(0)}%`;

  const nodes = [
    { x: X[0], y: 20, h: 210, w: W, v: fmtInt(flow.total), l: "Total", c: "#ff1f32" },
    { x: X[1], y: 40, h: 164, w: W, v: fmtInt(flow.suspicious), l: "Suspicious", c: "#ff1f32" },
    { x: X[2], y: 40, h: 130, w: W, v: fmtInt(flow.investigated), l: "Investigated", c: "#ff1f32" },
    { x: X[2], y: 182, h: 34, w: W, v: fmtInt(auto), l: "Auto-resolved", c: "#5c6470", small: true },
    { x: X[3], y: 22, h: 64, w: 130, v: fmtInt(flow.approved), l: `Approved · ${pct(flow.approved)}`, c: "#22c55e" },
    { x: X[3], y: 104, h: 28, w: 130, v: fmtInt(flow.verified), l: "Verified", c: "#ffa726", small: true },
    { x: X[3], y: 150, h: 38, w: 130, v: fmtInt(flow.blocked), l: "Blocked", c: "#ff1f32", small: true },
  ];

  const bands = [
    { d: band(X[0] + W, 40, 204, X[1], 40, 204), c: "#ff1f32", o: 0.16 },
    { d: band(X[1] + W, 40, 170, X[2], 40, 170), c: "#ff1f32", o: 0.22 },
    { d: band(X[1] + W, 170, 204, X[2], 182, 216), c: "#5c6470", o: 0.25 },
    { d: band(X[2] + W, 40, 104, X[3], 22, 86), c: "#22c55e", o: 0.3 },
    { d: band(X[2] + W, 104, 132, X[3], 104, 132), c: "#ffa726", o: 0.34 },
    { d: band(X[2] + W, 132, 170, X[3], 150, 188), c: "#ff1f32", o: 0.38 },
  ];

  return (
    <div className="overflow-x-auto scroll-thin">
      <svg viewBox="0 0 800 250" className="min-w-[640px]" role="img" aria-label={`Transaction flow: ${flow.total} total, ${flow.suspicious} suspicious, ${flow.investigated} investigated, ${flow.approved} approved, ${flow.verified} verified, ${flow.blocked} blocked`}>
        <defs>
          <clipPath id={`clip-${id}`}>
            <motion.rect x="0" y="0" height="250" initial={reduced ? { width: 800 } : { width: 0 }} animate={{ width: 800 }} transition={{ duration: 1.3, ease: [0.4, 0, 0.2, 1], delay: 0.15 }} />
          </clipPath>
        </defs>
        <g clipPath={`url(#clip-${id})`}>
          {bands.map((b, i) => <path key={i} d={b.d} fill={b.c} fillOpacity={b.o} />)}
        </g>
        {nodes.map((n, i) => (
          <motion.g key={i} initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 + i * 0.12, duration: 0.35 }}>
            <rect x={n.x} y={n.y} width={n.w} height={n.h} rx="10" fill="#12161b" stroke={n.c} strokeOpacity="0.55" />
            <rect x={n.x} y={n.y + 8} width="3" height={n.h - 16} rx="1.5" fill={n.c} />
            {n.small ? (
              <text x={n.x + 14} y={n.y + n.h / 2 + 5} fill="#f4f5f7" fontSize="13" fontWeight="700">{n.v}<tspan fill="#8b929d" fontWeight="500" dx="6" fontSize="11.5">{n.l}</tspan></text>
            ) : (
              <>
                <text x={n.x + 16} y={n.y + n.h / 2 - 2} fill="#fff" fontSize={n.h > 100 ? 22 : 18} fontWeight="800">{n.v}</text>
                <text x={n.x + 16} y={n.y + n.h / 2 + 16} fill="#8b929d" fontSize="12">{n.l}</text>
              </>
            )}
          </motion.g>
        ))}
      </svg>
    </div>
  );
}

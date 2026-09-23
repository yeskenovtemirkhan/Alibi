"use client";
import { useReducedMotion } from "framer-motion";
import { DrawPath, TransactionParticle } from "../motion/primitives";

const NODES: [number, number][] = [[40, 60], [150, 130], [260, 50], [330, 170], [430, 90], [520, 200], [590, 60], [210, 230], [470, 260], [90, 240]];
const EDGES: [number, number][] = [[0, 1], [1, 2], [1, 3], [2, 4], [3, 4], [4, 5], [4, 6], [3, 7], [5, 8], [1, 9], [7, 9], [3, 5]];

/** Light, static-first network. Two particles only. */
export function NetworkBackdrop({ className, active = true }: { className?: string; active?: boolean }) {
  const reduced = useReducedMotion();
  const path = (a: number, b: number) => {
    const [x1, y1] = NODES[a], [x2, y2] = NODES[b];
    return `M${x1} ${y1} Q${(x1 + x2) / 2} ${(y1 + y2) / 2 - 22} ${x2} ${y2}`;
  };
  return (
    <svg viewBox="0 0 640 300" className={className} preserveAspectRatio="xMaxYMid slice" aria-hidden>
      {EDGES.map(([a, b], i) => <DrawPath key={i} d={path(a, b)} stroke="#ff4d5c" width={1} opacity={0.5} delay={0.1 + i * 0.08} duration={1.1} active={active} />)}
      {NODES.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 4 : 2.8} fill="#ff1f32" />)}
      {!reduced && <><TransactionParticle d={path(1, 3)} dur={3.6} r={2.6} /><TransactionParticle d={path(4, 6)} dur={4.4} begin={1.4} r={2.6} /></>}
    </svg>
  );
}

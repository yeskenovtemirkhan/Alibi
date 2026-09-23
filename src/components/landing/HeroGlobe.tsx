"use client";
import { useEffect, useMemo } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { DrawPath, TransactionParticle } from "../motion/primitives";
import { globeLandPath, project } from "../../lib/geo";

const S = 640, C = S / 2, R = 262, LON0 = 25, LAT0 = 30;

const CITIES = [
  { name: "Almaty", lon: 76.9, lat: 43.25, dx: 0, dy: -44, home: true },
  { name: "Singapore", lon: 103.8, lat: 1.35, dx: 0, dy: -44 },
  { name: "Dubai", lon: 55.3, lat: 25.2, dx: -8, dy: 22 },
  { name: "London", lon: -0.13, lat: 51.5, dx: 0, dy: -44 },
  { name: "New York", lon: -74, lat: 40.7, dx: 6, dy: -44 },
].map((c) => ({ ...c, ...project(c.lon, c.lat, LON0, LAT0, R, C, C) }));
const at = (n: string) => CITIES.find((c) => c.name === n)!;

const ROUTES: [string, string, number][] = [
  ["London", "Dubai", 0.32], ["Dubai", "Almaty", 0.3], ["Almaty", "Singapore", 0.3],
  ["London", "New York", 0.34], ["Dubai", "Singapore", 0.36], ["London", "Almaty", 0.36],
];
function arc(a: string, b: string, lift: number) {
  const p = at(a), q = at(b);
  const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
  return `M${p.x.toFixed(1)} ${p.y.toFixed(1)} Q${(mx + (mx - C) * lift).toFixed(1)} ${(my + (my - C) * lift).toFixed(1)} ${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
}
const ARCS = ROUTES.map(([a, b, l]) => arc(a, b, l));

function graticule() {
  const seg = (pts: { x: number; y: number; visible: boolean }[]) => {
    let d = "", pen = false;
    for (const p of pts) {
      if (!p.visible) { pen = false; continue; }
      d += `${pen ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`; pen = true;
    }
    return d;
  };
  let d = "";
  for (let lat = -60; lat <= 60; lat += 30) {
    const pts = []; for (let lon = -180; lon <= 180; lon += 6) pts.push(project(lon, lat, LON0, LAT0, R, C, C));
    d += seg(pts);
  }
  for (let lon = -180; lon < 180; lon += 30) {
    const pts = []; for (let lat = -88; lat <= 88; lat += 4) pts.push(project(lon, lat, LON0, LAT0, R, C, C));
    d += seg(pts);
  }
  return d;
}

export function HeroGlobe() {
  const reduced = useReducedMotion();
  const land = useMemo(() => globeLandPath(LON0, LAT0, R, C, C, 2.5), []);
  const grid = useMemo(graticule, []);
  const mx = useMotionValue(0), my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 18 }), sy = useSpring(my, { stiffness: 60, damping: 18 });

  useEffect(() => {
    if (reduced || !window.matchMedia("(pointer: fine)").matches) return;
    const on = (e: PointerEvent) => { mx.set((e.clientX / window.innerWidth - 0.5) * 14); my.set((e.clientY / window.innerHeight - 0.5) * 10); };
    window.addEventListener("pointermove", on, { passive: true });
    return () => window.removeEventListener("pointermove", on);
  }, [reduced, mx, my]);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[640px]" role="img" aria-label="Globe showing transaction routes between Almaty, Singapore, Dubai, London and New York">
      {/* atmosphere */}
      <div className="pointer-events-none absolute -inset-[14%] rounded-full [animation:glow-drift_14s_ease-in-out_infinite]" style={{ background: "radial-gradient(closest-side, rgba(255,31,50,0.34), rgba(255,31,50,0.12) 55%, transparent 75%)" }} />
      <motion.div style={{ x: sx, y: sy }} className="absolute inset-0">
        <motion.svg viewBox={`0 0 ${S} ${S}`} className="absolute inset-0 h-full w-full overflow-visible" initial={reduced ? false : { opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.65, ease: [0.22, 1, 0.36, 1] }}>
          <defs>
            <radialGradient id="sphere" cx="38%" cy="30%" r="80%">
              <stop offset="0%" stopColor="#8a1220" />
              <stop offset="42%" stopColor="#3b0a12" />
              <stop offset="100%" stopColor="#12060a" />
            </radialGradient>
            <radialGradient id="rim" cx="50%" cy="50%" r="50%">
              <stop offset="88%" stopColor="rgba(255,31,50,0)" />
              <stop offset="100%" stopColor="rgba(255,60,75,0.55)" />
            </radialGradient>
          </defs>
          <circle cx={C} cy={C} r={R} fill="url(#sphere)" />
          <path d={grid} fill="none" stroke="rgba(255,120,130,0.16)" strokeWidth="0.8" />
          <path d={land} stroke="#ff6f7c" strokeOpacity="0.9" strokeWidth="2.6" strokeLinecap="round" fill="none" />
          <circle cx={C} cy={C} r={R} fill="url(#rim)" />
          <circle cx={C} cy={C} r={R} fill="none" stroke="rgba(255,90,104,0.5)" strokeWidth="1" />

          {ARCS.map((d, i) => (
            <g key={i}>
              <DrawPath d={d} stroke="#ff2a3c" width={5} opacity={0.14} delay={0.95 + i * 0.09} duration={1} />
              <DrawPath d={d} stroke="#ff8a94" width={1.6} delay={0.95 + i * 0.09} duration={1} />
            </g>
          ))}
          {!reduced && ARCS.slice(0, 4).map((d, i) => <TransactionParticle key={i} d={d} dur={3.2 + i * 0.7} begin={1.6 + i * 0.9} />)}

          {CITIES.map((c, i) => (
            <motion.g key={c.name} initial={reduced ? false : { opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.8 + i * 0.07 }} style={{ transformOrigin: `${c.x}px ${c.y}px` }}>
              {!reduced && <circle cx={c.x} cy={c.y} r="6" fill="none" stroke="#ff4d5c" strokeWidth="1.5" style={{ transformOrigin: `${c.x}px ${c.y}px`, animation: `pulse-ring 2.8s ease-out ${i * 0.5}s infinite` }} />}
              <circle cx={c.x} cy={c.y} r={c.home ? 7 : 5.5} fill="#ff1f32" stroke="#fff" strokeWidth="2" />
            </motion.g>
          ))}
        </motion.svg>
        {CITIES.map((c, i) => (
          <motion.span
            key={c.name}
            className="absolute -translate-x-1/2 whitespace-nowrap rounded-lg bg-white px-3 py-1.5 text-[12px] font-bold text-ink shadow-[0_10px_24px_-8px_rgba(0,0,0,0.45)] sm:text-[13px]"
            style={{ left: `${((c.x + c.dx) / S) * 100}%`, top: `${((c.y + c.dy) / S) * 100}%` }}
            initial={reduced ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.9 + i * 0.07 }}
          >
            {c.name}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
}

"use client";
import { useRef, type ReactNode } from "react";
import { motion, useInView, useReducedMotion, type Variants } from "framer-motion";
import { useTween } from "../../lib/useTween";
import { cn } from "../../lib/utils";

export const EASE = [0.22, 1, 0.36, 1] as const;
export const DUR = { micro: 0.15, ui: 0.32, section: 0.55, story: 1.1 } as const;

/** One-time entrance when scrolled into view. Use sparingly: only where entrance itself carries meaning. */
export function Reveal({ children, delay = 0, y = 14, className, as = "div" }: { children: ReactNode; delay?: number; y?: number; className?: string; as?: "div" | "section" | "li" }) {
  const reduced = useReducedMotion();
  const M = motion[as] as typeof motion.div;
  return (
    <M
      className={className}
      initial={reduced ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: DUR.section, ease: EASE, delay }}
    >
      {children}
    </M>
  );
}

export const staggerParent = (stagger = 0.06, delayChildren = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren } },
});
export const staggerChild: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: DUR.ui, ease: EASE } },
};

export function StaggerGroup({ children, className, stagger = 0.06, delay = 0, inView = true }: { children: ReactNode; className?: string; stagger?: number; delay?: number; inView?: boolean }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={staggerParent(stagger, delay)}
      initial={reduced ? "show" : "hidden"}
      {...(inView ? { whileInView: "show", viewport: { once: true, margin: "-40px" } } : { animate: "show" })}
    >
      {children}
    </motion.div>
  );
}
export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return <motion.div className={className} variants={staggerChild}>{children}</motion.div>;
}

/** Counts up once when it enters the viewport. */
export function AnimatedNumber({ value, decimals = 0, prefix = "", suffix = "", duration = 1.4, className }: { value: number; decimals?: number; prefix?: string; suffix?: string; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const v = useTween(inView ? value : 0, { duration, from: 0, enabled: inView });
  return (
    <span ref={ref} className={cn("tnum", className)}>
      {prefix}{v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}
    </span>
  );
}

/** Live number that follows its prop (risk scores etc.). */
export function TweenNumber({ value, decimals, duration = 0.6, suffix = "", className }: { value: number; decimals?: number; duration?: number; suffix?: string; className?: string }) {
  const v = useTween(value, { duration });
  const d = decimals ?? (Number.isInteger(value) ? 0 : 1);
  return <span className={cn("tnum", className)}>{v.toFixed(d)}{suffix}</span>;
}

/** SVG path that draws itself. */
export function DrawPath({ d, stroke = "#ff1f32", width = 2, delay = 0, duration = 1.2, active = true, className, opacity = 1, dash }: { d: string; stroke?: string; width?: number; delay?: number; duration?: number; active?: boolean; className?: string; opacity?: number; dash?: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.path
      d={d}
      fill="none"
      stroke={stroke}
      strokeWidth={width}
      strokeLinecap="round"
      strokeDasharray={dash}
      className={className}
      initial={reduced ? { pathLength: 1, opacity } : { pathLength: 0, opacity: 0 }}
      animate={active ? { pathLength: 1, opacity } : { pathLength: 0, opacity: 0 }}
      transition={{ duration, delay, ease: EASE }}
    />
  );
}

/** Small dot travelling along an SVG path (SMIL: no JS per frame). */
export function TransactionParticle({ d, dur = 3.4, begin = 0, r = 3, color = "#fff" }: { d: string; dur?: number; begin?: number; r?: number; color?: string }) {
  return (
    <circle r={r} fill={color} style={{ filter: "drop-shadow(0 0 4px #ff1f32)" }}>
      <animateMotion dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite" path={d} keyPoints="0;1" keyTimes="0;1" calcMode="linear" />
      <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.12;0.85;1" dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite" />
    </circle>
  );
}

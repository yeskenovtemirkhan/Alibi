"use client";
import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Check, Plus, Equal } from "lucide-react";
import { LEGIT } from "../../data/demo/scenarios";
import { Reveal } from "../motion/primitives";
import { DecisionBadge } from "../ui/Risk";
import { cn } from "../../lib/utils";

function Reason({ eyebrow, title, body, children, flip }: { eyebrow: string; title: string; body: string; children: React.ReactNode; flip?: boolean }) {
  return (
    <Reveal className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
      <div className={cn(flip && "lg:order-2")}>
        <p className="text-[13px] font-bold tracking-widest text-red">{eyebrow}</p>
        <h3 className="mt-3 text-[clamp(1.7rem,3.2vw,2.5rem)] font-extrabold leading-tight tracking-[-0.025em]">{title}</h3>
        <p className="mt-3 max-w-md text-[16.5px] leading-relaxed text-ink-2">{body}</p>
      </div>
      <div className={cn("card-light p-5 md:p-7", flip && "lg:order-1")}>{children}</div>
    </Reveal>
  );
}

function ContextDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const on = useInView(ref, { once: true, amount: 0.5 });
  const item = (i: number) => ({ initial: false as const, animate: { opacity: on ? 1 : 0.15, y: on ? 0 : 6 }, transition: { delay: 0.25 + i * 0.35, duration: 0.35 } });
  return (
    <div ref={ref}>
      <div className="flex flex-wrap items-center gap-2.5 text-[14px] font-bold">
        <motion.span {...item(0)} className="rounded-lg bg-red-50 px-3 py-2 text-red-700">New country</motion.span>
        <motion.span {...item(1)} className="text-ink-3"><Plus size={16} /></motion.span>
        <motion.span {...item(1)} className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-800">Flight booking</motion.span>
        <motion.span {...item(2)} className="text-ink-3"><Plus size={16} /></motion.span>
        <motion.span {...item(2)} className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-800">Hotel</motion.span>
        <motion.span {...item(3)} className="text-ink-3"><Equal size={16} /></motion.span>
        <motion.span {...item(3)} className="rounded-lg bg-ink px-3 py-2 text-white">Expected behavior</motion.span>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 text-[13px]">
        <div className="rounded-xl border border-hair p-3.5"><p className="font-bold text-ink-3">Alone</p><p className="mt-1 text-[15px] font-bold">New country = suspicious</p></div>
        <div className="rounded-xl border border-ok/30 bg-emerald-50/50 p-3.5"><p className="font-bold text-emerald-700">With context</p><p className="mt-1 text-[15px] font-bold">Same country = explained</p></div>
      </div>
    </div>
  );
}

function ExplainDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const on = useInView(ref, { once: true, amount: 0.4 });
  const rows = [...LEGIT.factors.slice(0, 3).map((f) => ({ label: f.label.replace("Amount 36× above normal", "Amount anomaly"), v: f.impact })), ...LEGIT.evidence.slice(0, 3).map((e) => ({ label: e.name, v: e.impact }))];
  return (
    <div ref={ref} className="space-y-2">
      {rows.map((r, i) => (
        <div key={r.label} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_44px] items-center gap-3 text-[13.5px]">
          <span className="truncate font-semibold">{r.label}</span>
          <div className="relative h-2.5 rounded-full bg-paper-3">
            <motion.div className={cn("absolute top-0 h-full rounded-full", r.v > 0 ? "left-1/2 bg-red" : "right-1/2 bg-ok")} initial={false} animate={{ width: on ? `${Math.abs(r.v) * 1.45}%` : 0 }} transition={{ delay: 0.15 + i * 0.12, duration: 0.6 }} />
            <span className="absolute left-1/2 top-[-3px] h-4 w-px bg-ink/20" />
          </div>
          <span className={cn("tnum text-right font-bold", r.v > 0 ? "text-red" : "text-ok")}>{r.v > 0 ? "+" : ""}{r.v}</span>
        </div>
      ))}
      <div className="mt-4 flex items-center justify-between rounded-xl bg-paper-2 px-4 py-3">
        <span className="text-[13.5px] font-semibold text-ink-2">Updated decision</span>
        <DecisionBadge decision="APPROVED" size="sm" />
      </div>
    </div>
  );
}

const CASES = [
  { key: "a", label: "Familiar purchase", lane: 0, note: "Risk is low and behavior matches." },
  { key: "b", label: "Partial evidence", lane: 1, note: "One quick confirmation closes the gap." },
  { key: "c", label: "No evidence", lane: 2, note: "Nothing explains it. Block." },
];
const LANES = ["Approve", "Verify", "Block"];
function FrictionDemo() {
  const [k, setK] = useState("b");
  const lane = CASES.find((c) => c.key === k)!;
  return (
    <div>
      <div role="tablist" aria-label="Example transaction" className="flex flex-wrap gap-2">
        {CASES.map((c) => (
          <button key={c.key} role="tab" aria-selected={k === c.key} onClick={() => setK(c.key)} className={cn("rounded-full border px-3.5 py-1.5 text-[13px] font-bold transition", k === c.key ? "border-ink bg-ink text-white" : "border-hair bg-white text-ink-2 hover:border-ink/30")}>{c.label}</button>
        ))}
      </div>
      <div className="relative mt-5 grid grid-cols-3 gap-2">
        {LANES.map((l, i) => (
          <div key={l} className={cn("relative rounded-xl border px-3 py-5 text-center text-[14px] font-extrabold transition-colors duration-300", lane.lane === i ? (i === 0 ? "border-ok bg-emerald-50 text-emerald-800" : i === 1 ? "border-warn bg-amber-50 text-amber-800" : "border-red bg-red-50 text-red-700") : "border-hair text-ink-3")}>
            {l}
            {lane.lane === i && <motion.span layoutId="dot" className="absolute -top-2 left-1/2 size-4 -translate-x-1/2 rounded-full border-2 border-white bg-ink shadow" transition={{ type: "spring", stiffness: 420, damping: 32 }} />}
          </div>
        ))}
      </div>
      <p className="mt-4 flex items-start gap-2 text-[14px] text-ink-2"><Check size={16} className="mt-0.5 shrink-0 text-ok" />{lane.note} ALIBI picks the least disruptive safe action.</p>
    </div>
  );
}

export function WhyAlibi() {
  return (
    <section id="why" className="scroll-mt-20 bg-paper-2 py-20 md:py-28">
      <div className="mx-auto max-w-[1240px] px-5 md:px-8">
        <Reveal className="max-w-3xl">
          <p className="text-[13px] font-bold tracking-widest text-red">WHY ALIBI</p>
          <h2 className="mt-3 text-[clamp(2rem,4.6vw,3.4rem)] font-extrabold leading-[1.05] tracking-[-0.03em]">Fraud protection without treating every anomaly as fraud.</h2>
        </Reveal>
        <div className="mt-14 space-y-16 md:space-y-24">
          <Reason eyebrow="CONTEXT" title="Understand before blocking." body="ALIBI considers behavioral context before making the final decision."><ContextDemo /></Reason>
          <Reason flip eyebrow="EXPLAINABILITY" title="Know why." body="Risk factors and evidence are visible to fraud analysts."><ExplainDemo /></Reason>
          <Reason eyebrow="LESS FRICTION" title="Verify only when necessary." body="Instead of blocking everything suspicious, ALIBI can request additional verification."><FrictionDemo /></Reason>
        </div>
      </div>
    </section>
  );
}

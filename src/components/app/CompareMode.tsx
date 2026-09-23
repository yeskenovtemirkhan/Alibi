"use client";
import { useEffect, useRef } from "react";
import { useWorkspace } from "../../lib/workspace";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Play, RotateCcw, Check } from "lucide-react";
import type { Scenario } from "../../types";
import { useInvestigation } from "../../lib/useInvestigation";
import { RiskRing, DecisionBadge } from "../ui/Risk";
import { cn, fmtRisk } from "../../lib/utils";

function Lane({ scenario, inv, tone }: { scenario: Scenario; inv: ReturnType<typeof useInvestigation>; tone: "legit" | "fraud" }) {
  const { step, index } = inv;
  const good = tone === "legit";
  return (
    <div className={cn("card-dark flex flex-col p-5 md:p-6", step.decided && (good ? "ring-1 ring-ok-dark/40" : "ring-1 ring-red/40"))}>
      <p className="text-[12px] font-bold uppercase tracking-wider text-mute">{good ? "Transaction A" : "Transaction B"}</p>
      <div className="mt-4 flex justify-center"><RiskRing value={step.risk ?? scenario.initialRisk} size={148} stroke={13} dark pulse label={index < 1 ? "Initial risk" : "Current risk"} /></div>
      <div aria-live="polite" className="mt-4 flex min-h-6 items-center justify-center gap-2 text-center text-[13px] font-semibold text-snow">
        {inv.started && !inv.done && <Loader2 size={13} className="animate-spin text-red" />} {inv.started ? step.label : "Waiting to start"}
      </div>
      <ul className="mt-4 space-y-1.5">
        {scenario.evidence.map((e, i) => (
          <motion.li key={e.id} initial={false} animate={{ opacity: step.evidenceCount > i ? 1 : 0.22 }} className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-2.5 py-1.5 text-[12.5px] font-medium text-snow">
            <span className={cn("grid size-4 place-items-center rounded-full", step.evidenceCount > i ? (good ? "bg-ok-dark text-white" : "bg-warn/70 text-white") : "bg-white/10")}>{step.evidenceCount > i && <Check size={10} strokeWidth={3} />}</span>
            {e.name}
          </motion.li>
        ))}
      </ul>
      <div className="mt-auto flex min-h-[52px] items-center justify-center pt-5">
        <AnimatePresence>{step.decided && <DecisionBadge decision={scenario.decision} dark size="xl" />}</AnimatePresence>
      </div>
    </div>
  );
}

export function CompareMode({ legit, fraud }: { legit: Scenario; fraud: Scenario }) {
  const a = useInvestigation(legit, { speed: 0.9 });
  const b = useInvestigation(fraud, { speed: 0.9 });
  const running = a.playing || b.playing;
  const done = a.done && b.done;
  const bothStarted = a.started && b.started;

  // Truthful headline: real model scores are only "the same" when they actually are.
  const gap = Math.abs(legit.initialRisk - fraud.initialRisk);
  const headline = gap < 0.5 ? "Same risk. Different reality." : gap <= 10 ? "Similar risk. Different reality." : "Same purchase. Different reality.";
  const subline = gap < 0.5
    ? `Both start at ${fmtRisk(legit.initialRisk)}. Watch ALIBI investigate them at the same time.`
    : `Same amount, merchant and city. Initial model risk: ${fmtRisk(legit.initialRisk)} vs ${fmtRisk(fraud.initialRisk)}. Watch ALIBI investigate both at the same time.`;

  const investigateBoth = () => { a.reset(); b.reset(); setTimeout(() => { a.start(); b.start(); }, 0); };

  // Guided demo step 3: scroll here, run both lanes, then hand off to the finale.
  const { guide, setGuide } = useWorkspace();
  const ref = useRef<HTMLElement>(null);
  const guided = guide === "compare";
  useEffect(() => {
    if (!guided) return;
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    const t = setTimeout(investigateBoth, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guided]);
  useEffect(() => {
    if (!guided || !done) return;
    const t = setTimeout(() => setGuide("finale"), 1600);
    return () => clearTimeout(t);
  }, [guided, done, setGuide]);

  return (
    <section ref={ref} id="compare" className="scroll-mt-20 card-dark relative overflow-hidden p-5 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[12px] font-bold tracking-widest text-red">COMPARE MODE</p>
          <h2 className="mt-1 text-[clamp(1.6rem,3.4vw,2.4rem)] font-extrabold tracking-tight text-white">{headline}</h2>
          <p className="mt-1 text-[14px] text-mute">{subline}</p>
        </div>
        <button onClick={investigateBoth} disabled={running} className="inline-flex items-center gap-2 rounded-xl bg-red px-5 py-3 text-[14.5px] font-bold text-white shadow-[0_14px_28px_-12px_rgba(255,31,50,0.85)] transition hover:bg-red-600 disabled:opacity-60">
          {bothStarted ? <RotateCcw size={16} /> : <Play size={16} />} {bothStarted ? "Replay" : "Investigate Both"}
        </button>
      </div>

      <div className="mt-7 grid gap-4 md:grid-cols-2">
        <Lane scenario={legit} inv={a} tone="legit" />
        <Lane scenario={fraud} inv={b} tone="fraud" />
      </div>

      <AnimatePresence>
        {done && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-xl border border-red/25 bg-gradient-to-r from-red/10 to-transparent px-6 py-5 text-center">
            <p className="text-[clamp(1.4rem,3vw,2rem)] font-extrabold text-white">ALIBI found the difference.</p>
            <p className="mt-1 text-[13.5px] text-mute">{gap < 0.5 ? "Identical amount, city and initial risk." : "Identical amount, merchant and city."} Opposite outcomes, both explained by evidence.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

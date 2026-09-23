"use client";
import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { Banknote, Check, MapPin, RotateCcw, Smartphone, ShieldX, ScanSearch, Loader2 } from "lucide-react";
import { LEGIT } from "../../data/demo/scenarios";
import { useInvestigation } from "../../lib/useInvestigation";
import { RiskRing, DecisionBadge } from "../ui/Risk";
import { Reveal } from "../motion/primitives";
import { cn } from "../../lib/utils";

const DETAILS = [
  { icon: Banknote, text: "₸650,000" },
  { icon: MapPin, text: "Singapore" },
  { icon: Smartphone, text: "New iPhone" },
];

function TxDetails() {
  return (
    <ul className="space-y-2.5 text-[15px] font-semibold">
      {DETAILS.map(({ icon: I, text }) => (
        <li key={text} className="flex items-center gap-2.5"><I size={16} className="text-ink-3" />{text}</li>
      ))}
    </ul>
  );
}

export function SameRiskDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const inv = useInvestigation(LEGIT, { speed: 0.45 });
  const { step, index } = inv;

  useEffect(() => { if (inView) inv.start(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [inView]);

  const shownRisk = step.risk ?? LEGIT.initialRisk;
  const leftIdx = Math.min(index, 3); // traditional flow stops at the threshold
  const nodes = ["Risk score", "Threshold", "Block"];
  const blocked = index >= 3;

  return (
    <section id="difference" className="scroll-mt-20 bg-paper-2 py-20 md:py-28">
      <div className="mx-auto max-w-[1240px] px-5 md:px-8">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[13px] font-bold tracking-widest text-red">THE DIFFERENCE</p>
            <h2 className="mt-3 text-[clamp(2rem,4.6vw,3.4rem)] font-extrabold leading-[1.05] tracking-[-0.03em]">Same risk. Different reality.</h2>
            <p className="mt-3 max-w-xl text-[17px] text-ink-2">Two transactions. Same initial risk score. ALIBI finds the difference.</p>
          </div>
          <button onClick={inv.replay} className="inline-flex items-center gap-2 rounded-lg border border-hair bg-white px-4 py-2.5 text-sm font-bold shadow-sm transition hover:border-ink/25">
            <RotateCcw size={15} /> Replay Demo
          </button>
        </Reveal>

        <div ref={ref} className="mt-10 grid gap-5 lg:grid-cols-2">
          {/* WITHOUT */}
          <article className="card-light flex flex-col p-6 md:p-8" aria-label="Without ALIBI">
            <header className="flex items-center gap-2 text-[13px] font-extrabold tracking-wider text-ink-2">
              <span className="size-2.5 rotate-45 bg-red" /> WITHOUT ALIBI
            </header>
            <div className="mt-6 flex items-center gap-7">
              <RiskRing value={LEGIT.initialRisk} size={168} stroke={15} label="Initial risk" />
              <TxDetails />
            </div>

            <div className="mt-8">
              <ol className="relative flex items-center justify-between">
                <div className="absolute left-4 right-4 top-1/2 h-0.5 -translate-y-1/2 bg-hair" />
                <motion.div className="absolute left-4 top-1/2 h-0.5 -translate-y-1/2 bg-red" initial={false} animate={{ width: `calc(${Math.max(0, leftIdx - 1) / 2} * (100% - 2rem))` }} transition={{ duration: 0.35 }} />
                {nodes.map((n, i) => {
                  const on = leftIdx - 1 >= i && index >= 0;
                  return (
                    <li key={n} className="relative z-10 flex flex-col items-center gap-2 bg-white px-2">
                      <span className={cn("grid size-8 place-items-center rounded-full border-2 text-[12px] font-extrabold transition-colors duration-300", on ? "border-red bg-red text-white" : "border-hair bg-white text-ink-3")}>{i + 1}</span>
                      <span className={cn("text-[12.5px] font-semibold", on ? "text-ink" : "text-ink-3")}>{n}{i === 1 ? " exceeded" : ""}</span>
                    </li>
                  );
                })}
              </ol>
            </div>

            <div className="mt-auto pt-8">
              <div className="flex min-h-[64px] items-center gap-4 rounded-xl bg-red-50 px-4 py-3">
                {blocked ? <DecisionBadge decision="BLOCKED" size="md" /> : <span className="text-sm font-semibold text-ink-3">Scoring…</span>}
                <p className="text-[14.5px] font-semibold text-red-800">Looks suspicious. Transaction is blocked.</p>
              </div>
            </div>
          </article>

          {/* WITH */}
          <article className="card-light flex flex-col p-6 ring-1 ring-red/15 md:p-8" style={{ boxShadow: "var(--shadow-lift)" }} aria-label="With ALIBI">
            <header className="flex items-center gap-2 text-[13px] font-extrabold tracking-wider text-ink-2">
              <ScanSearch size={16} className="text-red" /> WITH ALIBI
            </header>
            <div className="mt-6 flex items-center gap-7">
              <RiskRing value={shownRisk} size={168} stroke={15} label={index < 2 ? "Initial risk" : "Current risk"} />
              <TxDetails />
            </div>

            <div className="mt-6 min-h-[196px]" aria-live="polite">
              <div className="mb-2.5 flex h-6 items-center gap-2 text-[13.5px] font-semibold text-ink-3">
                {inv.started && !inv.done ? (<><Loader2 size={14} className="animate-spin text-red" /> {step.label}</>) : inv.done ? <span className="text-ink-2">Investigation complete</span> : <span>Ready to investigate</span>}
              </div>
              <ul className="space-y-1.5">
                {LEGIT.evidence.map((e, i) => {
                  const on = step.evidenceCount > i;
                  return (
                    <motion.li key={e.id} initial={false} animate={{ opacity: on ? 1 : 0.28, x: on ? 0 : -6 }} transition={{ duration: 0.3 }} className="flex items-center justify-between rounded-lg border border-hair bg-paper-2 px-3 py-2 text-[14.5px] font-semibold">
                      <span className="flex items-center gap-2.5">
                        <span className={cn("grid size-5 place-items-center rounded-full transition-colors", on ? "bg-ok text-white" : "bg-hair text-transparent")}><Check size={12} strokeWidth={3} /></span>
                        {e.name}
                      </span>
                      <span className={cn("tnum text-[13px] font-bold", on ? "text-ok" : "text-transparent")}>{e.impact}</span>
                    </motion.li>
                  );
                })}
              </ul>
              <motion.div initial={false} animate={{ opacity: step.verify === "none" ? 0 : 1, height: step.verify === "none" ? 0 : "auto" }} className="overflow-hidden">
                <div className="mt-2 flex items-center gap-2.5 rounded-lg bg-ok/10 px-3 py-2 text-[14px] font-bold text-emerald-800">
                  {step.verify === "running" ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} strokeWidth={3} />}
                  {step.verify === "running" ? LEGIT.verification!.label : LEGIT.verification!.resultLabel}
                </div>
              </motion.div>
            </div>

            <div className="mt-auto pt-6">
              <div className="flex min-h-[64px] items-center gap-4 rounded-xl bg-emerald-50 px-4 py-3">
                {step.decided ? <DecisionBadge decision="APPROVED" size="md" /> : <span className="text-sm font-semibold text-ink-3">Deciding…</span>}
                <p className="text-[14.5px] font-semibold text-emerald-900">Context shows this is a legitimate transaction.</p>
              </div>
            </div>
          </article>
        </div>

        <AnimatePresence>
          {step.decided && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.45 }} className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-night-900 px-6 py-6 text-white md:px-10 md:py-8">
              <p className="text-[clamp(1.5rem,3.4vw,2.4rem)] font-extrabold tracking-tight">ALIBI found the difference.</p>
              <p className="text-[15px] text-mute"><span className="text-white">91%</span> to <span className="font-bold text-ok-dark">0.5%</span> with evidence, not a guess.</p>
            </motion.div>
          )}
        </AnimatePresence>
        <p className="mt-3 flex items-center gap-1.5 text-[12px] text-ink-3"><ShieldX size={13} /> Simulated demo. Scenario data is illustrative.</p>
      </div>
    </section>
  );
}

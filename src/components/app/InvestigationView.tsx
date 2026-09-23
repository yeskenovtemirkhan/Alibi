"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Banknote, Check, ChevronRight, Loader2, MapPin, Pause, Play, RotateCcw, Smartphone, User } from "lucide-react";
import type { Scenario } from "../../types";
import { useInvestigation } from "../../lib/useInvestigation";
import { RiskRing, DecisionBadge } from "../ui/Risk";
import { EvidenceCard } from "./EvidenceCard";
import { ShapChart } from "./ShapChart";
import { DemoBadge } from "./PageHeader";
import { fmtKZT, cn } from "../../lib/utils";
import { useWorkspace } from "../../lib/workspace";
import { GUIDE_TX } from "./GuidedDemo";

function Field({ icon: I, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-8 place-items-center rounded-lg bg-white/[0.05] text-mute"><I size={15} /></span>
      <div><p className="text-[11.5px] text-mute">{label}</p><p className="text-[13.5px] font-semibold text-white">{value}</p></div>
    </div>
  );
}

export function InvestigationView({ scenario: s }: { scenario: Scenario }) {
  const inv = useInvestigation(s);
  const { step, steps, index, playing } = inv;
  const [showAll, setShowAll] = useState(false);
  const { mode, guide } = useWorkspace();
  const guided = guide === "investigation" && s.tx.id === GUIDE_TX;
  // Guided demo: replay the investigation automatically so the judge sees 91% → evidence → decision.
  useEffect(() => { if (guided) { const t = setTimeout(inv.start, 450); return () => clearTimeout(t); } /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [guided]);
  const factorsVisible = showAll || step.showFactors;
  const evidenceVisible = showAll ? s.evidence.length : step.evidenceCount;
  const contextVisible = showAll || index >= 2;

  const controlBtn = "inline-flex items-center gap-1.5 rounded-lg border hairline-dark px-3.5 py-2 text-[13px] font-bold text-white transition hover:bg-white/5 disabled:opacity-35";

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[12.5px] text-mute">Investigation <ChevronRight size={13} /> <span className="tnum font-semibold text-white">{s.tx.id}</span></p>
          <h1 className="mt-1 text-[26px] font-extrabold tracking-tight text-white md:text-[30px]">ALIBI Investigation</h1>
        </div>
        {mode === "demo" && <DemoBadge />}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr] lg:gap-5">
        {/* LEFT: transaction + risk + controls */}
        <div className="space-y-4">
          <section className="card-dark p-5">
            <p className="text-[12px] font-bold uppercase tracking-wider text-mute">Transaction</p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <Field icon={Banknote} label="Amount" value={fmtKZT(s.tx.amount)} />
              <Field icon={MapPin} label="Location" value={`${s.tx.city}, ${s.tx.country}`} />
              <Field icon={Smartphone} label="Device" value={s.tx.device} />
              <Field icon={User} label="Customer" value={s.tx.user} />
            </div>
          </section>

          <section className="card-dark grid place-items-center p-6">
            <RiskRing value={step.risk} size={196} stroke={16} dark pulse label={index < 1 ? "Awaiting analysis" : step.decided ? "Final risk" : "Current risk"} />
            <div className="mt-5 flex items-center gap-2">
              {!inv.started || (!playing && !inv.done) ? (
                <button onClick={inv.started ? inv.resume : inv.start} className={cn(controlBtn, "border-red bg-red text-white hover:bg-red-600")}><Play size={14} /> {inv.started ? "Resume" : "Run Investigation"}</button>
              ) : (
                <button onClick={inv.pause} disabled={inv.done} className={controlBtn}><Pause size={14} /> Pause</button>
              )}
              <button onClick={inv.skip} disabled={inv.done} className={controlBtn}>Skip</button>
              <button onClick={() => { setShowAll(false); inv.replay(); }} className={controlBtn}><RotateCcw size={14} /> Replay</button>
            </div>
            <div aria-live="polite" className="mt-4 flex h-5 items-center gap-2 text-[13px] font-semibold text-snow">
              {inv.started && !inv.done && playing && <Loader2 size={13} className="animate-spin text-red" />}
              {inv.started ? step.label : "Ready to investigate"}
            </div>
            <div className="mt-3 h-1 w-full max-w-[220px] overflow-hidden rounded-full bg-white/10">
              <motion.div className="h-full rounded-full bg-red" initial={false} animate={{ width: `${inv.progress * 100}%` }} transition={{ duration: 0.3 }} />
            </div>
          </section>

          {step.decided && (
            <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card-dark p-5">
              <p className="text-[12px] font-bold uppercase tracking-wider text-mute">Final decision</p>
              <div className="mt-3 flex items-center gap-3"><DecisionBadge decision={s.decision} dark size="md" /></div>
              <p className="mt-3 text-[13.5px] leading-relaxed text-snow/85">{s.reason}</p>
            </motion.section>
          )}
        </div>

        {/* RIGHT: factors, context, evidence, why */}
        <div className="space-y-4">
          <section className="card-dark p-5">
            <p className="text-[12px] font-bold uppercase tracking-wider text-mute">Risk factors</p>
            <ul className="mt-3 space-y-2">
              {s.factors.map((f) => (
                <motion.li key={f.label} initial={false} animate={{ opacity: factorsVisible ? 1 : 0.2 }} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3.5 py-2.5 text-[13.5px]">
                  <span className="font-medium text-snow">{f.label}</span>
                  <span className="tnum font-bold text-warn-dark">+{f.impact}</span>
                </motion.li>
              ))}
            </ul>
          </section>

          <section className="card-dark p-5">
            <p className="text-[12px] font-bold uppercase tracking-wider text-mute">Behavioral context</p>
            <div className="mt-3 overflow-hidden rounded-lg hairline-dark">
              <table className="w-full text-[13px]">
                <thead><tr className="bg-white/[0.03] text-mute"><th className="px-3 py-2 text-left font-semibold">Signal</th><th className="px-3 py-2 text-left font-semibold">Usual</th><th className="px-3 py-2 text-left font-semibold">This transaction</th></tr></thead>
                <tbody>
                  {s.context.map((c) => (
                    <motion.tr key={c.label} initial={false} animate={{ opacity: contextVisible ? 1 : 0.25 }} className="border-t hairline-dark">
                      <td className="px-3 py-2.5 font-medium text-snow">{c.label}</td>
                      <td className="tnum px-3 py-2.5 text-mute">{c.normal}</td>
                      <td className="tnum px-3 py-2.5 font-semibold text-white">{c.now}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card-dark p-5">
            <p className="text-[12px] font-bold uppercase tracking-wider text-mute">Evidence timeline</p>
            <ul className="mt-3 space-y-2.5">{s.evidence.map((e, i) => <EvidenceCard key={e.id} e={e} revealed={showAll || evidenceVisible > i} locked={s.decision === "APPROVED" && (showAll || evidenceVisible > i)} />)}</ul>
          </section>

          {s.verification && (
            <section className="card-dark p-5">
              <p className="text-[12px] font-bold uppercase tracking-wider text-mute">Verification</p>
              <div className={cn("mt-3 flex items-center gap-3 rounded-lg px-3.5 py-3", step.verify === "confirmed" ? "bg-ok-dark/10" : step.verify === "failed" ? "bg-red/10" : "bg-white/[0.03]")}>
                {step.verify === "running" ? <Loader2 size={16} className="animate-spin text-warn-dark" /> : step.verify === "confirmed" ? <Check size={16} className="text-ok-dark" /> : step.verify === "failed" ? <span className="text-red">✕</span> : <span className="size-4 rounded-full border-2 hairline-dark" />}
                <div><p className="text-[13.5px] font-semibold text-white">{s.verification.label}</p><p className="text-[12px] text-mute">{step.verify === "none" ? s.verification.method : step.verify === "running" ? "Waiting for response…" : s.verification.resultLabel}</p></div>
              </div>
            </section>
          )}

          <section className="card-dark p-5">
            <p className="text-[12px] font-bold uppercase tracking-wider text-mute">Why this decision</p>
            <p className="mt-1 text-[12px] text-mute">Model explanation, translated from raw factors.</p>
            <div className="mt-4"><ShapChart factors={s.factors} evidence={s.evidence} revealFactors={showAll || step.showFactors} revealEvidence={showAll ? s.evidence.length : step.evidenceCount} /></div>
          </section>
        </div>
      </div>
    </div>
  );
}

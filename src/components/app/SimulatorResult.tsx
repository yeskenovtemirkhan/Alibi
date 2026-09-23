"use client";
import { useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Loader2, RotateCcw } from "lucide-react";
import type { Scenario } from "../../types";
import { useInvestigation } from "../../lib/useInvestigation";
import { RiskRing, DecisionBadge } from "../ui/Risk";
import { EvidenceCard } from "./EvidenceCard";
import { cn } from "../../lib/utils";

export function SimulatorResult({ scenario, investigationHref }: { scenario: Scenario; investigationHref?: string }) {
  const inv = useInvestigation(scenario, { speed: 0.85 });
  useEffect(() => { inv.start(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [scenario]);
  const { step, index } = inv;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-dark p-5 md:p-6">
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-bold uppercase tracking-wider text-mute">Investigation</p>
        <button onClick={inv.replay} className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-mute hover:text-white"><RotateCcw size={13} /> Replay</button>
      </div>
      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <RiskRing value={step.risk ?? scenario.initialRisk} size={150} stroke={13} dark pulse label={index < 1 ? "Initial risk" : "Current risk"} />
        <div className="w-full flex-1">
          <div aria-live="polite" className="flex min-h-6 items-center gap-2 text-[13.5px] font-semibold text-snow">
            {inv.started && !inv.done && <Loader2 size={14} className="animate-spin text-red" />} {inv.started ? step.label : "Ready to investigate"}
          </div>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10"><motion.div className="h-full rounded-full bg-red" initial={false} animate={{ width: `${inv.progress * 100}%` }} /></div>
        </div>
      </div>
      <ul className="mt-5 space-y-2">{scenario.evidence.map((e, i) => <EvidenceCard key={e.id} e={e} revealed={step.evidenceCount > i} locked={scenario.decision === "APPROVED" && step.evidenceCount > i} />)}</ul>
      <div className={cn("mt-5 flex min-h-[68px] items-center gap-4 rounded-xl px-4 py-3.5", step.decided ? (scenario.decision === "APPROVED" ? "bg-ok-dark/10" : scenario.decision === "BLOCKED" ? "bg-red/10" : "bg-warn/10") : "bg-white/[0.03]")}>
        {step.decided ? <DecisionBadge decision={scenario.decision} dark size="md" /> : <span className="text-sm font-semibold text-mute">Deciding…</span>}
        {step.decided && <p className="text-[13.5px] leading-snug text-snow/85">{scenario.reason}</p>}
      </div>
      {investigationHref && step.decided && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t hairline-dark pt-4">
          <p className="text-[12.5px] text-mute">Saved to your workspace as <span className="tnum font-bold text-white">{scenario.tx.id}</span></p>
          <Link href={investigationHref} className="inline-flex items-center gap-1.5 rounded-lg bg-red px-4 py-2.5 text-[13px] font-bold text-white transition hover:bg-red-600">Open full investigation <ArrowRight size={14} /></Link>
        </motion.div>
      )}
    </motion.div>
  );
}

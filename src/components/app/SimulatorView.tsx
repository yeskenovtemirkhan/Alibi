"use client";
import { useState } from "react";
import type { Preset, Scenario, SimulatorInput } from "../../types";
import { simulatorService } from "../../services/simulator.service";
import { PageHeader } from "./PageHeader";
import { SimulatorForm } from "./SimulatorForm";
import { SimulatorResult } from "./SimulatorResult";
import { CompareMode } from "./CompareMode";
import { EmptyState } from "../ui/States";
import { FlaskConical } from "lucide-react";
import { useWorkspace } from "../../lib/workspace";

export function SimulatorView({ presets, legit, fraud }: { presets: Preset[]; legit: Scenario; fraud: Scenario }) {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [busy, setBusy] = useState(false);
  const { mode, addAnalysis } = useWorkspace();

  const analyze = async (input: SimulatorInput) => {
    setBusy(true); setScenario(null);
    const s = await simulatorService.analyze(input);
    // Fresh workspace: every analysis becomes a local transaction + investigation.
    setBusy(false); setScenario(mode === "fresh" ? addAnalysis(s).scenario : s);
  };

  return (
    <div>
      <PageHeader title="Live Transaction Simulator" subtitle="Build a transaction, or pick a preset, and watch ALIBI investigate it." />
      <div className="grid gap-5 lg:grid-cols-2">
        <SimulatorForm presets={presets} onAnalyze={analyze} analyzing={busy} />
        {scenario ? <SimulatorResult key={scenario.tx.id + scenario.key} scenario={scenario} investigationHref={mode === "fresh" ? `/app/investigation/${scenario.tx.id}` : undefined} /> : <EmptyState className="h-full" title="No simulation started." hint="Choose a preset or fill in the form, then analyze a transaction." icon={<FlaskConical size={20} />} />}
      </div>
      <div className="mt-8"><CompareMode legit={legit} fraud={fraud} /></div>
    </div>
  );
}

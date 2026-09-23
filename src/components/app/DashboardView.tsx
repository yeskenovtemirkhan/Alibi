"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AnimatedNumber } from "../motion/primitives";
import { MetricCard } from "./MetricCard";
import { TransactionFlow } from "./TransactionFlow";
import { RiskDistribution, TrendChart } from "./Charts";
import { FraudMap } from "./FraudMap";
import { TransactionTable } from "./TransactionTable";
import { DemoBadge } from "./PageHeader";
import { NetworkBackdrop } from "../ui/NetworkBackdrop";
import type { DashboardOverview } from "../../types";

function Panel({ title, right, children, className = "" }: { title: string; right?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`card-dark min-w-0 p-4 md:p-5 ${className}`}>
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1"><h2 className="text-[15px] font-bold text-white">{title}</h2>{right}</div>
      {children}
    </section>
  );
}

function PreventedCard({ p }: { p: DashboardOverview["prevented"] }) {
  const bars = [30, 44, 38, 58, 50, 72, 92];
  return (
    <section className="relative flex flex-col overflow-hidden rounded-[14px] border border-red/25 bg-gradient-to-br from-[#2a0709] via-[#160508] to-night-900 p-5">
      <div className="flex items-center justify-between"><h2 className="text-[15px] font-bold text-white">Fraud prevented</h2><span className="rounded-md bg-white/10 px-2 py-1 text-[11.5px] font-semibold text-snow">Last 7 days</span></div>
      <p className="mt-4 text-[44px] font-extrabold leading-none tracking-tight text-white"><AnimatedNumber value={p.value} decimals={1} prefix="₸" suffix="M" /></p>
      <p className="mt-2 text-[13px] text-mute">Estimated loss prevented <span className="ml-1 font-bold text-ok-dark">+{p.delta}</span></p>
      <div className="mt-auto flex h-24 items-end gap-2 pt-6" aria-hidden>
        {bars.map((h, i) => <div key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-red-800 to-red" style={{ height: `${h}%`, opacity: 0.5 + i * 0.07 }} />)}
      </div>
    </section>
  );
}

export function DashboardView({ data, preview = false, greetingText = "Good morning, Aigerim", highlightId }: { data: DashboardOverview; preview?: boolean; greetingText?: string; highlightId?: string }) {
  return (
    <div className="space-y-4 md:space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-tight text-white md:text-[30px]">{greetingText}</h1>
          <p className="mt-1 text-[14.5px] text-mute">Here’s what’s happening with your fraud protection today.</p>
        </div>
        <div className="flex items-center gap-2"><DemoBadge /><span className="rounded-lg border hairline-dark px-3 py-1.5 text-[12.5px] font-semibold text-snow">Sep 21, 2026</span></div>
      </header>

      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">{data.kpis.map((k) => <MetricCard key={k.key} kpi={k} />)}</div>

      <div className="grid gap-4 md:gap-5 xl:grid-cols-[1.85fr_1fr]">
        <Panel title="Transaction flow" right={<span className="text-[12px] text-mute">Last 24 hours · band width schematic</span>}><TransactionFlow flow={data.flow} /></Panel>
        <PreventedCard p={data.prevented} />
      </div>

      <div className="grid gap-4 md:gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Panel title="Fraud trends"><TrendChart data={data.trends} /></Panel>
        <Panel title="Risk distribution" right={<span className="text-[12px] text-mute">{data.flow.total.toLocaleString("en-US")} transactions</span>}><RiskDistribution data={data.distribution} /></Panel>
      </div>

      <Panel title="Recent high-risk transactions" right={preview ? null : <Link href="/app/transactions" className="text-[12.5px] font-bold text-red hover:underline">View all</Link>}>
        <TransactionTable rows={data.recent} animate highlightId={highlightId} />
      </Panel>

      <Panel title="Fraud attempts by region" right={<span className="text-[12px] text-mute">Demo data</span>}><FraudMap regions={data.regions} /></Panel>

      <section className="relative overflow-hidden rounded-[14px] border border-red/30 bg-gradient-to-r from-[#3a0a10] via-[#1b0609] to-night-900 p-6 md:p-9">
        <NetworkBackdrop className="pointer-events-none absolute inset-y-0 right-0 h-full w-[60%] opacity-60" />
        <div className="relative max-w-xl">
          <h2 className="text-[clamp(1.5rem,3vw,2.2rem)] font-extrabold leading-tight tracking-tight text-white">Context turns risk into understanding.</h2>
          <p className="mt-2 text-[15px] text-snow/75">Investigate suspicious transactions, see the evidence, and make confident decisions.</p>
          <Link href="/app/simulator" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-red px-5 py-3 text-[14px] font-bold text-white transition hover:bg-red-600">Try a Transaction <ArrowRight size={16} /></Link>
        </div>
      </section>
    </div>
  );
}

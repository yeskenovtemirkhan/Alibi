"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, BarChart3 } from "lucide-react";
import { EmptyState } from "../ui/States";
import { useWorkspace } from "../../lib/workspace";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader, DemoBadge } from "./PageHeader";
import type { AnalyticsOverview } from "../../types";
import { cn } from "../../lib/utils";

function fmt(v: number, unit: string, decimals = 0) { return unit === "₸M" ? `₸${v.toFixed(decimals)}M` : unit === "%" ? `${v.toFixed(decimals)}%` : v.toFixed(decimals); }

function MetricRow({ m }: { m: AnalyticsOverview["metrics"][number] }) {
  const better = m.lowerIsBetter ? m.alibi < m.traditional : m.alibi > m.traditional;
  const delta = m.traditional === 0 ? 0 : ((m.alibi - m.traditional) / m.traditional) * 100;
  const max = Math.max(m.traditional, m.alibi) || 1;
  return (
    <div className="border-b hairline-dark py-4 last:border-0">
      <div className="flex items-baseline justify-between"><p className="text-[14px] font-bold text-white">{m.label}</p><span className={cn("text-[12.5px] font-bold", better ? "text-ok-dark" : "text-red")}>{delta > 0 ? "+" : ""}{delta.toFixed(1)}%</span></div>
      {[{ n: "Traditional", v: m.traditional, c: "bg-white/30" }, { n: "ALIBI", v: m.alibi, c: "bg-red" }].map((r) => (
        <div key={r.n} className="mt-2 grid grid-cols-[86px_1fr_76px] items-center gap-3 text-[12.5px]">
          <span className="text-mute">{r.n}</span>
          <div className="h-2 rounded-full bg-white/[0.06]"><motion.div className={`h-full rounded-full ${r.c}`} initial={{ width: 0 }} whileInView={{ width: `${(r.v / max) * 100}%` }} viewport={{ once: true }} transition={{ duration: 0.7 }} /></div>
          <span className="tnum text-right font-bold text-white">{fmt(r.v, m.unit, m.decimals ?? 0)}</span>
        </div>
      ))}
    </div>
  );
}

export function AnalyticsView({ data }: { data: AnalyticsOverview }) {
  const { mode, enterDemo } = useWorkspace();
  const router = useRouter();
  if (mode === "fresh") {
    return (
      <div>
        <PageHeader title="Model & Business Analytics" subtitle="Traditional score-only detection vs ALIBI." />
        <EmptyState
          className="card-dark border-solid py-20"
          icon={<BarChart3 size={20} />}
          title="No analytics yet."
          hint="Run transactions through ALIBI to start building your fraud analytics."
          action={
            <div className="flex flex-wrap justify-center gap-2.5">
              <Link href="/app/simulator" className="inline-flex items-center gap-2 rounded-lg bg-red px-5 py-3 text-[14px] font-bold text-white transition hover:bg-red-600">Open Simulator <ArrowRight size={16} /></Link>
              <button onClick={() => { enterDemo(); router.refresh(); }} className="rounded-lg border border-white/15 px-5 py-3 text-[14px] font-bold text-white transition hover:bg-white/5">View Demo Analytics</button>
            </div>
          }
        />
      </div>
    );
  }
  return (
    <div>
      <PageHeader title="Model & Business Analytics" subtitle="Traditional score-only detection vs ALIBI." right={<DemoBadge label="Simulated demo comparison" />} />
      <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
        <section className="card-dark p-5 md:p-6">
          <h2 className="text-[15px] font-bold text-white">Traditional Fraud Detection vs ALIBI</h2>
          <div className="mt-2 divide-y hairline-dark">{data.metrics.map((m) => <MetricRow key={m.key} m={m} />)}</div>
        </section>

        <div className="space-y-5">
          <section className="card-dark p-5 md:p-6">
            <h2 className="text-[15px] font-bold text-white">Precision–recall curve</h2>
            <div className="mt-3 h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.prCurve} margin={{ top: 6, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="pr1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ff1f32" stopOpacity={0.35} /><stop offset="1" stopColor="#ff1f32" stopOpacity={0} /></linearGradient>
                    <linearGradient id="pr2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8b929d" stopOpacity={0.25} /><stop offset="1" stopColor="#8b929d" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="recall" tickFormatter={(v) => v.toFixed(1)} tick={{ fill: "#8b929d", fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 1]} tick={{ fill: "#8b929d", fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "#0d1014", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12.5 }} labelFormatter={(v) => `Recall ${Number(v).toFixed(2)}`} formatter={(v, n) => [Number(v).toFixed(3), n === "alibi" ? "ALIBI" : "Traditional"]} />
                  <Area type="monotone" dataKey="traditional" stroke="#8b929d" fill="url(#pr2)" strokeWidth={1.5} />
                  <Area type="monotone" dataKey="alibi" stroke="#ff1f32" fill="url(#pr1)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-1 flex gap-4 text-[12px] text-mute"><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-red" />ALIBI</span><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-white/40" />Traditional</span></p>
          </section>

          <section className="card-dark p-5 md:p-6">
            <h2 className="text-[15px] font-bold text-white">Business loss breakdown</h2>
            <ul className="mt-3 space-y-3">
              {data.loss.map((l) => (
                <li key={l.label}>
                  <div className="flex justify-between text-[13px]"><span className="font-semibold text-white">{l.label}</span><span className="tnum text-mute">₸{l.traditional}M → ₸{l.alibi}M</span></div>
                  <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                    <div className="h-2 rounded-full bg-white/15" style={{ width: "100%" }} />
                    <div className="h-2 rounded-full bg-red" style={{ width: `${(l.alibi / l.traditional) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

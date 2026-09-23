"use client";
import { useState } from "react";
import { Area, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DistBucket, TrendPoint } from "../../types";
import { cn, fmtInt } from "../../lib/utils";

const TONE = { low: "#22c55e", mid: "#ffa726", high: "#ff1f32" } as const;

function Tip({ active, label, rows }: { active?: boolean; label?: string; rows: { name: string; value: string; color: string }[] }) {
  if (!active) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-night-950/95 px-3 py-2 text-[12.5px] shadow-xl backdrop-blur">
      <p className="mb-1 font-bold text-white">{label}</p>
      {rows.map((r) => <p key={r.name} className="flex items-center gap-2 text-mute"><span className="size-2 rounded-full" style={{ background: r.color }} />{r.name}<span className="ml-auto pl-3 font-bold text-white">{r.value}</span></p>)}
    </div>
  );
}

export function RiskDistribution({ data }: { data: DistBucket[] }) {
  const total = data.reduce((a, b) => a + b.count, 0);
  const sum = (t: string) => data.filter((d) => d.tone === t).reduce((a, b) => a + b.count, 0);
  const legend = [{ n: "High", t: "high", r: "60–100" }, { n: "Medium", t: "mid", r: "40–60" }, { n: "Low", t: "low", r: "0–40" }] as const;
  return (
    <div>
      <div className="h-[190px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }} barCategoryGap="18%">
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="range" tickLine={false} axisLine={false} tick={{ fill: "#8b929d", fontSize: 12 }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: "#8b929d", fontSize: 11 }} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
            <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} content={({ active, payload, label }) => <Tip active={active} label={`Risk ${label}`} rows={payload?.length ? [{ name: "Transactions", value: fmtInt(payload[0].value as number), color: TONE[(payload[0].payload as DistBucket).tone] }, { name: "Share", value: `${(((payload[0].value as number) / total) * 100).toFixed(1)}%`, color: "#5c6470" }] : []} />} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} animationDuration={900}>
              {data.map((d) => <Cell key={d.range} fill={TONE[d.tone]} fillOpacity={d.tone === "low" ? 0.75 : 1} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-3 grid grid-cols-3 gap-2 text-[12.5px]">
        {legend.map((l) => (
          <li key={l.n} className="rounded-lg bg-white/[0.03] px-3 py-2">
            <span className="flex items-center gap-1.5 text-mute"><span className="size-2 rounded-full" style={{ background: TONE[l.t] }} />{l.n} <span className="text-[11px]">({l.r})</span></span>
            <span className="tnum mt-0.5 block text-[15px] font-bold text-white">{((sum(l.t) / total) * 100).toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TrendChart({ data }: { data: Record<"7D" | "30D" | "90D", TrendPoint[]> }) {
  const [range, setRange] = useState<"7D" | "30D" | "90D">("7D");
  const pts = data[range];
  // Demo data is in the thousands per day; a small real (API) dataset needs a zero-based axis and plain ticks.
  const small = Math.max(...pts.map((p) => p.transactions), 0) < 1000;
  const maxRate = Math.max(...pts.map((p) => p.fraudRate), 0);
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <ul className="flex gap-4 text-[12.5px] text-mute">
          <li className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-red" />Transactions</li>
          <li className="flex items-center gap-1.5"><span className="h-0.5 w-3 bg-white" />Fraud rate</li>
        </ul>
        <div role="group" aria-label="Range" className="flex rounded-lg bg-white/[0.04] p-0.5">
          {(["7D", "30D", "90D"] as const).map((r) => (
            <button key={r} aria-pressed={range === r} onClick={() => setRange(r)} className={cn("rounded-md px-3 py-1 text-[12px] font-bold transition", range === r ? "bg-red text-white" : "text-mute hover:text-white")}>{r}</button>
          ))}
        </div>
      </div>
      <div className="h-[230px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart key={range} data={pts} margin={{ top: 8, right: 0, left: -16, bottom: 0 }}>
            <defs><linearGradient id="tx" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ff1f32" stopOpacity={0.42} /><stop offset="1" stopColor="#ff1f32" stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={28} tick={{ fill: "#8b929d", fontSize: 11 }} />
            <YAxis yAxisId="l" tickLine={false} axisLine={false} tick={{ fill: "#8b929d", fontSize: 11 }} tickFormatter={(v) => (small ? String(v) : `${Math.round(v / 1000)}k`)} domain={small ? [0, "auto"] : ["dataMin - 1500", "dataMax + 800"]} allowDecimals={false} />
            <YAxis yAxisId="r" orientation="right" hide domain={[0, maxRate > 2.4 ? "auto" : 2.4]} />
            <Tooltip cursor={{ stroke: "rgba(255,255,255,0.2)" }} content={({ active, payload, label }) => <Tip active={active} label={label as string} rows={payload?.length ? [{ name: "Transactions", value: fmtInt(payload[0].payload.transactions), color: "#ff1f32" }, { name: "Fraud rate", value: `${payload[0].payload.fraudRate}%`, color: "#fff" }] : []} />} />
            <Area yAxisId="l" type="monotone" dataKey="transactions" stroke="#ff1f32" strokeWidth={2} fill="url(#tx)" animationDuration={1000} />
            <Line yAxisId="r" type="monotone" dataKey="fraudRate" stroke="#fff" strokeWidth={1.6} dot={false} animationDuration={1200} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

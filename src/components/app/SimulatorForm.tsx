"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { DEVICE_OPTIONS, PRESETS, SIM_COUNTRIES } from "../../data/demo/simulator";
import type { Preset, SimulatorInput } from "../../types";
import { cn } from "../../lib/utils";

const field = "w-full rounded-lg border hairline-dark bg-night-950 px-3.5 py-2.5 text-[14px] text-white focus:border-red focus:outline-none";
const label = "mb-1.5 block text-[12.5px] font-semibold text-snow";

export function SimulatorForm({ presets, onAnalyze, analyzing }: { presets: Preset[]; onAnalyze: (i: SimulatorInput) => void; analyzing: boolean }) {
  const [active, setActive] = useState(presets[0].key);
  const [input, setInput] = useState<SimulatorInput>(presets[0].input);

  useEffect(() => { setInput(PRESETS.find((p) => p.key === active)?.input ?? input); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [active]);

  const set = <K extends keyof SimulatorInput>(k: K, v: SimulatorInput[K]) => { setInput((i) => ({ ...i, [k]: v })); setActive(""); };

  return (
    <div className="card-dark p-5 md:p-6">
      <p className="text-[12px] font-bold uppercase tracking-wider text-mute">Scenario presets</p>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {presets.map((p) => (
          <button key={p.key} onClick={() => setActive(p.key)} className={cn("rounded-xl border p-3 text-left transition", active === p.key ? "border-red bg-red/10" : "hairline-dark bg-white/[0.02] hover:bg-white/[0.04]")}>
            <p className="text-[13.5px] font-bold text-white">{p.label}</p>
            <p className="mt-1 text-[11.5px] leading-snug text-mute">{p.blurb}</p>
          </button>
        ))}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); onAnalyze(input); }} className="mt-6 grid grid-cols-2 gap-4">
        <div><label className={label} htmlFor="sim-user">User</label><input id="sim-user" className={field} value={input.user} onChange={(e) => set("user", e.target.value)} /></div>
        <div><label className={label} htmlFor="sim-amount">Amount (₸)</label><input id="sim-amount" type="number" min={0} className={cn(field, "tnum")} value={input.amount} onChange={(e) => set("amount", Number(e.target.value))} /></div>
        <div><label className={label} htmlFor="sim-country">Country</label><select id="sim-country" className={field} value={input.country} onChange={(e) => set("country", e.target.value)}>{SIM_COUNTRIES.map((c) => <option key={c}>{c}</option>)}</select></div>
        <div><label className={label} htmlFor="sim-merchant">Merchant</label><input id="sim-merchant" className={field} value={input.merchant} onChange={(e) => set("merchant", e.target.value)} /></div>
        <div><label className={label} htmlFor="sim-device">Device</label><select id="sim-device" className={field} value={input.device} onChange={(e) => set("device", e.target.value)}>{DEVICE_OPTIONS.map((d) => <option key={d}>{d}</option>)}</select></div>
        <div className="flex items-end pb-2.5"><label className="inline-flex items-center gap-2.5 text-[13.5px] font-medium text-snow"><input type="checkbox" checked={input.vpn} onChange={(e) => set("vpn", e.target.checked)} className="size-4 rounded accent-red" /> Behind a VPN</label></div>
        <button type="submit" disabled={analyzing} className="col-span-2 mt-1 inline-flex items-center justify-center gap-2 rounded-lg bg-red py-3.5 text-[15px] font-bold text-white transition hover:bg-red-600 disabled:opacity-70">
          <AnimatePresence mode="wait" initial={false}>
            {analyzing ? <motion.span key="a" className="inline-flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Loader2 size={16} className="animate-spin" /> Analyzing…</motion.span> : <motion.span key="b" className="inline-flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Analyze Transaction <ArrowRight size={16} /></motion.span>}
          </AnimatePresence>
        </button>
      </form>
    </div>
  );
}

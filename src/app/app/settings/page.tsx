"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, FlaskConical, Plus, RotateCcw, UserRound } from "lucide-react";
import { PageHeader } from "../../../components/app/PageHeader";
import { IS_DEMO } from "../../../lib/config";
import { cn } from "../../../lib/utils";
import { initials, useWorkspace } from "../../../lib/workspace";

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 border-b hairline-dark py-4 last:border-0">
      <div><p className="text-[14px] font-semibold text-white">{label}</p>{hint && <p className="mt-0.5 text-[12.5px] text-mute">{hint}</p>}</div>
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", checked ? "bg-red" : "bg-white/15")}>
        <span className={cn("absolute top-0.5 size-5 rounded-full bg-white transition-transform", checked ? "translate-x-[22px]" : "translate-x-0.5")} />
      </button>
    </label>
  );
}

export default function SettingsPage() {
  const [compact, setCompact] = useState(false);
  const [motion, setMotion] = useState(true);
  const [notifHigh, setNotifHigh] = useState(true);
  const [notifDigest, setNotifDigest] = useState(false);
  const ws = useWorkspace();
  const router = useRouter();
  const demo = ws.mode === "demo";
  const btn = "inline-flex items-center gap-1.5 rounded-lg border hairline-dark px-3.5 py-2 text-[13px] font-bold text-white transition hover:bg-white/5";

  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" subtitle="Workspace, data source, display and notification preferences." />
      <section className="card-dark p-5 md:p-6">
        <h2 className="text-[13px] font-bold uppercase tracking-wider text-mute">Workspace</h2>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white/[0.03] px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className={cn("grid size-9 shrink-0 place-items-center rounded-full", demo ? "bg-warn/12 text-warn-dark" : "bg-gradient-to-br from-red to-red-800 text-[12.5px] font-extrabold text-white")}>{demo ? <FlaskConical size={16} /> : initials(ws.user)}</span>
            <div className="min-w-0">
              <p className="text-[12px] text-mute">Current workspace</p>
              <p className="truncate text-[14px] font-bold text-white">{demo ? "Demo Workspace" : "Fresh Workspace"}</p>
            </div>
          </div>
          <p className="flex items-center gap-1.5 text-[12.5px] text-mute"><UserRound size={13} /> {ws.user.name} · {ws.user.role}</p>
        </div>
        <p className="mt-2.5 text-[12.5px] text-mute">{demo ? "Pre-populated with simulated transactions, investigations and analytics." : `${ws.analyses.length} analyzed transaction${ws.analyses.length === 1 ? "" : "s"}, stored in this browser only.`}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {!demo && <button onClick={() => { ws.enterDemo(); router.push("/app/dashboard"); }} className={btn}><FlaskConical size={14} /> Switch to Demo</button>}
          {demo && ws.freshUser && <button onClick={() => { ws.resumeFresh(); router.push("/app/dashboard"); }} className={btn}><UserRound size={14} /> Back to {ws.freshUser.name.split(" ")[0]}&apos;s workspace</button>}
          <button onClick={() => router.push("/welcome/create")} className={btn}><Plus size={14} className="text-red" /> Start Fresh</button>
          <button onClick={() => { ws.resetDemo(); router.push("/app/dashboard"); }} className={btn}><RotateCcw size={14} /> Reset Demo</button>
        </div>
      </section>

      <section className="card-dark mt-5 p-5 md:p-6">
        <h2 className="text-[13px] font-bold uppercase tracking-wider text-mute">Data source</h2>
        <div className="mt-3 flex items-center gap-3 rounded-lg bg-white/[0.03] px-4 py-3">
          <span className="grid size-8 place-items-center rounded-full bg-ok-dark/15 text-ok-dark"><Check size={15} /></span>
          <div><p className="text-[13.5px] font-semibold text-white">{IS_DEMO ? "Demo dataset" : "Live API"}</p><p className="text-[12px] text-mute">Set with NEXT_PUBLIC_DATA_MODE. All figures shown are simulated until a backend is connected.</p></div>
        </div>
      </section>

      <section className="card-dark mt-5 p-5 md:p-6">
        <h2 className="text-[13px] font-bold uppercase tracking-wider text-mute">Display</h2>
        <div className="mt-1">
          <Toggle checked={compact} onChange={setCompact} label="Compact tables" hint="Show more rows per screen in Transactions." />
          <Toggle checked={motion} onChange={setMotion} label="Interface motion" hint="Investigation and chart animations. Your system's reduced-motion setting is always respected." />
        </div>
      </section>

      <section className="card-dark mt-5 p-5 md:p-6">
        <h2 className="text-[13px] font-bold uppercase tracking-wider text-mute">Notifications</h2>
        <div className="mt-1">
          <Toggle checked={notifHigh} onChange={setNotifHigh} label="High-risk alerts" hint="Notify when a transaction risk exceeds 80%." />
          <Toggle checked={notifDigest} onChange={setNotifDigest} label="Daily digest" hint="A morning summary of fraud activity." />
        </div>
      </section>

      <section className="card-dark mt-5 p-5 md:p-6">
        <h2 className="text-[13px] font-bold uppercase tracking-wider text-mute">Future integrations</h2>
        <p className="mt-2 text-[13.5px] leading-relaxed text-mute">ALIBI's frontend is backend-ready. Connecting a live API only requires setting <code className="rounded bg-white/10 px-1.5 py-0.5 text-[12px] text-snow">NEXT_PUBLIC_DATA_MODE=api</code> and <code className="rounded bg-white/10 px-1.5 py-0.5 text-[12px] text-snow">NEXT_PUBLIC_API_URL</code> — no component changes needed.</p>
      </section>
    </div>
  );
}

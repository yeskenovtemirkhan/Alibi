"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Activity, ArrowRight, Check, CircleCheck, ScanSearch, ShieldX } from "lucide-react";
import { TransactionTable } from "./TransactionTable";
import { NetworkBackdrop } from "../ui/NetworkBackdrop";
import { EASE, staggerChild, staggerParent } from "../motion/primitives";
import { firstName, greeting, useWorkspace } from "../../lib/workspace";
import { cn } from "../../lib/utils";

const STEPS = [
  { t: "Analyze a transaction", d: "Build one in the Simulator or pick a preset." },
  { t: "Review ALIBI's investigation", d: "Watch risk move as context is found." },
  { t: "Understand the evidence", d: "Every source, its trust level and its impact." },
  { t: "Reach an explainable decision", d: "Approve, verify or block — with a reason." },
];

function FreshMetric({ label, value, icon: I, started }: { label: string; value: number; icon: typeof Activity; started: boolean }) {
  return (
    <div className="card-dark p-4 md:p-5">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-mute">{label}</p>
        <span className="grid size-8 place-items-center rounded-lg bg-white/[0.05] text-mute"><I size={16} /></span>
      </div>
      <p className={cn("tnum mt-3 text-[34px] font-extrabold leading-none tracking-tight md:text-[38px]", value ? "text-white" : "text-white/35")}>{value}</p>
      <p className="mt-3 text-[12.5px] font-medium text-mute">{value ? "In this workspace" : started ? "None yet" : "No data yet"}</p>
    </div>
  );
}

export function FreshDashboard() {
  const reduced = useReducedMotion();
  const router = useRouter();
  const { user, analyses, enterDemo } = useWorkspace();
  const rows = analyses.map((a) => a.row);
  const count = (s: string) => rows.filter((r) => r.status === s).length;
  const started = rows.length > 0;
  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="space-y-4 md:space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-tight text-white md:text-[30px]">{greeting()}, {firstName(user)}</h1>
          <p className="mt-1 text-[14.5px] text-mute">{user.organization ? `${user.organization} · ` : ""}Your ALIBI workspace</p>
        </div>
        <span className="rounded-lg border hairline-dark px-3 py-1.5 text-[12.5px] font-semibold text-snow">{today}</span>
      </header>

      <motion.section
        initial={reduced ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE }}
        className="relative overflow-hidden rounded-[14px] border border-red/30 bg-gradient-to-r from-[#3a0a10] via-[#1b0609] to-night-900 p-6 md:p-9"
      >
        <NetworkBackdrop className="pointer-events-none absolute inset-y-0 right-0 h-full w-[60%] opacity-60" />
        <div className="relative max-w-xl">
          <p className="text-[12px] font-bold tracking-widest text-red">{started ? "KEEP GOING" : "WELCOME"}</p>
          <h2 className="mt-2 text-[clamp(1.6rem,3.2vw,2.4rem)] font-extrabold leading-tight tracking-tight text-white">{started ? "Your first investigation is in." : "Your workspace is ready."}</h2>
          <p className="mt-2 text-[15px] text-snow/75">{started ? "Analyze another transaction, or open an investigation to review the evidence." : "Analyze your first transaction to see how ALIBI investigates risk and context."}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/app/simulator" className="inline-flex items-center gap-2 rounded-lg bg-red px-5 py-3 text-[14px] font-bold text-white shadow-[0_14px_28px_-12px_rgba(255,31,50,0.85)] transition hover:bg-red-600">
              {started ? "Analyze another transaction" : "Analyze first transaction"} <ArrowRight size={16} />
            </Link>
            <button onClick={() => { enterDemo(); router.push("/app/dashboard"); }} className="rounded-lg border border-white/20 px-5 py-3 text-[14px] font-bold text-white transition hover:bg-white/5">Explore Demo Instead</button>
          </div>
        </div>
      </motion.section>

      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <FreshMetric label="Transactions" value={rows.length} icon={Activity} started={started} />
        <FreshMetric label="Investigations" value={rows.length} icon={ScanSearch} started={started} />
        <FreshMetric label="Blocked" value={count("Blocked")} icon={ShieldX} started={started} />
        <FreshMetric label="Approved" value={count("Approved")} icon={CircleCheck} started={started} />
      </div>

      <section className="card-dark p-5 md:p-6">
        <h2 className="text-[15px] font-bold text-white">Getting started</h2>
        <motion.ol variants={staggerParent(0.07, 0.1)} initial={reduced ? "show" : "hidden"} animate="show" className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {STEPS.map((s, i) => {
            const done = started;
            const current = !started && i === 0;
            return (
              <motion.li key={s.t} variants={staggerChild} className={cn("rounded-xl border p-4", current ? "border-red/40 bg-red/[0.07]" : "hairline-dark bg-white/[0.02]")}>
                <span className={cn("tnum grid size-8 place-items-center rounded-full text-[12.5px] font-extrabold", done ? "bg-ok-dark/15 text-ok-dark" : current ? "bg-red text-white" : "bg-white/[0.07] text-snow")}>
                  {done ? <Check size={15} strokeWidth={3} /> : String(i + 1).padStart(2, "0")}
                </span>
                <p className="mt-3 text-[14px] font-bold text-white">{s.t}</p>
                <p className="mt-1 text-[12.5px] leading-snug text-mute">{s.d}</p>
              </motion.li>
            );
          })}
        </motion.ol>
      </section>

      {started && (
        <section className="card-dark p-4 md:p-5">
          <div className="mb-3.5 flex items-center justify-between gap-3"><h2 className="text-[15px] font-bold text-white">Your recent analyses</h2><Link href="/app/transactions" className="text-[12.5px] font-bold text-red hover:underline">View all</Link></div>
          <TransactionTable rows={rows.slice(0, 7)} animate />
        </section>
      )}
    </div>
  );
}

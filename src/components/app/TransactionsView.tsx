"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeftRight, ArrowRight, Search } from "lucide-react";
import { useWorkspace } from "../../lib/workspace";
import { PageHeader } from "./PageHeader";
import { TransactionTable } from "./TransactionTable";
import { Pagination } from "./Pagination";
import { EmptyState } from "../ui/States";
import type { Transaction, TxStatus } from "../../types";

const STATUSES: (TxStatus | "All")[] = ["All", "Blocked", "Investigating", "Verified", "Approved"];
const RISKS = ["All", "High (70–100)", "Medium (30–70)", "Low (0–30)"] as const;
const PAGE_SIZE = 12;

export function TransactionsView({ rows: demoRows, countries: demoCountries }: { rows: Transaction[]; countries: string[] }) {
  const { mode, analyses } = useWorkspace();
  const fresh = mode === "fresh";
  const rows = useMemo(() => (fresh ? analyses.map((a) => a.row) : demoRows), [fresh, analyses, demoRows]);
  const countries = useMemo(() => (fresh ? [...new Set(rows.map((r) => r.country))] : demoCountries), [fresh, rows, demoCountries]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("All");
  const [risk, setRisk] = useState<(typeof RISKS)[number]>("All");
  const [country, setCountry] = useState("All");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return rows.filter((t) => {
      if (status !== "All" && t.status !== status) return false;
      if (country !== "All" && t.country !== country) return false;
      if (risk !== "All" && t.risk === null) return false; // unscored rows only show under "All"
      const r = t.risk ?? 0;
      if (risk === "High (70–100)" && r < 70) return false;
      if (risk === "Medium (30–70)" && (r < 30 || r >= 70)) return false;
      if (risk === "Low (0–30)" && r >= 30) return false;
      if (q) { const s = q.toLowerCase(); if (!(t.id.toLowerCase().includes(s) || t.user.toLowerCase().includes(s) || t.merchant.toLowerCase().includes(s))) return false; }
      return true;
    });
  }, [rows, status, risk, country, q]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const shown = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const setAnd = <T,>(setter: (v: T) => void) => (v: T) => { setter(v); setPage(1); };
  const selectCls = "rounded-lg border hairline-dark bg-night-900 px-3 py-2 text-[13.5px] font-medium text-white focus:border-red focus:outline-none";

  if (fresh && rows.length === 0) {
    return (
      <div>
        <PageHeader title="Transactions" subtitle="Browse and investigate transaction activity." />
        <EmptyState
          className="card-dark border-solid py-20"
          icon={<ArrowLeftRight size={20} />}
          title="No transactions yet."
          hint="Transactions analyzed by ALIBI will appear here."
          action={<Link href="/app/simulator" className="inline-flex items-center gap-2 rounded-lg bg-red px-5 py-3 text-[14px] font-bold text-white transition hover:bg-red-600">Analyze a Transaction <ArrowRight size={16} /></Link>}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Transactions" subtitle={fresh ? "Transactions analyzed in your workspace." : "Browse and investigate transaction activity."} right={fresh ? <Link href="/app/simulator" className="inline-flex items-center gap-1.5 rounded-lg bg-red px-3.5 py-2 text-[13px] font-bold text-white transition hover:bg-red-600">Analyze a Transaction <ArrowRight size={14} /></Link> : undefined} />
      <div className="card-dark mb-4 flex flex-wrap items-center gap-2.5 p-3.5">
        <div className="relative min-w-[200px] flex-1">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
          <input value={q} onChange={(e) => setAnd(setQ)(e.target.value)} placeholder="Search ID, user or merchant" aria-label="Search transactions" className="w-full rounded-lg border hairline-dark bg-night-900 py-2 pl-8 pr-3 text-[13.5px] text-white placeholder:text-mute focus:border-red focus:outline-none" />
        </div>
        <select aria-label="Status" value={status} onChange={(e) => setAnd(setStatus)(e.target.value as TxStatus | "All")} className={selectCls}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
        <select aria-label="Risk" value={risk} onChange={(e) => setAnd(setRisk)(e.target.value as (typeof RISKS)[number])} className={selectCls}>{RISKS.map((s) => <option key={s}>{s}</option>)}</select>
        <select aria-label="Country" value={country} onChange={(e) => setAnd(setCountry)(e.target.value)} className={selectCls}><option>All</option>{countries.map((c) => <option key={c}>{c}</option>)}</select>
      </div>
      <div className="card-dark p-4 md:p-5">
        {shown.length === 0 ? <EmptyState title="No transactions match your filters." hint="Try clearing a filter or searching a different term." /> : <TransactionTable rows={shown} showDevice />}
        <Pagination page={page} pageCount={pageCount} onChange={setPage} />
      </div>
    </div>
  );
}

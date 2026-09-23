"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { RiskBadge, StatusBadge } from "../ui/Risk";
import { cn, fmtKZT } from "../../lib/utils";
import type { Transaction } from "../../types";

export function TransactionTable({ rows, showDevice = false, animate = false, highlightId }: { rows: Transaction[]; showDevice?: boolean; animate?: boolean; highlightId?: string }) {
  const router = useRouter();
  const hl = useRef<HTMLTableRowElement>(null);
  useEffect(() => {
    if (!highlightId) return;
    const t = setTimeout(() => hl.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 500);
    return () => clearTimeout(t);
  }, [highlightId]);
  const open = (id: string) => router.push(`/app/investigation/${id}`);
  const th = "whitespace-nowrap px-3 py-3 text-left text-[12px] font-semibold text-mute";
  return (
    <div className="overflow-x-auto scroll-thin">
      <table className="w-full min-w-[820px] border-collapse text-[13.5px]">
        <caption className="sr-only">Transactions</caption>
        <thead>
          <tr className="border-b hairline-dark">
            <th className={th}>ID</th><th className={th}>Time</th><th className={th}>User</th><th className={th}>Amount</th><th className={th}>Country</th><th className={th}>Merchant</th>
            {showDevice && <th className={th}>Device</th>}
            <th className={th}>Risk</th>{!showDevice && <th className={th}>Status</th>}<th className={`${th} text-right`}>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t, i) => (
            <tr
              key={t.id}
              ref={t.id === highlightId ? hl : undefined}
              tabIndex={0}
              onClick={() => open(t.id)}
              onKeyDown={(e) => { if (e.key === "Enter") open(t.id); }}
              style={animate ? { animation: `rowin .32s ${Math.min(i, 12) * 40}ms both` } : undefined}
              className={cn("group cursor-pointer border-b border-white/[0.04] transition-colors hover:bg-white/[0.035] focus-visible:bg-white/[0.05]", t.id === highlightId && "bg-red/[0.09] outline outline-1 -outline-offset-1 outline-red/50")}
            >
              <td className="whitespace-nowrap px-3 py-3 font-bold text-white"><Link href={`/app/investigation/${t.id}`} onClick={(e) => e.stopPropagation()} className="hover:text-red">{t.id}</Link>{t.id === highlightId && <span className="ml-2 rounded bg-red px-1.5 py-0.5 text-[10.5px] font-bold text-white">Start here</span>}</td>
              <td className="tnum whitespace-nowrap px-3 py-3 text-mute">{t.time}</td>
              <td className="tnum px-3 py-3 text-mute">{t.user}</td>
              <td className="tnum whitespace-nowrap px-3 py-3 font-semibold text-white">{fmtKZT(t.amount)}</td>
              <td className="px-3 py-3 text-snow">{t.country}</td>
              <td className="whitespace-nowrap px-3 py-3 text-snow">{t.merchant}</td>
              {showDevice && <td className="whitespace-nowrap px-3 py-3 text-mute">{t.device}</td>}
              <td className="px-3 py-3"><RiskBadge value={t.risk} /></td>
              {!showDevice && <td className="px-3 py-3"><StatusBadge status={t.status} /></td>}
              <td className="px-3 py-3 text-right">
                <span className="inline-flex items-center gap-1 text-[12.5px] font-bold text-mute transition-colors group-hover:text-red">Investigate <ArrowRight size={13} className="-translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" /></span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <style>{`@keyframes rowin{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}

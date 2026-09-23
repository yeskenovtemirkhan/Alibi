"use client";
import Link from "next/link";
import { ArrowRight, ScanSearch } from "lucide-react";
import { InvestigationView } from "./InvestigationView";
import { EmptyState } from "../ui/States";
import { useWorkspace } from "../../lib/workspace";

/** Investigations created in a Fresh workspace live in the browser, so they're resolved client-side. */
export function LocalInvestigation({ id }: { id: string }) {
  const { analyses } = useWorkspace();
  const found = analyses.find((a) => a.row.id === id);
  if (found) return <InvestigationView scenario={found.scenario} />;
  return (
    <div className="pt-10">
      <EmptyState
        icon={<ScanSearch size={20} />}
        title="No investigation selected."
        hint="This investigation isn't in this browser's workspace. Analyze a transaction to start a new one."
        action={<Link href="/app/simulator" className="inline-flex items-center gap-2 rounded-lg bg-red px-5 py-3 text-[14px] font-bold text-white transition hover:bg-red-600">Analyze Transaction <ArrowRight size={16} /></Link>}
      />
    </div>
  );
}

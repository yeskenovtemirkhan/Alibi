"use client";
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ScanSearch } from "lucide-react";
import { PageHeader } from "../../../components/app/PageHeader";
import { EmptyState } from "../../../components/ui/States";
import { LEGIT_ID } from "../../../data/demo/scenarios";
import { useWorkspace } from "../../../lib/workspace";

export default function InvestigationIndex() {
  const router = useRouter();
  const { mode, analyses } = useWorkspace();
  const target = mode === "demo" ? LEGIT_ID : analyses[0]?.row.id;
  useEffect(() => { if (target) router.replace(`/app/investigation/${target}`); }, [target, router]);
  if (target) return null;
  return (
    <div>
      <PageHeader title="ALIBI Investigation" />
      <EmptyState
        className="card-dark border-solid py-20"
        icon={<ScanSearch size={20} />}
        title="No investigation selected."
        hint="Analyze a transaction to see how ALIBI investigates context, evidence and risk."
        action={<Link href="/app/simulator" className="inline-flex items-center gap-2 rounded-lg bg-red px-5 py-3 text-[14px] font-bold text-white transition hover:bg-red-600">Analyze Transaction <ArrowRight size={16} /></Link>}
      />
    </div>
  );
}

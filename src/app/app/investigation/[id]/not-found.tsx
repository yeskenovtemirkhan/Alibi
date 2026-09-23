import Link from "next/link";
import { EmptyState } from "../../../../components/ui/States";

export default function NotFound() {
  return (
    <div className="pt-10">
      <EmptyState
        title="No investigation selected."
        hint="Analyze a transaction to see how ALIBI investigates context, evidence and risk."
        action={<Link href="/app/simulator" className="rounded-lg bg-red px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-600">Analyze Transaction →</Link>}
      />
    </div>
  );
}

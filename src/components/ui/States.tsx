import type { ReactNode } from "react";
import { SearchX } from "lucide-react";
import { cn } from "../../lib/utils";

export function EmptyState({ title, hint, action, icon, className }: { title: string; hint?: string; action?: ReactNode; icon?: ReactNode; className?: string }) {
  return (
    <div className={cn("grid place-items-center rounded-[14px] border border-dashed border-white/10 px-6 py-14 text-center", className)}>
      <div>
        <div className="mx-auto mb-3 grid size-11 place-items-center rounded-full bg-white/5 text-mute">{icon ?? <SearchX size={20} />}</div>
        <p className="text-[15px] font-semibold text-white">{title}</p>
        {hint && <p className="mx-auto mt-1 max-w-sm text-sm text-mute">{hint}</p>}
        {action && <div className="mt-4">{action}</div>}
      </div>
    </div>
  );
}

/** Loading copy speaks ALIBI, not "please wait". */
export function LoadingState({ label = "Loading transaction history…" }: { label?: string }) {
  return (
    <div className="grid min-h-[40vh] place-items-center text-center" role="status" aria-live="polite">
      <div>
        <div className="mx-auto mb-4 h-1 w-40 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/3 rounded-full bg-red [animation:load_1.1s_ease-in-out_infinite]" />
        </div>
        <p className="text-sm text-mute">{label}</p>
      </div>
      <style>{`@keyframes load{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}`}</style>
    </div>
  );
}

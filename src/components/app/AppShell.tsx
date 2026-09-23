"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeftRight, BarChart3, FlaskConical, LayoutDashboard, Menu, ScanSearch, Settings, X } from "lucide-react";
import { DemoIndicator } from "./DemoIndicator";
import { GuidedDemo } from "./GuidedDemo";
import { DEMO_USER, initials, useWorkspace, type LocalUser } from "../../lib/workspace";
import { Logo } from "../ui/Logo";
import { LEGIT_ID } from "../../data/demo/scenarios";
import { cn } from "../../lib/utils";

const nav = (investigationHref: string) => [
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard, match: "/app/dashboard" },
  { href: "/app/transactions", label: "Transactions", icon: ArrowLeftRight, match: "/app/transactions" },
  { href: investigationHref, label: "Investigation", icon: ScanSearch, match: "/app/investigation" },
  { href: "/app/simulator", label: "Simulator", icon: FlaskConical, match: "/app/simulator" },
  { href: "/app/analytics", label: "Analytics", icon: BarChart3, match: "/app/analytics" },
];

function NavItem({ href, label, icon: I, active, onNavigate }: { href: string; label: string; icon: typeof Settings; active: boolean; onNavigate?: () => void }) {
  return (
    <Link href={href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={cn("group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-semibold transition-colors", active ? "bg-red/12 text-white" : "text-mute hover:bg-white/5 hover:text-white")}>
      {active && <motion.span layoutId="nav-bar" className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-red" />}
      <I size={18} className={active ? "text-red" : "text-mute group-hover:text-white"} />
      {label}
    </Link>
  );
}

function UserCard({ user }: { user: LocalUser }) {
  return (
    <div className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-red to-red-800 text-[13px] font-extrabold text-white">{initials(user)}</span>
      <div className="min-w-0"><p className="truncate text-[13.5px] font-bold text-white">{user.name}</p><p className="truncate text-[12px] text-mute">{user.role}</p></div>
    </div>
  );
}

/** `preview` renders the static demo sidebar used inside the landing page's product preview. */
export function SidebarBody({ pathname, onNavigate, preview = false }: { pathname: string; onNavigate?: () => void; preview?: boolean }) {
  const ws = useWorkspace();
  const demo = preview || ws.mode === "demo";
  const latest = ws.analyses[0]?.row.id;
  const NAV = nav(demo ? `/app/investigation/${LEGIT_ID}` : latest ? `/app/investigation/${latest}` : "/app/investigation");
  const user = preview ? DEMO_USER : ws.user;
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-6 pt-6"><Link href="/" aria-label="ALIBI landing"><Logo dark /></Link></div>
      <nav aria-label="Application" className="flex-1 space-y-1 px-3">
        {NAV.map((n) => <NavItem key={n.href} href={n.href} label={n.label} icon={n.icon} active={pathname.startsWith(n.match)} onNavigate={onNavigate} />)}
      </nav>
      <div className="space-y-1 border-t hairline-dark px-3 py-4">
        {!preview && ws.ready && ws.mode === "demo" && <div className="px-1 pb-2"><DemoIndicator /></div>}
        <NavItem href="/app/settings" label="Settings" icon={Settings} active={pathname.startsWith("/app/settings")} onNavigate={onNavigate} />
        {(preview || ws.ready) ? <UserCard user={user} /> : <div className="mt-2 h-14" />}
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { ready, mode } = useWorkspace();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  return (
    <div className="app-surface min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[232px] border-r hairline-dark bg-night-950 lg:block"><SidebarBody pathname={pathname} /></aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b hairline-dark bg-night-950/90 px-4 backdrop-blur lg:hidden">
        <Link href="/" aria-label="ALIBI landing"><Logo dark /></Link>
        <div className="flex items-center gap-2">
          {ready && mode === "demo" && <DemoIndicator compact />}
          <button aria-label="Open navigation" aria-expanded={open} onClick={() => setOpen(true)} className="grid size-10 place-items-center rounded-lg border hairline-dark text-white"><Menu size={19} /></button>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
            <motion.div className="absolute inset-0 bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.div className="absolute inset-y-0 left-0 w-[264px] border-r hairline-dark bg-night-950" initial={{ x: -264 }} animate={{ x: 0 }} exit={{ x: -264 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}>
              <button aria-label="Close navigation" onClick={() => setOpen(false)} className="absolute right-3 top-4 grid size-9 place-items-center rounded-lg text-mute hover:text-white"><X size={18} /></button>
              <SidebarBody pathname={pathname} onNavigate={() => setOpen(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Workspace mode lives in localStorage, so content waits one frame for it instead of flashing the wrong workspace. */}
      <main className="lg:pl-[232px]"><div className="mx-auto max-w-[1420px] px-4 py-6 md:px-7 md:py-8">{ready ? children : <div className="min-h-[60vh]" aria-busy="true" />}</div></main>
      {ready && <GuidedDemo />}
    </div>
  );
}

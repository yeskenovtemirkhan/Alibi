"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LogoMark } from "../ui/Logo";

interface Ctx { go: (href: string) => void }
const TransitionCtx = createContext<Ctx>({ go: () => {} });

/** Landing → product: a short bright-to-dark wipe (≈300ms). App ↔ app navigation is untouched. */
export function TransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const [cover, setCover] = useState(false);
  const pending = useRef<string | null>(null);

  const go = useCallback((href: string) => {
    const enteringApp = href.startsWith("/app") && !window.location.pathname.startsWith("/app");
    if (!enteringApp || reduced) { router.push(href); return; }
    pending.current = href;
    setCover(true);
    setTimeout(() => router.push(href), 300);
  }, [router, reduced]);

  useEffect(() => {
    if (cover && pending.current && pathname === pending.current.split("#")[0]) {
      const t = setTimeout(() => { setCover(false); pending.current = null; }, 120);
      return () => clearTimeout(t);
    }
  }, [pathname, cover]);

  return (
    <TransitionCtx.Provider value={{ go }}>
      {children}
      <AnimatePresence>
        {cover && (
          <motion.div
            key="cover"
            aria-hidden
            className="fixed inset-0 z-[100] grid place-items-center bg-night-950"
            initial={{ clipPath: "circle(0% at 85% 6%)" }}
            animate={{ clipPath: "circle(150% at 85% 6%)" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.12, duration: 0.2 }}>
              <LogoMark size={44} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </TransitionCtx.Provider>
  );
}

export function TransitionLink({ href, children, className, onClick, ...rest }: { href: string; children: ReactNode; className?: string; onClick?: () => void } & Omit<React.ComponentProps<typeof Link>, "href">) {
  const { go } = useContext(TransitionCtx);
  return (
    <Link
      href={href}
      className={className}
      {...rest}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        if (href.startsWith("/app")) { e.preventDefault(); onClick?.(); go(href); } else onClick?.();
      }}
    >
      {children}
    </Link>
  );
}

/** Programmatic navigation that uses the same Landing → product wipe as TransitionLink. */
export const useTransitionNav = () => useContext(TransitionCtx).go;

"use client";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2, Lock } from "lucide-react";
import { Logo } from "../../../components/ui/Logo";
import { EASE } from "../../../components/motion/primitives";
import { useTransitionNav } from "../../../components/motion/transition";
import { ROLES, useWorkspace } from "../../../lib/workspace";
import { cn } from "../../../lib/utils";

const schema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(60, "Keep it under 60 characters."),
  email: z.string().trim().refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter a valid email, like name@company.com."),
  organization: z.string().trim().max(80, "Keep it under 80 characters."),
  role: z.string().min(1, "Choose your role."),
});
type Values = z.infer<typeof schema>;

const field = "mt-1.5 w-full rounded-lg border border-hair bg-white px-3.5 py-3 text-[15px] text-ink placeholder:text-ink-3/60 transition focus:border-red focus:outline-none focus:ring-4 focus:ring-red/10";
const labelCls = "block text-[13px] font-semibold text-ink";
const errCls = "mt-1.5 text-[13px] font-medium text-red-700";

const STEPS = ["Analyze a transaction", "Review ALIBI's investigation", "Understand the evidence", "Reach an explainable decision"];

export default function CreateWorkspacePage() {
  const reduced = useReducedMotion();
  const { startFresh } = useWorkspace();
  const go = useTransitionNav();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", organization: "", role: "" },
  });

  const onSubmit = async (v: Values) => {
    startFresh({ name: v.name, email: v.email || undefined, organization: v.organization || undefined, role: v.role });
    await new Promise((r) => setTimeout(r, 250));
    go("/app/dashboard");
  };

  return (
    <div className="landing-wash min-h-screen">
      <header className="mx-auto flex h-[72px] max-w-[1160px] items-center justify-between px-5 md:px-8">
        <Link href="/" aria-label="ALIBI home"><Logo /></Link>
        <Link href="/welcome" className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[13.5px] font-semibold text-ink-2 transition hover:bg-black/[0.04] hover:text-ink"><ArrowLeft size={15} /> Back</Link>
      </header>

      <main className="mx-auto grid max-w-[1060px] gap-8 px-5 pb-16 pt-4 md:px-8 md:pt-8 lg:grid-cols-[1fr_1.05fr] lg:items-start lg:gap-12">
        <motion.div initial={reduced ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
          <p className="text-[13px] font-bold tracking-widest text-red">START FRESH</p>
          <h1 className="mt-3 text-[clamp(2rem,4.6vw,3rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-ink">Create your workspace.</h1>
          <p className="mt-3 max-w-md text-[16px] leading-relaxed text-ink-2">Four quick fields, then you&apos;ll analyze your first transaction and watch ALIBI investigate it.</p>
          <ol className="mt-7 hidden space-y-2.5 rounded-2xl border border-white/10 bg-night-950 p-5 text-white shadow-[0_30px_60px_-30px_rgba(0,0,0,0.5)] sm:block">
            {STEPS.map((s, i) => (
              <li key={s} className="flex items-center gap-3 text-[14px] font-semibold">
                <span className={cn("tnum grid size-7 shrink-0 place-items-center rounded-full text-[12px] font-bold", i === 0 ? "bg-red text-white" : "bg-white/10 text-snow")}>{String(i + 1).padStart(2, "0")}</span>
                <span className={i === 0 ? "text-white" : "text-snow/70"}>{s}</span>
              </li>
            ))}
          </ol>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          initial={reduced ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08, ease: EASE }}
          className="card-light space-y-4 p-5 md:p-7"
        >
          <div>
            <label htmlFor="ws-name" className={labelCls}>Name</label>
            <input id="ws-name" autoComplete="name" placeholder="Rauan Sadykov" aria-invalid={!!errors.name} aria-describedby={errors.name ? "ws-name-err" : undefined} {...register("name")} className={field} autoFocus />
            {errors.name && <p id="ws-name-err" role="alert" className={errCls}>{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="ws-email" className={labelCls}>Work email <span className="font-medium text-ink-3">(optional)</span></label>
            <input id="ws-email" type="email" autoComplete="email" placeholder="name@company.com" aria-invalid={!!errors.email} aria-describedby={errors.email ? "ws-email-err" : undefined} {...register("email")} className={field} />
            {errors.email && <p id="ws-email-err" role="alert" className={errCls}>{errors.email.message}</p>}
          </div>
          <div>
            <label htmlFor="ws-org" className={labelCls}>Organization <span className="font-medium text-ink-3">(optional)</span></label>
            <input id="ws-org" autoComplete="organization" placeholder="Bank or company" {...register("organization")} className={field} />
            {errors.organization && <p role="alert" className={errCls}>{errors.organization.message}</p>}
          </div>
          <div>
            <label htmlFor="ws-role" className={labelCls}>Role</label>
            <select id="ws-role" aria-invalid={!!errors.role} aria-describedby={errors.role ? "ws-role-err" : undefined} {...register("role")} className={cn(field, "appearance-auto")}>
              <option value="" disabled>Select your role</option>
              {ROLES.map((r) => <option key={r}>{r}</option>)}
            </select>
            {errors.role && <p id="ws-role-err" role="alert" className={errCls}>{errors.role.message}</p>}
          </div>
          <button type="submit" disabled={isSubmitting} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red px-6 py-3.5 text-[15px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(255,31,50,0.85)] transition hover:bg-red-600 disabled:opacity-70">
            {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Creating workspace…</> : <>Create Workspace <ArrowRight size={17} /></>}
          </button>
          <p className="flex items-center justify-center gap-1.5 text-center text-[12px] text-ink-3"><Lock size={12} /> No password. Your profile stays in this browser.</p>
        </motion.form>
      </main>
    </div>
  );
}

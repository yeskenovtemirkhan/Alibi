"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { waitlistService } from "../../services/waitlist.service";

const schema = z.object({ email: z.string().min(1, "Enter your work email.").email("Enter a valid email, like name@company.com.") });
type Values = z.infer<typeof schema>;

export function WaitlistForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema) });
  const [done, setDone] = useState<{ email: string; persisted: boolean } | null>(null);
  const [failed, setFailed] = useState(false);

  const onSubmit = async ({ email }: Values) => {
    setFailed(false);
    try { const r = await waitlistService.join(email); setDone({ email, persisted: r.persisted }); } catch { setFailed(true); }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-night-900 p-6 md:p-7">
      <AnimatePresence mode="wait" initial={false}>
        {done ? (
          <motion.div key="ok" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="py-4 text-center" role="status">
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-ok-dark/15 text-ok-dark"><Check size={24} strokeWidth={3} /></span>
            <h3 className="mt-4 text-xl font-extrabold text-white">You’re on the list.</h3>
            <p className="mt-1.5 text-sm text-mute">We’ll write to <span className="font-semibold text-white">{done.email}</span> with progress updates.</p>
            {!done.persisted && <p className="mt-3 text-[12px] text-mute/80">Demo mode: this address was not stored.</p>}
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={handleSubmit(onSubmit)} noValidate exit={{ opacity: 0 }}>
            <h3 className="text-[26px] font-extrabold tracking-tight text-white">Get early access.</h3>
            <p className="mt-1.5 text-[14.5px] text-mute">Be the first to try ALIBI and get updates on our progress.</p>
            <label htmlFor="wl-email" className="mt-5 block text-[13px] font-semibold text-snow">Work email</label>
            <input id="wl-email" type="email" autoComplete="email" placeholder="name@company.com" aria-invalid={!!errors.email} aria-describedby={errors.email ? "wl-err" : undefined} {...register("email")} className="mt-1.5 w-full rounded-lg border border-white/12 bg-night-950 px-3.5 py-3 text-[15px] text-white placeholder:text-mute/60 focus:border-red focus:outline-none" />
            {errors.email && <p id="wl-err" role="alert" className="mt-1.5 text-[13px] font-medium text-[#ff6b78]">{errors.email.message}</p>}
            {failed && <p role="alert" className="mt-1.5 text-[13px] font-medium text-[#ff6b78]">Could not join the waitlist. Try again in a moment.</p>}
            <button type="submit" disabled={isSubmitting} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red px-5 py-3.5 text-[15px] font-bold text-white transition hover:bg-red-600 disabled:opacity-70">
              {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Joining…</> : <>Join Waitlist <ArrowRight size={16} /></>}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

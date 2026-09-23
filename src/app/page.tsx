import { dashboardService } from "../services/dashboard.service";
import { LandingNavbar } from "../components/landing/LandingNavbar";
import { Hero } from "../components/landing/Hero";
import { MetricStrip } from "../components/landing/MetricStrip";
import { SameRiskDemo } from "../components/landing/SameRiskDemo";
import { ProcessFlow } from "../components/landing/ProcessFlow";
import { WhyAlibi } from "../components/landing/WhyAlibi";
import { Impact } from "../components/landing/Impact";
import { ProductPreview } from "../components/landing/ProductPreview";
import { DemoVideo } from "../components/landing/DemoVideo";
import { WaitlistForm } from "../components/landing/WaitlistForm";
import { FinalCTA } from "../components/landing/FinalCTA";
import { Reveal } from "../components/motion/primitives";

export default async function Landing() {
  const overview = await dashboardService.getOverview();
  return (
    <>
      <LandingNavbar />
      <main>
        <Hero />
        <MetricStrip />
        <SameRiskDemo />
        <ProcessFlow />
        <WhyAlibi />
        <Impact />
        <ProductPreview data={overview} />
        <section id="demo" className="scroll-mt-16 bg-night-950 pb-24 pt-6 md:pb-32">
          <div className="mx-auto max-w-[1240px] px-5 md:px-8">
            <Reveal className="max-w-2xl">
              <h2 id="video" className="scroll-mt-24 text-[clamp(2rem,4.6vw,3.4rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-white">See ALIBI in action.</h2>
              <p className="mt-3 text-[17px] text-snow/70">Watch how ALIBI turns a suspicious transaction into an explainable decision.</p>
            </Reveal>
            <div className="mt-10 grid items-end gap-6 lg:grid-cols-[1.9fr_1fr]">
              <Reveal><DemoVideo /></Reveal>
              <Reveal delay={0.1}><WaitlistForm /></Reveal>
            </div>
          </div>
        </section>
      </main>
      <FinalCTA />
    </>
  );
}

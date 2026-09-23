# ALIBI — AI Fraud Investigator

Hackathon-ready frontend. Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind v4 + Framer Motion + Recharts.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start   # production build
```

## Data modes

- `NEXT_PUBLIC_DATA_MODE=demo` (default, emergency fallback): built-in demo data, no backend needed.
- `NEXT_PUBLIC_DATA_MODE=api` + `NEXT_PUBLIC_API_URL`: the real backend in `backend/`. Simulator → `POST /transactions/analyze` → real
  investigation; Investigation pages and Compare Mode use the backend scenarios A/B (Compare Mode wording adapts to the real
  initial risks). Analytics stays a labeled simulation; the waitlist doesn't store emails in either mode.

## Structure

- `src/app/` — routes. `/` is the landing page; everything under `/app/*` is the product (dashboard, transactions, investigation, simulator, analytics, settings).
- `src/components/landing/` — landing sections (Hero, HeroGlobe, SameRiskDemo, ProcessFlow, WhyAlibi, Impact, ProductPreview, DemoVideo, WaitlistForm, FinalCTA).
- `src/components/app/` — product UI (AppShell/sidebar, MetricCard, TransactionFlow, Charts, FraudMap, TransactionTable, InvestigationView, CompareMode, SimulatorForm/Result, AnalyticsView).
- `src/components/ui/` — shared atoms (Logo, RiskRing, badges, empty/loading states, NetworkBackdrop).
- `src/components/motion/` — animation primitives (Reveal, StaggerGroup, AnimatedNumber, DrawPath, TransactionParticle) and the Landing→Dashboard page transition.
- `src/data/demo/` — all demo data, generated deterministically (seeded, not `Math.random`) so it's stable across server/client renders and reloads.
- `src/services/` — the only thing components talk to for data. Each method is commented with the future REST endpoint it will call. Switch from demo to a real backend by setting `NEXT_PUBLIC_DATA_MODE=api` and `NEXT_PUBLIC_API_URL` — no component changes needed.
- `src/lib/investigation.ts` + `useInvestigation.ts` — the shared "play an investigation" engine used by the landing Same-Risk demo, the Investigation page, the Simulator, and Compare Mode, so the animated sequence is defined once.

## Entry & workspaces (v2)

- **`/welcome`** — choose **Explore Demo** (one click, no sign-up → `/app/dashboard`) or **Start Fresh** (`/welcome/create`: name, work email, organization, role).
- **Workspace mode** (`src/lib/workspace.tsx`, `WorkspaceMode = "demo" | "fresh"`) is the *experience*: pre-populated demo vs. the user's own empty workspace. Stored in `localStorage` (`alibi.workspace.v1`); no backend, no auth.
- It is separate from **data mode** (`NEXT_PUBLIC_DATA_MODE`), which is *where data comes from* (demo dataset vs. API).
- Fresh workspace: zeroed metrics, Getting started, designed empty states for Transactions / Analytics / Investigation. Every Simulator run is saved locally as `LOC-####` with its own investigation page.
- Demo workspace: persistent **Demo data** pill (Reset Demo / Start Fresh) and a first-visit **Guided Demo** (dashboard → investigation replay → 91% vs 91% Compare → finale).
- Landing: *Get Started* / *Explore Product* → `/welcome`; *See Live Demo* / *Open Live Demo* / *Open Dashboard* → straight into the demo dashboard.

## The demo flow

1. **Landing** (`/`) — Hero with an animated globe (Almaty/Singapore/Dubai/London/New York), a metrics strip, the animated **Same risk. Different reality.** comparison, How ALIBI Works, Why ALIBI, Impact, a live dashboard preview, a demo-video placeholder (drop in a real file via `NEXT_PUBLIC_DEMO_VIDEO_URL`), and a waitlist form.
2. **Dashboard** (`/app/dashboard`) — KPIs, transaction flow, risk distribution, fraud trends, recent high-risk transactions, fraud-by-region.
3. **Transactions** (`/app/transactions`) — filterable, paginated explorer.
4. **Investigation** (`/app/investigation/[id]`) — the core screen: animated risk factors → evidence → verification → decision, with Replay/Skip/Pause.
5. **Simulator** (`/app/simulator`) — build a transaction or pick a preset, then the flagship **Compare Mode**: "Investigate Both" runs the legitimate and fraud scenarios side by side, ending in `APPROVED` vs `BLOCKED`.
6. **Analytics** (`/app/analytics`) — traditional detection vs ALIBI, precision/recall, PR-AUC, business-loss comparison. All labeled "Simulated demo comparison".
7. **Settings** (`/app/settings`) — workspace controls (Switch to Demo / Start Fresh / Reset Demo), data source, display and notification toggles.

## Known limitations (see FINAL STATUS in chat)

- No real backend, ML model, or persistence — by design (Demo Mode).
- No automated visual regression / headless-browser QA was possible in the build sandbox (no network access to fetch a Chromium binary); verification here was via production build, TypeScript, route smoke-testing (curl), and manual code review against the two reference images.
- Waitlist emails are not stored anywhere in demo mode.

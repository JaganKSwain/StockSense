# TECH_STACK.md — StockSense

Bias: zero backend to write by hand, zero deployment friction, real-time out of the box. Every choice below is picked because it removes a class of work, not because it's trendy.

## 1. Selected Tech Stack

| Layer | Tool/Framework | Rationale (Speed vs. Judging Appeal) |
|---|---|---|
| Frontend | **Next.js 14 (App Router) + React** | File-based routing gets Dashboard/Products/Receipts/Deliveries/Transfers/Ledger scaffolded in minutes; Vercel deploy is one command. |
| Backend/API | **Next.js Route Handlers** (no separate server) | Skips spinning up Express/Fastify; colocated with frontend, one deploy target, zero CORS config. |
| Database/ORM | **Supabase (Postgres) + Supabase JS client** (no separate ORM) | Managed Postgres + instant REST/Realtime + Auth in one free-tier project. Skipping Prisma saves a migration-tooling step; use raw SQL views for derived stock. |
| Realtime | **Supabase Realtime (Postgres CDC channels)** | This is the entire "wow factor" — free, zero infra, subscribe to a table and the UI updates itself. |
| Auth/Hosting | **Supabase Auth (magic link) + Vercel** | One seeded demo account, no OTP UI to build. Vercel free tier, git-push deploy, instant preview URLs for judges. |
| Styling | **Tailwind CSS + shadcn/ui** | Pre-built, accessible, unstyled-by-default components (Table, Dialog, Badge, Card) that still look bespoke once themed — this is where "Design & Polish" points come from cheaply. |
| Charts (P1) | **Recharts** | Drop-in bar/line chart for the 7-day movement graph if time permits. |
| Animation | **Framer Motion** | Animated KPI counters and toast/validate micro-interactions — cheap, high visual payoff. |
| Icons | **lucide-react** | Ships with shadcn/ui by default, no extra install. |

## 2. Third-Party APIs & Libraries

```
next@14
react@18 react-dom@18
@supabase/supabase-js
@supabase/ssr
tailwindcss postcss autoprefixer
shadcn/ui (CLI-generated components: button, card, table, dialog, badge, input, select, sonner)
framer-motion
recharts          # P1 only
lucide-react
sonner            # toast notifications
zod               # form/payload validation
react-hook-form   # form state for Receipt/Delivery/Transfer forms
```

No LLM/AI orchestration layer is needed for the P0 scope — this is a real-time data-integrity demo, not an AI feature demo. (If a sponsor bonus requires AI, bolt on one thing only: an Anthropic-powered "explain this stock trend" button on the ledger — P1, cut first under time pressure.)

## 3. Project Structure

```
stocksense/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                 # → redirects to /dashboard
│   ├── login/page.tsx           # magic-link only
│   ├── dashboard/page.tsx       # KPI cards, realtime subscribed
│   ├── products/
│   │   ├── page.tsx             # list + create dialog
│   │   └── [id]/page.tsx        # per-location stock breakdown
│   ├── receipts/
│   │   ├── page.tsx
│   │   └── new/page.tsx
│   ├── deliveries/
│   │   ├── page.tsx
│   │   └── new/page.tsx
│   ├── transfers/new/page.tsx
│   ├── adjustments/new/page.tsx
│   ├── ledger/page.tsx          # Move History, filterable, realtime
│   └── api/
│       ├── receipts/route.ts    # POST: create + validate receipt
│       ├── deliveries/route.ts  # POST: create + validate delivery
│       ├── transfers/route.ts   # POST: internal transfer
│       └── adjustments/route.ts # POST: stock adjustment
├── components/
│   ├── ui/                      # shadcn generated
│   ├── kpi-card.tsx
│   ├── stock-badge.tsx
│   └── data-table.tsx
├── lib/
│   ├── supabase/client.ts       # browser client
│   ├── supabase/server.ts       # server client (route handlers)
│   └── realtime.ts              # subscribe helpers
├── supabase/
│   └── schema.sql                # full DDL, see SYSTEM_DESIGN.md
├── .env.example
├── tailwind.config.ts
└── package.json
```

## 4. Speed Run Setup

### Bootstrap (under 10 minutes)

```bash
# 1. Scaffold
npx create-next-app@latest stocksense --typescript --tailwind --app --eslint
cd stocksense

# 2. Core deps
npm install @supabase/supabase-js @supabase/ssr framer-motion recharts \
  lucide-react sonner zod react-hook-form @hookform/resolvers

# 3. shadcn/ui
npx shadcn@latest init -d
npx shadcn@latest add button card table dialog badge input select sonner label

# 4. Supabase project
npx supabase login
npx supabase init
# Create project at supabase.com → copy URL + anon key into .env.local

# 5. Push schema (paste supabase/schema.sql into SQL editor, or:)
npx supabase db push

# 6. Run
npm run dev
```

### `.env.example`

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # server-side route handlers only
```

### Deploy

```bash
git init && git add . && git commit -m "StockSense MVP"
npx vercel --prod
# add env vars in Vercel dashboard → redeploy
```

### Fail-Gracefully / Fallback Strategies

- **Supabase Realtime drops mid-demo:** Wrap every subscription in a 3-second polling fallback (`setInterval` re-fetch) that only activates if no realtime event has landed in 5s. Judges never see a stale screen.
- **Wi-Fi dies at venue:** Pre-seed the DB the night before and have a **local recorded backup clip** of the live demo cued up as insurance — never rely on live network for the pitch.
- **Supabase free-tier cold start lag:** Ping the project 10 minutes before your slot to warm the connection pool.
- **Form validation edge cases:** Use `zod` schemas with sane defaults so a judge fat-fingering the demo form (if you let them touch it) can't crash the UI — clamp negative quantities, disable Validate until required fields are filled.
- **Seed data:** Ship a `seed.sql` with 8–10 realistic products, 2 warehouses, and stock levels pre-tuned so the low-stock demo step (1:20 in the script) reliably crosses the threshold on the exact quantity you deliver.

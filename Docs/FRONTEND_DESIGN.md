# FRONTEND_DESIGN.md — StockSense

Companion to `SYSTEM_DESIGN.md` (backend schema/contracts) and `TECH_STACK.md` (stack choices). This file is the frontend-only blueprint: component tree, API integration layer, types, state, and per-page provisions.

## 1. Frontend Architecture Overview

```
Browser
  │
  ├─ React Server Components  → initial data fetch (Supabase server client, no waterfall)
  ├─ Client Components        → forms, tables, KPI cards (interactive)
  ├─ lib/api/*.ts             → typed fetch wrappers around /api/* route handlers
  ├─ lib/supabase/client.ts   → browser Supabase client (Realtime subscriptions only)
  └─ hooks/*.ts               → useDashboardKPIs, useStockLedger, useRealtimeChannel
```

**Data flow rule:** every page **server-renders its initial state** (fast, no skeleton flash on first load) then **hydrates a Realtime subscription client-side** that patches the same state in place. Mutations (Validate buttons) go through `/api/*` route handlers, never direct client writes to Postgres — this keeps stock-mutation logic (the trigger-adjacent validation) server-side and auditable.

## 2. Full Component & File Structure

```
components/
├── ui/                        # shadcn primitives (button, card, table, dialog, badge, input, select, sonner, label, skeleton)
├── layout/
│   ├── sidebar.tsx             # nav: Dashboard, Products, Receipts, Deliveries, Transfers, Adjustments, Ledger, Settings, Profile
│   ├── topbar.tsx               # page title + breadcrumb + profile menu trigger
│   └── profile-menu.tsx         # My Profile / Logout dropdown
├── dashboard/
│   ├── kpi-card.tsx              # animated counter + realtime highlight flash
│   ├── kpi-grid.tsx               # lays out the 5 KPI cards
│   └── low-stock-banner.tsx        # conditional red banner, P1
├── products/
│   ├── product-table.tsx
│   ├── product-create-dialog.tsx
│   └── product-detail-sheet.tsx     # slide-over: per-location stock bars + mini ledger
├── operations/
│   ├── receipt-form.tsx
│   ├── delivery-form.tsx
│   ├── transfer-form.tsx
│   ├── adjustment-form.tsx
│   └── validate-button.tsx           # shared: spinner → success pulse → toast
├── ledger/
│   ├── ledger-table.tsx
│   └── ledger-filter-bar.tsx          # doc type / status / warehouse / category pills
└── shared/
    ├── empty-state.tsx
    ├── stock-badge.tsx                 # color-coded qty badge (ok/low/out)
    └── realtime-indicator.tsx           # small pulsing dot = "live" connection status

hooks/
├── use-dashboard-kpis.ts        # initial props + realtime patch
├── use-stock-ledger.ts          # paginated + filterable + realtime prepend
├── use-product-stock.ts         # per-product per-location levels
└── use-realtime-channel.ts       # generic Supabase channel subscribe/cleanup wrapper

lib/
├── api/
│   ├── receipts.ts               # createReceipt()
│   ├── deliveries.ts              # createDelivery()
│   ├── transfers.ts                # createTransfer()
│   ├── adjustments.ts               # createAdjustment()
│   └── dashboard.ts                  # getKpis()
├── supabase/
│   ├── client.ts                  # browser client (anon key, Realtime only)
│   └── server.ts                   # server client (route handlers, service role)
├── types.ts                        # shared TS types, mirrors DB schema
└── utils.ts                         # formatQty, formatSku, cn()
```

## 3. Shared Types (`lib/types.ts`)

```typescript
export type DocType = 'receipt' | 'delivery' | 'transfer' | 'adjustment';
export type MoveStatus = 'draft' | 'waiting' | 'ready' | 'done' | 'canceled';

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string | null;
  unit: string;
  lowStockThreshold: number;
}

export interface Location {
  id: string;
  warehouseId: string;
  name: string;
}

export interface StockLevel {
  productId: string;
  locationId: string;
  quantity: number;
}

export interface StockMove {
  id: string;
  docType: DocType;
  status: MoveStatus;
  productId: string;
  fromLocationId: string | null;
  toLocationId: string | null;
  quantity: number;
  reference: string | null;
  createdAt: string;
}

export interface DashboardKpis {
  totalProducts: number;
  lowStockCount: number;
  pendingReceipts: number;
  pendingDeliveries: number;
  scheduledTransfers: number;
}
```

## 4. API Integration Layer (`lib/api/*.ts`)

Every mutation follows the same shape: typed request → `fetch` to the route handler → typed response → caller triggers a toast + relies on Realtime (not the response) to update shared UI state.

```typescript
// lib/api/receipts.ts
import type { StockMove } from '@/lib/types';

interface CreateReceiptInput {
  productId: string;
  toLocationId: string;
  quantity: number;
  reference?: string;
}

interface CreateReceiptResponse {
  moveId: string;
  docType: 'receipt';
  newStockLevel: { locationId: string; quantity: number };
}

export async function createReceipt(input: CreateReceiptInput): Promise<CreateReceiptResponse> {
  const res = await fetch('/api/receipts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to validate receipt');
  return res.json();
}
```

`deliveries.ts`, `transfers.ts`, `adjustments.ts` mirror this exactly, matching the contracts in `SYSTEM_DESIGN.md` §3. `dashboard.ts` exports `getKpis()` used for the server-rendered initial load.

## 5. Realtime Subscription Pattern

One generic hook wraps every Supabase channel so components don't duplicate subscribe/cleanup logic:

```typescript
// hooks/use-realtime-channel.ts
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useRealtimeChannel(
  table: 'stock_moves' | 'stock_levels',
  onChange: (payload: any) => void
) {
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`realtime:${table}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table }, onChange)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [table, onChange]);
}
```

`use-dashboard-kpis.ts` and `use-stock-ledger.ts` both call this with `stock_moves`, recompute derived counts client-side on each event, and flag the changed row/card with `source: 'realtime'` vs `source: 'self'` so the amber-vs-cyan highlight distinction from `SYSTEM_DESIGN.md` §4 can be rendered.

## 6. Page-by-Page Provisions

| Route | Server-fetched on load | Client hooks | Mutating API | Key components |
|---|---|---|---|---|
| `/dashboard` | `getKpis()` | `useDashboardKpis`, `useRealtimeChannel('stock_moves')` | — | `kpi-grid`, `kpi-card`, `low-stock-banner` |
| `/products` | product list + latest stock_levels join | `useRealtimeChannel('stock_levels')` | — | `product-table`, `product-create-dialog` |
| `/products/[id]` | product + per-location levels + last 10 moves | `useProductStock` | — | `product-detail-sheet` |
| `/receipts/new` | product + location dropdown data | — | `createReceipt` | `receipt-form`, `validate-button` |
| `/deliveries/new` | product + location dropdown data | — | `createDelivery` | `delivery-form`, `validate-button` |
| `/transfers/new` | product + location dropdown data | — | `createTransfer` | `transfer-form`, `validate-button` |
| `/adjustments/new` | product + location dropdown data | — | `createAdjustment` | `adjustment-form`, `validate-button` |
| `/ledger` | first page of `stock_moves` (server) | `useStockLedger`, `useRealtimeChannel('stock_moves')` | — | `ledger-table`, `ledger-filter-bar` |

## 7. Form Handling Pattern

All four operation forms (`receipt-form.tsx`, etc.) share one pattern: `react-hook-form` + `zod` resolver, disabled Validate button until valid, and identical success handling.

```typescript
const schema = z.object({
  productId: z.string().uuid(),
  toLocationId: z.string().uuid(),
  quantity: z.coerce.number().positive(),
  reference: z.string().optional(),
});

const form = useForm({ resolver: zodResolver(schema) });

async function onSubmit(values: z.infer<typeof schema>) {
  try {
    await createReceipt(values);
    toast.success(`Receipt validated — stock +${values.quantity}`);
    form.reset();
  } catch (e) {
    toast.error((e as Error).message);
  }
}
```

`ValidateButton` centralizes the loading-spinner → success-pulse animation so all four forms look and feel identical (consistency point in the demo).

## 8. State Management Approach

No global state library (Redux/Zustand) — deliberately cut for hackathon speed. State lives in three places only:

1. **Server-rendered props** — initial page data, no loading flash.
2. **Local component state** (`useState`/`react-hook-form`) — forms and dialogs.
3. **Realtime-derived state** in the three data hooks (`use-dashboard-kpis`, `use-stock-ledger`, `use-product-stock`) — each owns its own slice, patched by Postgres change events. No cross-page shared store needed because every page independently subscribes to the same source of truth (the DB), which is the architectural point being demonstrated.

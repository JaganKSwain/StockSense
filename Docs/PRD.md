# PRD.md — StockSense (ODOO x GCET Hackathon)

## 1. The Hook & Value Proposition

**Problem:** SMB warehouses run on Excel + WhatsApp + paper registers. Stock counts drift from reality within days. Nobody knows what's low until a customer order fails. Nobody knows where an item physically is until someone walks the floor.

**Persona:** Priya, an Inventory Manager at a 3-warehouse auto-parts distributor. She spends 40% of her day reconciling spreadsheets instead of managing stock.

**The 10x Differentiator:** StockSense isn't "another CRUD inventory app." It's a **real-time stock ledger with predictive alerts** — every receipt, delivery, transfer, and adjustment writes to one immutable ledger, and the dashboard computes live stock health (not a stale daily report). The "wow" moment: judges watch a delivery validate on one screen and see stock counts, KPIs, and a low-stock alert update **instantly** on a second screen — no refresh. That's the Odoo promise (unified operations) delivered in a UI that's actually pleasant to look at.

## 2. Scope Discipline

### P0 — Core Demo Flow (non-negotiable, must work flawlessly live)
1. Dashboard with 5 live KPIs (Total Products, Low Stock, Pending Receipts, Pending Deliveries, Transfers Scheduled).
2. Product list with SKU, category, current stock, per-location breakdown.
3. Create a **Receipt** → add product + qty → Validate → stock increases, ledger entry created, dashboard KPI updates live.
4. Create a **Delivery Order** → pick product + qty → Validate → stock decreases, low-stock alert fires if threshold crossed.
5. **Internal Transfer** between two locations → stock total unchanged, per-location stock updates.
6. **Stock Adjustment** → enter counted qty → system logs delta.
7. **Move History / Stock Ledger** view — every one of the above actions appears here in real time, filterable by document type.
8. Realtime sync (Supabase Realtime) — the dashboard/ledger update without manual refresh when any operation validates.

### P1 — If Time Permits
- Low-stock email/toast alert with a threshold config per product.
- Multi-warehouse filter dropdown on dashboard.
- SKU search + smart filters (status: Draft/Waiting/Ready/Done).
- Simple bar chart of stock movement over the last 7 days (Recharts).
- CSV export of the ledger.
- Draft → Waiting → Ready → Done status workflow on documents (instead of instant validate).

### Out of Scope (Explicit Cut List)
- Full auth (roles, permissions, multi-tenant) — use a single seeded demo login or magic-link, no OTP flow, no signup polish.
- Deep settings / warehouse CRUD UI — seed 2–3 warehouses directly in the DB.
- Full product CRUD (edit/delete history, bulk import) — create-only is enough.
- Vendor/supplier management as a separate entity — a free-text field is enough.
- Cancel/error-recovery flows, undo, partial receipts/backorders.
- Mobile app / barcode scanning hardware integration.
- Notification infrastructure (real email/SMS) — a toast is enough.

## 3. Judging Rubric Alignment

| Criterion | How StockSense Hits It |
|---|---|
| **Technical Complexity** | Real-time Postgres triggers computing derived stock levels + Supabase Realtime channels pushing changes to two simultaneous UI surfaces (dashboard + ledger) with zero polling. Relational schema with per-location stock, not a single denormalized counter. |
| **Real-World Impact** | Directly replaces the Excel-and-WhatsApp workflow every SMB warehouse manager described in the problem statement actually uses today. Demo maps 1:1 to the four Odoo-style operations (Receipt, Delivery, Transfer, Adjustment). |
| **Design & Polish** | Dark, data-dense dashboard (Linear/Vercel-style aesthetic) with skeleton loaders, animated KPI counters, and a toast-driven validate flow — feels like a funded SaaS product, not a hackathon CRUD app. |
| **Business Viability / Novelty** | Ledger-first architecture (append-only stock movements, derived balances) is exactly how real WMS/ERP systems are built — signals the team understands inventory accounting, not just a form builder. Clear expansion path: barcode scanning, reorder automation, multi-tenant SaaS. |

## 4. Step-by-Step Demo Script (180 seconds)

**0:00–0:20 — The Hook**
Open on the Dashboard. Say the one-liner: *"Priya runs three warehouses on Excel. StockSense replaces that with one live ledger."* KPIs are visibly populated with realistic seed data (not zeros).

**0:20–0:50 — Receipt (Stock In)**
Navigate to Receipts → New. Add "Steel Rods," qty 50, supplier "Acme Metals." Hit Validate. **Cut to dashboard tab already open** — Total Products / stock count animates upward instantly. Say: *"No refresh. That's Supabase Realtime pushing the ledger update."*

**0:50–1:20 — Delivery (Stock Out) triggering Low Stock**
Go to Delivery Orders → New. Pick a product seeded near its low-stock threshold. Deliver enough to cross it. Validate. A **Low Stock badge** lights up red on the dashboard KPI live. This is the "aha" — the system *warns before the shelf is actually empty.*

**1:20–1:45 — Internal Transfer**
Transfer 20 units from Main Warehouse → Production Floor. Show the per-location breakdown on the product detail updating (total stock unchanged, location split changes).

**1:45–2:10 — Stock Adjustment**
Run a physical-count adjustment (e.g., 3 units damaged). Show the ledger auto-logging the delta with a reason code.

**2:10–2:50 — The Ledger (Payoff)**
Open Move History. Scroll: every action just performed (receipt, delivery, transfer, adjustment) is there, filterable by type/status/warehouse, timestamped, fully auditable. Say: *"This is the single source of truth Priya never had."*

**2:50–3:00 — Close**
One sentence on the roadmap (reorder automation, barcode scanning) to signal business viability, then stop talking.

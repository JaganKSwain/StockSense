# STITCH_PROMPTS.md — StockSense UI/UX for Google Stitch

Ready-to-paste prompts for [stitch.withgoogle.com](https://stitch.withgoogle.com), built on the **Zoom-Out-Zoom-In** framework and locked to the design tokens already defined in `SYSTEM_DESIGN.md` §4, so every generated screen stays visually consistent.

**Mode:** Use **Standard Mode** (text-only, Gemini 2.5 Flash) for every screen below — you want Figma-editable layers to hand off, not the Experimental/code-export path. Generate screens in the order listed; Stitch reasons over prior screens in the same project, so later prompts can say "match the dashboard" instead of re-stating the system every time.

---

## 0. Zoom-Out — Paste this first, before any screen prompt

```
Context: StockSense, a real-time inventory management web app for
warehouse teams (replacing Excel and paper stock registers). Desktop-first,
responsive web dashboard, not a marketing site.

Target users: Inventory Managers (oversee stock levels, approve
receipts/deliveries) and Warehouse Staff (execute transfers, picking,
counting) — both technical enough for a data-dense interface, no
hand-holding needed.

Design system to follow on every screen:
- Theme: dark-first, near-black background (#0A0A0B), card surface
  (#161618), border (#27272A)
- Accent (live/realtime elements only): cyan #22D3EE
- Status colors: success/increase #34D399, danger/low-stock #F87171,
  warning/pending #FBBF24
- Text: primary #FAFAFA, secondary #A1A1AA
- Typography: Inter for UI text and labels; JetBrains Mono for all
  numeric values, quantities, and SKU codes
- Corner radius: 0.75rem on cards, 0.5rem on inputs and buttons
- Overall feel: Linear / Vercel-style data product — precise, calm,
  confident. Not a generic SaaS card kit with drop shadows everywhere.
  No gradient washes, no tracked-out all-caps eyebrow labels.
```

---

## 1. Dashboard (generate this screen first)

```
Screen type: Home / Dashboard (desktop web).

Goal of the screen: let an Inventory Manager assess warehouse health in
under 5 seconds — how much stock exists, what's low, and what operations
are pending.

Layout & hierarchy:
- Left sidebar, full height: nav items Dashboard (active), Products,
  Receipts, Deliveries, Transfers, Adjustments, Ledger, Settings, and a
  profile menu pinned at the bottom.
- Top of main area: a horizontal row of 5 KPI cards — Total Products in
  Stock, Low Stock / Out of Stock Items, Pending Receipts, Pending
  Deliveries, Internal Transfers Scheduled. Each card shows a large
  monospace number and a small label below it. The Low Stock card has a
  red-tinted border and a small warning icon when its count is above zero.
- Below the KPI row: a two-column area. Left column (wider): a simple
  7-day stock movement bar chart. Right column (narrower): a "Recent
  Activity" list showing the last 5 ledger entries (icon for doc type,
  product name, quantity delta, relative timestamp).
- A small pulsing dot near the top-right labeled "Live" to indicate a
  real-time connection.

Constraints: data-dense but not cluttered — generous spacing between the
KPI cards, tight spacing within each card. No stock photography, no
illustrations.
```

---

## 2. Products List

```
Screen type: List / table view, same sidebar as the Dashboard (Products
now active in nav).

Goal of the screen: let staff scan every product, its SKU, category, and
current total stock at a glance, and jump into detail or create a new one.

Layout & hierarchy:
- Page header: "Products" title, product count subtitle, and a primary
  "New Product" button top-right.
- Filter bar directly below the header: a search input (placeholder
  "Search by name or SKU") and two dropdown filters (Category, Warehouse).
- Main content: a data table with columns SKU (monospace), Name,
  Category, Unit, Total Stock (monospace, color-coded badge: green if
  healthy, amber if near threshold, red if below threshold), and a
  chevron to open detail.
- Empty state (for when filters return nothing): centered icon, one-line
  message, and a "Clear filters" action.

Constraints: table rows should feel scannable — clear row dividers using
the border color, no zebra striping, no rounded table cells.
```

---

## 3. Product Detail (slide-over panel)

```
Screen type: Slide-over panel / drawer, overlaying the Products list.

Goal of the screen: show exactly where a single product's stock physically
sits and its recent movement history.

Layout & hierarchy:
- Panel header: product name, SKU in monospace, category tag, close (X)
  button top-right.
- A horizontal stacked bar showing stock split across locations (e.g.
  Main Warehouse, Production Floor), each segment labeled with location
  name and quantity.
- Below that: "Recent Moves" — a compact list of the last 10 ledger
  entries for this product only, each row showing doc type icon,
  from/to location, quantity delta (+/- in the success/danger color), and
  timestamp.

Constraints: this is a focused, single-purpose panel — no navigation
chrome inside it, just the close action.
```

---

## 4. Receipt Form (New Receipt)

```
Screen type: Form page, same sidebar (Receipts active).

Goal of the screen: let a warehouse staff member log incoming stock from a
supplier in under 30 seconds.

Layout & hierarchy:
- Page header: "New Receipt".
- A single centered form card containing, top to bottom: Product
  (searchable select), Destination Location (select), Quantity (numeric
  input with the product's unit shown inline, e.g. "kg"), Reference /
  Supplier (text input, optional).
- Two buttons at the bottom of the card: secondary "Cancel" and primary
  "Validate Receipt" — the primary button should visually read as the
  single confident action on the page.

Constraints: this form should feel fast to fill, not like a long
enterprise form — generous vertical spacing between the 4 fields only,
nothing else on the page competing for attention.
```

---

## 5. Delivery Order Form (New Delivery)

```
Screen type: Form page, same sidebar (Deliveries active).

Goal of the screen: let staff record outgoing stock for a customer
shipment, with a clear warning if it will push a product below its
low-stock threshold.

Layout & hierarchy:
- Page header: "New Delivery Order".
- Form card: Product (searchable select), Source Location (select),
  Quantity (numeric input), Reference / Sales Order (text input,
  optional).
- Below the quantity field, an inline warning banner (amber/red,
  collapsed by default) that would read "This will bring stock below the
  low-stock threshold (X remaining)" — show it in its visible state in
  this mockup so the pattern exists.
- Primary "Validate Delivery" button, secondary "Cancel".

Constraints: same visual weight and spacing as the Receipt form — these
two screens should feel like siblings, not different products.
```

---

## 6. Internal Transfer Form

```
Screen type: Form page, same sidebar (Transfers active).

Goal of the screen: move stock between two locations for the same
product, making the "from → to" relationship visually obvious.

Layout & hierarchy:
- Page header: "New Internal Transfer".
- Form card: Product (searchable select), then a horizontal row with
  From Location (select) — an arrow icon — To Location (select), then
  Quantity (numeric input).
- Primary "Validate Transfer" button, secondary "Cancel".

Constraints: the From → To row is the visual focus of this screen; make
the arrow icon and two location selects feel connected, not like two
unrelated fields.
```

---

## 7. Stock Adjustment Form

```
Screen type: Form page, same sidebar (Adjustments active).

Goal of the screen: correct a mismatch between recorded and physically
counted stock.

Layout & hierarchy:
- Page header: "New Stock Adjustment".
- Form card: Product (searchable select), Location (select), Current
  Recorded Quantity (read-only display, monospace), Counted Quantity
  (numeric input), Reason (short text input, e.g. "Damaged in transit").
- Below the counted-quantity field, show a small computed delta line
  (e.g. "Δ -3") in red or green depending on sign.
- Primary "Validate Adjustment" button, secondary "Cancel".

Constraints: the delta line is the key trust-building element on this
screen — keep it visually near the two quantity fields it's derived from.
```

---

## 8. Move History / Ledger

```
Screen type: List / table view, same sidebar (Ledger active).

Goal of the screen: show every stock movement across the whole system as
a single auditable, filterable feed.

Layout & hierarchy:
- Page header: "Move History".
- Filter bar: pill-style dropdown filters for Document Type
  (Receipt/Delivery/Transfer/Adjustment), Status (Draft/Waiting/
  Ready/Done/Canceled), Warehouse, and Product Category.
- Main content: a dense table with columns Date/Time (monospace),
  Doc Type (small colored badge), Product, From → To Location, Quantity
  (monospace, colored by sign), Reference, Status (badge).
- A small "Live" pulsing indicator near the header, matching the
  Dashboard, to signal this table updates in real time.

Constraints: this is the most data-dense screen in the app — prioritize
legibility and row scanning over decoration; every column should align
cleanly.
```

---

## After generating: what to bring back into the codebase

1. Export each screen's **Figma layers** (Standard Mode supports this) and hand the file to whoever owns visual polish before dev handoff.
2. If Stitch produces a `DESIGN.md`, diff it against the tokens in `SYSTEM_DESIGN.md` §4 — treat `SYSTEM_DESIGN.md` as the source of truth if they drift, since that's what the Tailwind config and shadcn theme in `TECH_STACK.md` are built against.
3. Use the generated layouts as the reference for building the real components listed in `FRONTEND_DESIGN.md` §2 — Stitch's HTML/Tailwind export is a starting point, not what ships; rebuild each screen as the typed React components already scoped there.

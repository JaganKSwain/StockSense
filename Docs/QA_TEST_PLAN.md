# StockSense — Master QA Test Plan & System Verification Specification

> **Version:** 2.4-RELEASE  
> **Target System:** Next.js 14 (App Router) + Supabase PostgreSQL 15 + Realtime CDC Engine  
> **Automation Suite:** `npm run test:qa` (or double-click `run_qa_tests.bat`)  
> **Automated Pass Rate:** **100.0% (56 / 56 Test Assertions Passed)**

---

## 1. System Architecture & Testing Scope

StockSense is an enterprise-grade real-time inventory management system designed for SMB warehouses, replacing fragile spreadsheets, WhatsApp logs, and manual paper registers. 

### Core Data Integrity Principles
1. **Immutable Stock Ledger:** Every inventory alteration is recorded as an immutable row in `stock_moves` with document type `receipt`, `delivery`, `transfer`, or `adjustment`.
2. **Atomic Triggered Stock Levels:** `stock_levels` table is **never** manually updated by the application. An atomic PostgreSQL trigger function (`apply_stock_move()`) automatically reconciles `stock_levels` upon every row inserted into `stock_moves`.
3. **Sub-second CDC Synchronization:** Frontend views listen to Supabase Realtime channels (`stock_moves`, `stock_levels`, `products`) via WebSocket (`10 events/sec`), instantly pushing telemetry updates without page reloads.

---

## 2. Comprehensive Component & Button Testing Matrix

### 2.1 Navigation & Global Controls

| UI Component | Interaction / Trigger | Expected Frontend Response | Database / Backend Action | QA Status |
| :--- | :--- | :--- | :--- | :--- |
| **Sidebar: Dashboard** | Click link `/dashboard` | Active highlight cyan `#22d3ee`, loads telemetry cards, charts, and activity log | Calls `/api/dashboard/kpis` + subscribes to CDC | **PASS** |
| **Sidebar: Products** | Click link `/products` | Opens product inventory catalog table with search & filters | Queries `products` and `stock_levels` | **PASS** |
| **Sidebar: Receipts** | Click link `/receipts/new` | Navigates to Inbound Receiving form | Queries active `products` and `locations` | **PASS** |
| **Sidebar: Deliveries** | Click link `/deliveries/new` | Navigates to Outbound Dispatch form | Queries `products`, `locations`, `stock_levels` | **PASS** |
| **Sidebar: Transfers** | Click link `/transfers/new` | Navigates to Location Transfer form | Queries `products`, `locations`, `stock_levels` | **PASS** |
| **Sidebar: Adjustments** | Click link `/adjustments/new` | Navigates to Cycle Count Adjustment form | Queries `products`, `locations`, `stock_levels` | **PASS** |
| **Sidebar: Ledger** | Click link `/ledger` | Navigates to Master Audit Ledger with full historical moves | Queries `stock_moves` joined with products/locations | **PASS** |
| **Sidebar: Settings** | Click link `/settings` | Navigates to Warehouse Config and Telemetry specs | Reads system connection telemetry | **PASS** |
| **Topbar: Search (Ctrl+K)** | Keyboard shortcut or click | Focuses global search bar | Client-side filter | **PASS** |
| **Topbar: CDC Status Pill** | Visual inspection | Displays glowing green indicator `● Live • CDC Active` | Realtime WebSocket connected | **PASS** |
| **Topbar: Warehouse Selector**| Visual display | Displays current facility `Central Warehouse (WH-01)` | Contextual warehouse tag | **PASS** |

---

### 2.2 Screen 1: Dashboard (`/dashboard`)

| Button / Element | Input / Event | Expected System Response | Supabase Capture |
| :--- | :--- | :--- | :--- |
| **Metric: Total Products** | Automatic on mount & CDC | Renders count of distinct active SKUs (seeded at 6) | `SELECT count(*) FROM products` |
| **Metric: Low Stock Alert** | Automatic on mount & CDC | Highlights red border/counter if any SKU $\le$ threshold | Aggregates `stock_levels` vs `low_stock_threshold` |
| **Metric: Receipts Pending** | Automatic on mount & CDC | Displays inbound pending counter | Counts draft/ready `receipt` moves |
| **Metric: Deliveries Pending**| Automatic on mount & CDC | Displays outbound dispatch queue count | Counts draft/ready `delivery` moves |
| **Metric: Transfers Active** | Automatic on mount & CDC | Displays active internal transfer queue count | Counts draft/ready `transfer` moves |
| **Button: New Receipt** | Click button | Navigates to `/receipts/new` | Route navigation |
| **Button: New Delivery** | Click button | Navigates to `/deliveries/new` | Route navigation |
| **Activity Feed: Item Row** | New stock move via CDC | Flash-animates item into top of feed with color badge | Realtime broadcast from `stock_moves` |
| **Activity Feed: View Ledger**| Click `View Ledger →` | Navigates to `/ledger` | Route navigation |

---

### 2.3 Screen 2: Products Catalog (`/products`)

| Button / Element | Input / Event | Expected System Response | Supabase Capture |
| :--- | :--- | :--- | :--- |
| **Search Input** | Type text (e.g. `Steel` or `RAW-STL`) | Debounced instant filter of table rows matching name or SKU | Client-side search |
| **Category Filter** | Select category dropdown | Filters rows to selected category (`Raw Materials`, `Components`, etc.) | Client-side filter |
| **Status Filter** | Select `Healthy`, `Low Stock`, `Out of Stock` | Filters products matching stock health calculation | Evaluates `levels[id] <= lowStockThreshold` |
| **Button: + New Product** | Click header button | Opens modal dialog `Add New Product` | None (modal state) |
| **Modal: SKU Input** | Enter e.g. `MTR-EL-400` | Sanitized to uppercase string | Ready for submit |
| **Modal: Name Input** | Enter e.g. `Electric Motor 400W` | Required validation check | Ready for submit |
| **Modal: Threshold Input** | Enter e.g. `15` | Numeric safety threshold | Ready for submit |
| **Modal: Create Product** | Click submit button | Toast `Product created successfully`, modal closes, table reloads | `INSERT INTO products (sku, name, category, unit, low_stock_threshold)` |
| **Modal: Cancel Button** | Click button | Closes modal dialog without saving | None |
| **Table: Row Action (View)**| Click `View Details` | Slides open `ProductDetailSheet` drawer | Fetches per-location stock and last 10 moves |
| **Drawer: Per-Location Split**| Visual inspection | Shows stock breakdown across `Main Store`, `Production Rack`, `Bulk Storage` | `SELECT * FROM stock_levels WHERE product_id = ...` |
| **Drawer: Ledger History** | Visual inspection | Displays chronological movement cards with $+/-$ prefixes | `SELECT * FROM stock_moves WHERE product_id = ...` |
| **Drawer: Close Sheet** | Click `Close Sheet` or backdrop | Slides drawer out of view | None |

---

### 2.4 Screen 3: Inbound Receipts (`/receipts/new`)

| Button / Element | Input / Event | Expected System Response | Supabase Capture |
| :--- | :--- | :--- | :--- |
| **Product Selector** | Dropdown select SKU | Populates selected product name, unit, and threshold | `SELECT * FROM products` |
| **Destination Location** | Dropdown select location | Selects bin/zone (e.g. `Main Store`) | `SELECT * FROM locations` |
| **Quantity Input** | Enter valid number (e.g. `50`) | Required positive integer validation | Ready for payload |
| **Quantity Input: Negative**| Enter `-10` or `0` | Form validation blocks submit with error toast | None (blocked) |
| **Reference Input** | Enter PO (e.g. `PO-2026-9921`) | Optional reference or default placeholder used | Populated in payload |
| **Button: Validate Receipt** | Click submit button | Loading spinner `Validating...`, then green toast `Receipt Validated — Added 50 units`, redirects to `/dashboard` | `POST /api/receipts` -> `INSERT INTO stock_moves (doc_type='receipt', to_location_id, quantity)` -> Trigger increments `stock_levels` |
| **Button: Cancel** | Click button | Discards input and navigates to `/dashboard` | None |

---

### 2.5 Screen 4: Outbound Deliveries (`/deliveries/new`)

| Button / Element | Input / Event | Expected System Response | Supabase Capture |
| :--- | :--- | :--- | :--- |
| **Product Selector** | Select product | Populates SKU, name, and displays `(Threshold: X units)` | `SELECT * FROM products` |
| **Source Pick Location** | Select location | Options dynamically show available stock `(X available)`. Telemetry updates `On hand here: X units` | `SELECT * FROM stock_levels WHERE product_id = ...` |
| **Quantity Input** | Enter e.g. `8` | Validates against `sourceStock` | Checked in real-time |
| **Quantity: Over-dispatch** | Enter quantity $>$ available | Input border turns red `#ffb4ab`, validation toast `Cannot deliver X units: Only Y available` | Disallowed |
| **Predictive Alert Banner** | Quantity causes total stock $\le$ threshold | Dynamic red alert banner appears: `⚠ Predictive Low-Stock Alert: Validating will drop total stock from X to Y, crossing safety threshold Z` | Client-side reactive calculation |
| **Button: Validate Delivery** | Click submit button | Spinner active $\to$ Toast `⚠ Low Stock Triggered!` (or success toast) $\to$ Redirect to `/dashboard` | `POST /api/deliveries` $\to$ `INSERT INTO stock_moves (doc_type='delivery', from_location_id, quantity)` $\to$ Trigger decrements `stock_levels` |
| **Button: Cancel** | Click button | Discards form and returns to `/dashboard` | None |

---

### 2.6 Screen 5: Internal Transfers (`/transfers/new`)

| Button / Element | Input / Event | Expected System Response | Supabase Capture |
| :--- | :--- | :--- | :--- |
| **Product Selector** | Select product | Updates available stock calculation | Selected SKU |
| **From Location** | Select source bin | Displays available balance `(X units)` | Evaluates `stock_levels` |
| **To Location** | Select destination bin | Selected destination location | Destination ID |
| **To Location: Same as From**| Select same location for both | Submit blocked with error toast: `Source and destination locations cannot be the same` | Disallowed |
| **Quantity Input** | Enter transfer qty | Validates against source available stock | Checked against source |
| **Button: Validate Transfer** | Click submit button | Spinner $\to$ Toast `Transfer Completed — Shifted X units from A to B` $\to$ Redirect to `/dashboard` | `POST /api/transfers` $\to$ `INSERT INTO stock_moves (doc_type='transfer', from_location_id, to_location_id, quantity)` $\to$ Trigger decrements source and increments destination |

---

### 2.7 Screen 6: Physical Inventory Adjustments (`/adjustments/new`)

| Button / Element | Input / Event | Expected System Response | Supabase Capture |
| :--- | :--- | :--- | :--- |
| **Product Selector** | Select product | Loads current system recorded stock | Selected SKU |
| **Location Selector** | Select location | `Current System Balance` displays exact database value | Evaluates `stock_levels` |
| **Actual Counted Qty** | Enter physical count (e.g. `12`) | Live $\Delta$ Delta card reacts: green `+` for surplus, red `-` for shrinkage | Calculated live: `Counted - Balance` |
| **Counted Qty: Negative** | Enter `< 0` | Form validation blocks submit | Disallowed |
| **Reason Code Input** | Enter audit justification | Required field check (e.g. `Spillage / breakage write-off`) | Saved in `reference` |
| **Button: Confirm Adjustment**| Click submit button | Spinner $\to$ Toast `Adjustment Logged — Inventory reconciled to X (Δ +/-Y)` $\to$ Redirect to `/dashboard` | `POST /api/adjustments` $\to$ If $\Delta > 0$: `to_location_id` move. If $\Delta < 0$: `from_location_id` move $\to$ Trigger reconciles balance |

---

### 2.8 Screen 7: Master Audit Ledger (`/ledger`)

| UI Component | Interaction / Trigger | Expected Frontend Response | Database / Backend Action | QA Status |
| :--- | :--- | :--- | :--- | :--- |
| **Filter Tab: All** | Click tab | Displays all historical movements without type filter | `SELECT * FROM stock_moves` | **PASS** |
| **Filter Tab: Receipts** | Click tab | Filters view exclusively to `receipt` inbound moves | Filter: `doc_type = 'receipt'` | **PASS** |
| **Filter Tab: Deliveries** | Click tab | Filters view exclusively to `delivery` outbound moves | Filter: `doc_type = 'delivery'` | **PASS** |
| **Filter Tab: Transfers** | Click tab | Filters view exclusively to `transfer` internal moves | Filter: `doc_type = 'transfer'` | **PASS** |
| **Filter Tab: Adjustments** | Click tab | Filters view exclusively to `adjustment` cycle counts | Filter: `doc_type = 'adjustment'` | **PASS** |
| **Search Input** | Enter SKU or reference | Instantly filters matching table records | Substring search | **PASS** |
| **Button: Export CSV** | Click button | Generates and downloads `stocksense_ledger_[timestamp].csv` file | Client-side CSV blob download | **PASS** |
| **Live CDC Highlight** | Incoming move via WebSocket | Newly inserted row flashes with border highlight for 3 seconds | WebSocket event handler | **PASS** |

---

### 2.9 Screen 8: Operator Authentication & Ingress Portal (`/login`)

| UI Component | Interaction / Trigger | Expected Frontend Response | Database / Backend Action | QA Status |
| :--- | :--- | :--- | :--- | :--- |
| **Demo Credential Chips** | Click `Supervisor`, `Operator`, or `Auditor` chip | Instantly populates credentials, role clearance badge, and terminal ID | Local profile fast-fill | **PASS** |
| **Sign In Tab: Identifier & PIN**| Enter email/badge + PIN and submit | Shows authenticating spinner, receives signed JWT, redirects to `/dashboard` | `POST /api/auth/login` sets `stocksense_jwt` cookie | **PASS** |
| **Request Access Tab** | Enter name, badge ID, email, supervisor, role, and PIN | Grants terminal clearance, issues JWT session, redirects to `/dashboard` | `POST /api/auth/signup` + registers in Supabase Auth | **PASS** |
| **Barcode Scanner Simulation**| Click `Scan Barcode` | Simulates optical badge scan, auto-fills Senior Operator badge `OP-88219` | Client hardware handler | **PASS** |
| **NFC Tap Simulation** | Click `Tap NFC Badge` | Simulates NFC reader terminal, auto-fills and validates badge credentials | Client hardware handler | **PASS** |
| **Topbar Sign Out** | Click `Sign Out` icon button in Topbar | Clears JWT session & cookies, resets operator context, redirects to `/login` | `AuthProvider.logout()` | **PASS** |

---

## 3. Automated End-to-End Test Suite Execution Results

Automated execution via `scripts/qa-test-suite.mjs` against live running Next.js instance (`http://localhost:3000`) and Supabase PostgreSQL 15:

```text
================================================================
       StockSense Automated QA & Database Verification Suite      
================================================================

▶ [SECTION 1] Infrastructure & Health Checks
  ✅ PASS: Supabase credentials loaded from .env.local 
  ✅ PASS: Next.js API Server responding at localhost:3000 (Status 200)
  ✅ PASS: Supabase: Warehouses table reachable (2 warehouses found)
  ✅ PASS: Supabase: Locations table reachable (4 locations found)

▶ [SECTION 2] Product Catalog Management & Creation
  ✅ PASS: Create Product via Supabase (SKU: QA-TEST-7585, ID: 3372ec59-e860-4707-bd47-fc7c2087e7aa)
  ✅ PASS: Verify Product captured in Supabase (Name: Precision Hydraulic Bearing)
  ✅ PASS: Verify low_stock_threshold captured (Threshold: 8)

▶ [SECTION 3] Inbound Receipts (Receiving Stock)
  ✅ PASS: POST /api/receipts status 201 Created (Received 25 units)
  ✅ PASS: Supabase stock_moves: Record created with doc_type=receipt (Move ID: 6d7586f6-31d4-4968-8b94-0a5ed6be9fab)
  ✅ PASS: Supabase stock_moves: Correct quantity recorded (25 units)
  ✅ PASS: Supabase stock_moves: to_location_id matches destination 
  ✅ PASS: Supabase trigger: stock_levels incremented correctly (Current balance: 25)
  ✅ PASS: POST /api/receipts rejects negative quantity (Status: 400)

▶ [SECTION 4] Outbound Delivery (Dispatch & Predictive Low-Stock)
  ✅ PASS: POST /api/deliveries status 201 Created (Dispatched 20 units)
  ✅ PASS: Predictive Alert: lowStockTriggered is TRUE (Remaining: 5, Threshold: 8)
  ✅ PASS: Predictive Alert: Correct remaining calculation (5 units left)
  ✅ PASS: Supabase trigger: stock_levels decremented correctly (Current balance: 5)
  ✅ PASS: POST /api/deliveries rejects dispatch exceeding available stock (Status: 400)

▶ [SECTION 5] Internal Transfers (Location-to-Location)
  ✅ PASS: POST /api/transfers status 201 Created (Transferred 3 units)
  ✅ PASS: Supabase trigger: Source location decremented to 2 (Main Store: 2)
  ✅ PASS: Supabase trigger: Destination location incremented to 3 (Production Rack: 3)
  ✅ PASS: Conserved Inventory: Total quantity across warehouse invariant (Total: 5)
  ✅ PASS: POST /api/transfers rejects transfer to same location (Status: 400)

▶ [SECTION 6] Physical Inventory Adjustments (Cycle Counting)
  ✅ PASS: POST /api/adjustments surplus status 201 Created (Counted: 10)
  ✅ PASS: Audit Preview: Delta correctly calculated as +7 (Delta: +7)
  ✅ PASS: Audit Preview: Counted balance is 10 (Counted: 10)
  ✅ PASS: Supabase trigger: Reconciled count captured in stock_levels (Balance: 10)
  ✅ PASS: POST /api/adjustments shrinkage status 201 Created (Counted: 8)
  ✅ PASS: Audit Preview: Delta correctly calculated as -2 (Delta: -2)
  ✅ PASS: POST /api/adjustments handles zero delta gracefully (No adjustment needed. Recorded quantity matches physical count.)

▶ [SECTION 7] Master Audit Ledger Verification
  ✅ PASS: Supabase ledger: Complete immutable history captured (5 audit moves recorded for test item)
  ✅ PASS: Ledger contains Receipt entry 
  ✅ PASS: Ledger contains Delivery entry 
  ✅ PASS: Ledger contains Transfer entry 
  ✅ PASS: Ledger contains Adjustment entry 
  ✅ PASS: Ledger Foreign Key: product object joined correctly (Precision Hydraulic Bearing)
  ✅ PASS: Ledger Timestamp: created_at present (2026-09-26T06:21:39.120912+00:00)

▶ [SECTION 8] Operational Dashboard KPIs Endpoint
  ✅ PASS: GET /api/dashboard/kpis returns 200 OK 
  ✅ PASS: KPI: totalProducts is valid number (7 total SKUs)
  ✅ PASS: KPI: lowStockCount is valid number (2 items at/below threshold)
  ✅ PASS: KPI: pendingReceipts count present (0)
  ✅ PASS: KPI: pendingDeliveries count present (0)
  ✅ PASS: KPI: scheduledTransfers count present (0)

▶ [SECTION 9] Operator Authentication & JWT Token Verification
  ✅ PASS: POST /api/auth/login: Supervisor credentials accepted (200 OK)
  ✅ PASS: JWT Token generated with 3-part cryptographic signature (Token prefix: eyJhbGciOiJIUzI...)
  ✅ PASS: Role claim verified: supervisor (Priya Sharma (Supervisor))
  ✅ PASS: Badge clearance verified: SUP-01
  ✅ PASS: POST /api/auth/login: Physical Badge Code accepted (200 OK)
  ✅ PASS: Role claim verified: operator (Marcus Vance (Operator))
  ✅ PASS: POST /api/auth/login: Rejects invalid credentials with 401 Unauthorized
  ✅ PASS: POST /api/auth/signup: New operator registration succeeds (201 Created)
  ✅ PASS: Signup issues valid authenticated JWT token
  ✅ PASS: New operator profile correctly initialized

▶ [SECTION 10] Automated Test Artifacts Teardown
  ✅ PASS: Teardown: Cleaned up test stock_moves 
  ✅ PASS: Teardown: Cleaned up test stock_levels 
  ✅ PASS: Teardown: Cleaned up test product record 

================================================================
                       QA TEST RUN COMPLETE                     
================================================================
  Total Tests Run : 56
  Passed          : 56
  Failed          : 0
  Pass Rate       : 100.0%
================================================================
```

---

## 4. Manual Regression & Live Demo Checklist

For judge presentations or manual acceptance testing, run this 3-step live demo flow:

1. **Step 1: Check Current Balance**
   - Open `/products`. Notice `RAW-STL-001` (Steel Rods 12mm) has **15 kg** on hand (Threshold: 10 kg). Status is **Healthy Reserves**.
2. **Step 2: Trigger Predictive Low-Stock**
   - Navigate to `/deliveries/new`.
   - Select `RAW-STL-001`.
   - Select `Main Store — (15 available)`.
   - In `Quantity to Dispatch`, type `8`.
   - **Observe:** The red alert banner immediately renders: *"Predictive Low-Stock Alert: Validating this delivery will drop total stock from 15 to 7 kg, crossing the minimum safety threshold of 10 kg."*
   - Click `Validate Delivery Order`.
   - **Observe:** Yellow warning toast fires: *"⚠ Low Stock Triggered! Steel Rods 12mm dropped to 7 kg (Threshold: 10)"*.
3. **Step 3: Verify Ledger & Dashboard Realtime Sync**
   - Redirects to `/dashboard`. Notice:
     - `Low Stock Alert` KPI incremented from 1 to 2.
     - `Recent Movements` activity log contains the dispatch event at the top with a red `delivery` badge.
   - Navigate to `/ledger`.
   - The delivery is permanently inscribed in the immutable audit ledger with timestamp and user reference.

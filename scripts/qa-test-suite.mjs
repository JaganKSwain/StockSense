import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// 1. Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valParts] = trimmed.split('=');
      const val = valParts.join('=').trim().replace(/^["']|["']$/g, '');
      if (key && !process.env[key.trim()]) {
        process.env[key.trim()] = val;
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const API_BASE = 'http://localhost:3000';

const sb = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const results = [];

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${testName} ${details ? '(' + details + ')' : ''}`);
    results.push({ name: testName, status: 'PASS', details });
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${testName} ${details ? '(' + details + ')' : ''}`);
    results.push({ name: testName, status: 'FAIL', details });
  }
}

async function runTestSuite() {
  console.log('\n================================================================');
  console.log('       StockSense Automated QA & Database Verification Suite      ');
  console.log('================================================================\n');

  // --- SECTION 1: Infrastructure & Health ---
  console.log('▶ [SECTION 1] Infrastructure & Health Checks');
  assert(!!supabaseUrl && !!supabaseKey, 'Supabase credentials loaded from .env.local');

  try {
    const healthRes = await fetch(`${API_BASE}/api/dashboard/kpis`);
    assert(healthRes.status === 200, 'Next.js API Server responding at localhost:3000', `Status ${healthRes.status}`);
  } catch (e) {
    assert(false, 'Next.js API Server responding at localhost:3000', e.message);
  }

  const { data: dbWarehouses, error: whErr } = await sb.from('warehouses').select('*');
  assert(!whErr && dbWarehouses && dbWarehouses.length >= 1, 'Supabase: Warehouses table reachable', `${dbWarehouses?.length} warehouses found`);

  const { data: dbLocations, error: locErr } = await sb.from('locations').select('*');
  assert(!locErr && dbLocations && dbLocations.length >= 2, 'Supabase: Locations table reachable', `${dbLocations?.length} locations found`);

  const mainStoreLoc = dbLocations?.find(l => l.name === 'Main Store') || dbLocations?.[0];
  const prodRackLoc = dbLocations?.find(l => l.name === 'Production Rack') || dbLocations?.[1];

  // --- SECTION 2: Product Catalog & Insert ---
  console.log('\n▶ [SECTION 2] Product Catalog Management & Creation');
  const testSku = `QA-TEST-${Date.now().toString().slice(-4)}`;
  const testProductPayload = {
    sku: testSku,
    name: 'Precision Hydraulic Bearing',
    category: 'QA Mechanical',
    unit: 'pcs',
    low_stock_threshold: 8,
  };

  // 2.1 Insert product into Supabase (simulating Products UI 'New Product' modal)
  const { data: insertedProduct, error: prodInsertErr } = await sb
    .from('products')
    .insert(testProductPayload)
    .select()
    .single();

  assert(!prodInsertErr && !!insertedProduct?.id, 'Create Product via Supabase', `SKU: ${testSku}, ID: ${insertedProduct?.id}`);
  const testProductId = insertedProduct?.id;

  // 2.2 Verify product is immediately queryable
  const { data: queriedProduct } = await sb
    .from('products')
    .select('*')
    .eq('id', testProductId)
    .single();

  assert(queriedProduct?.sku === testSku, 'Verify Product captured in Supabase', `Name: ${queriedProduct?.name}`);
  assert(Number(queriedProduct?.low_stock_threshold) === 8, 'Verify low_stock_threshold captured', `Threshold: ${queriedProduct?.low_stock_threshold}`);

  // --- SECTION 3: Inbound Receipt (Stock Receiving) ---
  console.log('\n▶ [SECTION 3] Inbound Receipts (Receiving Stock)');
  const receiptQty = 25;
  const receiptRes = await fetch(`${API_BASE}/api/receipts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productId: testProductId,
      toLocationId: mainStoreLoc.id,
      quantity: receiptQty,
      reference: 'PO-QA-RECEIPT-001',
    }),
  });

  const receiptData = await receiptRes.json();
  assert(receiptRes.status === 201 && receiptData.success, 'POST /api/receipts status 201 Created', `Received ${receiptQty} units`);

  // 3.1 Verify Stock Move record captured in Supabase
  const { data: moveReceipt } = await sb
    .from('stock_moves')
    .select('*')
    .eq('id', receiptData.move?.id)
    .single();

  assert(moveReceipt?.doc_type === 'receipt', 'Supabase stock_moves: Record created with doc_type=receipt', `Move ID: ${moveReceipt?.id}`);
  assert(Number(moveReceipt?.quantity) === receiptQty, 'Supabase stock_moves: Correct quantity recorded', `${moveReceipt?.quantity} units`);
  assert(moveReceipt?.to_location_id === mainStoreLoc.id, 'Supabase stock_moves: to_location_id matches destination');

  // 3.2 Verify Postgres trigger atomic update on stock_levels
  const { data: slReceipt } = await sb
    .from('stock_levels')
    .select('*')
    .eq('product_id', testProductId)
    .eq('location_id', mainStoreLoc.id)
    .single();

  assert(Number(slReceipt?.quantity) === receiptQty, 'Supabase trigger: stock_levels incremented correctly', `Current balance: ${slReceipt?.quantity}`);

  // 3.3 Receipt validation error handling: quantity <= 0
  const badReceiptRes = await fetch(`${API_BASE}/api/receipts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productId: testProductId,
      toLocationId: mainStoreLoc.id,
      quantity: -5,
    }),
  });
  assert(badReceiptRes.status === 400, 'POST /api/receipts rejects negative quantity', `Status: ${badReceiptRes.status}`);

  // --- SECTION 4: Outbound Delivery (Dispatch & Low-Stock Alerts) ---
  console.log('\n▶ [SECTION 4] Outbound Delivery (Dispatch & Predictive Low-Stock)');
  // Total is 25, threshold is 8. Delivering 20 will leave 5 <= 8 -> must trigger predictive low-stock alert!
  const deliveryQty = 20;
  const deliveryRes = await fetch(`${API_BASE}/api/deliveries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productId: testProductId,
      fromLocationId: mainStoreLoc.id,
      quantity: deliveryQty,
      reference: 'SO-QA-DISPATCH-001',
    }),
  });

  const deliveryData = await deliveryRes.json();
  assert(deliveryRes.status === 201 && deliveryData.success, 'POST /api/deliveries status 201 Created', `Dispatched ${deliveryQty} units`);
  assert(deliveryData.lowStockTriggered === true, 'Predictive Alert: lowStockTriggered is TRUE', `Remaining: ${deliveryData.totalRemaining}, Threshold: ${deliveryData.threshold}`);
  assert(deliveryData.totalRemaining === 5, 'Predictive Alert: Correct remaining calculation', `5 units left`);

  // 4.1 Verify Supabase stock_levels decremented
  const { data: slDelivery } = await sb
    .from('stock_levels')
    .select('*')
    .eq('product_id', testProductId)
    .eq('location_id', mainStoreLoc.id)
    .single();

  assert(Number(slDelivery?.quantity) === 5, 'Supabase trigger: stock_levels decremented correctly', `Current balance: ${slDelivery?.quantity}`);

  // 4.2 Validation: Insufficient stock error handling
  const overDeliveryRes = await fetch(`${API_BASE}/api/deliveries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productId: testProductId,
      fromLocationId: mainStoreLoc.id,
      quantity: 50, // only 5 available!
    }),
  });
  assert(overDeliveryRes.status === 400, 'POST /api/deliveries rejects dispatch exceeding available stock', `Status: ${overDeliveryRes.status}`);

  // --- SECTION 5: Internal Location Transfers ---
  console.log('\n▶ [SECTION 5] Internal Transfers (Location-to-Location)');
  // Transfer 3 units from Main Store (currently 5) to Production Rack (currently 0)
  const transferQty = 3;
  const transferRes = await fetch(`${API_BASE}/api/transfers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productId: testProductId,
      fromLocationId: mainStoreLoc.id,
      toLocationId: prodRackLoc.id,
      quantity: transferQty,
      reference: 'TR-QA-INTERNAL-001',
    }),
  });

  const transferData = await transferRes.json();
  assert(transferRes.status === 201 && transferData.success, 'POST /api/transfers status 201 Created', `Transferred ${transferQty} units`);

  // 5.1 Verify Supabase stock_levels split
  const { data: slSource } = await sb
    .from('stock_levels')
    .select('*')
    .eq('product_id', testProductId)
    .eq('location_id', mainStoreLoc.id)
    .single();

  const { data: slDest } = await sb
    .from('stock_levels')
    .select('*')
    .eq('product_id', testProductId)
    .eq('location_id', prodRackLoc.id)
    .single();

  assert(Number(slSource?.quantity) === 2, 'Supabase trigger: Source location decremented to 2', `Main Store: ${slSource?.quantity}`);
  assert(Number(slDest?.quantity) === 3, 'Supabase trigger: Destination location incremented to 3', `Production Rack: ${slDest?.quantity}`);

  // Total product stock must remain 5!
  const totalStockAcrossLocations = Number(slSource?.quantity) + Number(slDest?.quantity);
  assert(totalStockAcrossLocations === 5, 'Conserved Inventory: Total quantity across warehouse invariant', `Total: ${totalStockAcrossLocations}`);

  // 5.2 Validation: Same location transfer rejected
  const sameLocRes = await fetch(`${API_BASE}/api/transfers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productId: testProductId,
      fromLocationId: mainStoreLoc.id,
      toLocationId: mainStoreLoc.id,
      quantity: 1,
    }),
  });
  assert(sameLocRes.status === 400, 'POST /api/transfers rejects transfer to same location', `Status: ${sameLocRes.status}`);

  // --- SECTION 6: Physical Inventory Adjustments ---
  console.log('\n▶ [SECTION 6] Physical Inventory Adjustments (Cycle Counting)');
  // Current count at Production Rack is 3. Physical audit finds 10 (Delta = +7)
  const countedQtyPositive = 10;
  const adjResPositive = await fetch(`${API_BASE}/api/adjustments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productId: testProductId,
      locationId: prodRackLoc.id,
      countedQuantity: countedQtyPositive,
      reason: 'Physical cycle count discovered surplus box',
    }),
  });

  const adjDataPositive = await adjResPositive.json();
  assert(adjResPositive.status === 201 && adjDataPositive.success, 'POST /api/adjustments surplus status 201 Created', `Counted: ${countedQtyPositive}`);
  assert(adjDataPositive.delta === 7, 'Audit Preview: Delta correctly calculated as +7', `Delta: +${adjDataPositive.delta}`);
  assert(adjDataPositive.countedQuantity === 10, 'Audit Preview: Counted balance is 10', `Counted: ${adjDataPositive.countedQuantity}`);

  // Verify Supabase updated
  const { data: slAdjPos } = await sb
    .from('stock_levels')
    .select('*')
    .eq('product_id', testProductId)
    .eq('location_id', prodRackLoc.id)
    .single();
  assert(Number(slAdjPos?.quantity) === 10, 'Supabase trigger: Reconciled count captured in stock_levels', `Balance: ${slAdjPos?.quantity}`);

  // Test Negative Adjustment: Physical audit finds 8 (Delta = -2)
  const countedQtyNegative = 8;
  const adjResNegative = await fetch(`${API_BASE}/api/adjustments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productId: testProductId,
      locationId: prodRackLoc.id,
      countedQuantity: countedQtyNegative,
      reason: 'Damaged bearing unit scrapped during QA',
    }),
  });

  const adjDataNegative = await adjResNegative.json();
  assert(adjResNegative.status === 201 && adjDataNegative.success, 'POST /api/adjustments shrinkage status 201 Created', `Counted: ${countedQtyNegative}`);
  assert(adjDataNegative.delta === -2, 'Audit Preview: Delta correctly calculated as -2', `Delta: ${adjDataNegative.delta}`);

  // Validation: Zero delta adjustment
  const adjZeroRes = await fetch(`${API_BASE}/api/adjustments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productId: testProductId,
      locationId: prodRackLoc.id,
      countedQuantity: 8, // same as current 8
      reason: 'Routine recount - balance verified',
    }),
  });
  const adjZeroData = await adjZeroRes.json();
  assert(adjZeroRes.status === 200 && adjZeroData.delta === 0, 'POST /api/adjustments handles zero delta gracefully', adjZeroData.message);

  // --- SECTION 7: Master Audit Ledger ---
  console.log('\n▶ [SECTION 7] Master Audit Ledger Verification');
  const { data: ledgerMoves, error: ldgErr } = await sb
    .from('stock_moves')
    .select('*, product:products(*), fromLocation:locations!from_location_id(*), toLocation:locations!to_location_id(*)')
    .eq('product_id', testProductId)
    .order('created_at', { ascending: false });

  assert(!ldgErr && ledgerMoves?.length >= 4, 'Supabase ledger: Complete immutable history captured', `${ledgerMoves?.length} audit moves recorded for test item`);

  const docTypes = ledgerMoves?.map(m => m.doc_type);
  assert(docTypes?.includes('receipt'), 'Ledger contains Receipt entry');
  assert(docTypes?.includes('delivery'), 'Ledger contains Delivery entry');
  assert(docTypes?.includes('transfer'), 'Ledger contains Transfer entry');
  assert(docTypes?.includes('adjustment'), 'Ledger contains Adjustment entry');

  // Verify foreign key relations populated cleanly
  const sampleMove = ledgerMoves?.[0];
  assert(!!sampleMove?.product?.name, 'Ledger Foreign Key: product object joined correctly', sampleMove?.product?.name);
  assert(!!sampleMove?.created_at, 'Ledger Timestamp: created_at present', sampleMove?.created_at);

  // --- SECTION 8: Real-Time Operational Dashboard KPIs ---
  console.log('\n▶ [SECTION 8] Operational Dashboard KPIs Endpoint');
  const kpiRes = await fetch(`${API_BASE}/api/dashboard/kpis`);
  const kpiData = await kpiRes.json();

  assert(kpiRes.status === 200, 'GET /api/dashboard/kpis returns 200 OK');
  assert(typeof kpiData.totalProducts === 'number' && kpiData.totalProducts >= 6, 'KPI: totalProducts is valid number', `${kpiData.totalProducts} total SKUs`);
  assert(typeof kpiData.lowStockCount === 'number' && kpiData.lowStockCount >= 1, 'KPI: lowStockCount is valid number', `${kpiData.lowStockCount} items at/below threshold`);
  assert(typeof kpiData.pendingReceipts === 'number', 'KPI: pendingReceipts count present', `${kpiData.pendingReceipts}`);
  assert(typeof kpiData.pendingDeliveries === 'number', 'KPI: pendingDeliveries count present', `${kpiData.pendingDeliveries}`);
  assert(typeof kpiData.scheduledTransfers === 'number', 'KPI: scheduledTransfers count present', `${kpiData.scheduledTransfers}`);

  // --- SECTION 9: JWT Authentication & Role Authorization ---
  console.log('\n▶ [SECTION 9] Operator Authentication & JWT Token Verification');
  
  // 9.1 Supervisor Login
  const supLoginRes = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'supervisor@stocksense.io',
      password: 'StockSense2026!',
    }),
  });
  const supLoginData = await supLoginRes.json();
  assert(supLoginRes.status === 200, 'POST /api/auth/login: Supervisor credentials accepted (200 OK)');
  assert(!!supLoginData.token && supLoginData.token.split('.').length === 3, 'JWT Token generated with 3-part cryptographic signature', `Token prefix: ${supLoginData.token?.slice(0, 15)}...`);
  assert(supLoginData.user?.role?.toLowerCase() === 'supervisor', 'Role claim verified: supervisor', `${supLoginData.user?.name} (${supLoginData.user?.role})`);
  assert(supLoginData.user?.badgeId === 'SUP-01', 'Badge clearance verified: SUP-01');

  // 9.2 Badge Login
  const badgeLoginRes = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'OP-88219',
      password: 'StockSense2026!',
    }),
  });
  const badgeLoginData = await badgeLoginRes.json();
  assert(badgeLoginRes.status === 200, 'POST /api/auth/login: Physical Badge Code accepted (200 OK)');
  assert(badgeLoginData.user?.role?.toLowerCase() === 'operator', 'Role claim verified: operator', `${badgeLoginData.user?.name} (${badgeLoginData.user?.role})`);

  // 9.3 Invalid Credentials Rejection
  const badLoginRes = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'supervisor@stocksense.io',
      password: 'WrongPassword999!',
    }),
  });
  assert(badLoginRes.status === 401, 'POST /api/auth/login: Rejects invalid credentials with 401 Unauthorized');

  // 9.4 Operator Signup & Ingress Provisioning
  const testOperatorEmail = `qa.op.${Date.now()}@stocksense.io`;
  const signupRes = await fetch(`${API_BASE}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'QA Test Field Operator',
      email: testOperatorEmail,
      badgeId: 'OP-QA99',
      role: 'Operator',
      warehouseName: 'Austin Central WH-01',
      password: 'StockSense2026!',
    }),
  });
  const signupData = await signupRes.json();
  assert([200, 201].includes(signupRes.status), 'POST /api/auth/signup: New operator registration succeeds (201 Created)');
  assert(!!signupData.token, 'Signup issues valid authenticated JWT token');
  assert(signupData.user?.email === testOperatorEmail, 'New operator profile correctly initialized');

  // --- SECTION 10: Database Cleanup ---
  console.log('\n▶ [SECTION 10] Automated Test Artifacts Teardown');
  // Clean up test moves
  const { error: delMovesErr } = await sb
    .from('stock_moves')
    .delete()
    .eq('product_id', testProductId);
  assert(!delMovesErr, 'Teardown: Cleaned up test stock_moves');

  // Clean up test stock_levels
  const { error: delLevelsErr } = await sb
    .from('stock_levels')
    .delete()
    .eq('product_id', testProductId);
  assert(!delLevelsErr, 'Teardown: Cleaned up test stock_levels');

  // Clean up test product
  const { error: delProdErr } = await sb
    .from('products')
    .delete()
    .eq('id', testProductId);
  assert(!delProdErr, 'Teardown: Cleaned up test product record');

  // --- SUMMARY ---
  console.log('\n================================================================');
  console.log(`                       QA TEST RUN COMPLETE                     `);
  console.log('================================================================');
  console.log(`  Total Tests Run : ${totalTests}`);
  console.log(`  Passed          : ${passedTests}`);
  console.log(`  Failed          : ${failedTests}`);
  console.log(`  Pass Rate       : ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal Test Runner Exception:', err);
  process.exit(1);
});

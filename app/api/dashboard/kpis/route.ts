import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createAdminClient();

    // 1. Fetch all products with thresholds
    const { data: products, error: pError } = await supabase
      .from('products')
      .select('id, low_stock_threshold');

    if (pError) throw pError;

    // 2. Fetch all stock levels
    const { data: levels, error: lError } = await supabase
      .from('stock_levels')
      .select('product_id, quantity');

    if (lError) throw lError;

    // Sum stock per product
    const stockMap: Record<string, number> = {};
    for (const lvl of levels || []) {
      stockMap[lvl.product_id] = (stockMap[lvl.product_id] || 0) + Number(lvl.quantity || 0);
    }

    let lowStockCount = 0;
    for (const prod of products || []) {
      const current = stockMap[prod.id] || 0;
      if (current <= (prod.low_stock_threshold || 10)) {
        lowStockCount++;
      }
    }

    // 3. Count pending documents
    const { data: pendingMoves, error: mError } = await supabase
      .from('stock_moves')
      .select('doc_type, status')
      .in('status', ['draft', 'waiting', 'ready']);

    if (mError) throw mError;

    let pendingReceipts = 0;
    let pendingDeliveries = 0;
    let scheduledTransfers = 0;

    for (const m of pendingMoves || []) {
      if (m.doc_type === 'receipt') pendingReceipts++;
      else if (m.doc_type === 'delivery') pendingDeliveries++;
      else if (m.doc_type === 'transfer') scheduledTransfers++;
    }

    return NextResponse.json({
      totalProducts: (products || []).length,
      lowStockCount,
      pendingReceipts,
      pendingDeliveries,
      scheduledTransfers,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch dashboard KPIs' }, { status: 500 });
  }
}

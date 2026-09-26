import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Execute all 3 queries concurrently in parallel
    const [
      { data: products, error: pError },
      { data: levels, error: lError },
      { data: pendingMoves, error: mError }
    ] = await Promise.all([
      supabase.from('products').select('id, low_stock_threshold'),
      supabase.from('stock_levels').select('product_id, quantity'),
      supabase.from('stock_moves').select('doc_type, status').in('status', ['draft', 'waiting', 'ready']),
    ]);

    if (pError) throw pError;
    if (lError) throw lError;
    if (mError) throw mError;

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

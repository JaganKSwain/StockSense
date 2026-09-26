import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';

const adjustmentSchema = z.object({
  productId: z.string().uuid(),
  locationId: z.string().uuid(),
  countedQuantity: z.coerce.number().min(0, 'Counted quantity cannot be negative'),
  reason: z.string().min(1, 'Reason or note is required for auditability'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = adjustmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { productId, locationId, countedQuantity, reason } = parsed.data;
    const supabase = createAdminClient();

    // Fetch current recorded quantity
    const { data: stockLevel } = await supabase
      .from('stock_levels')
      .select('quantity')
      .eq('product_id', productId)
      .eq('location_id', locationId)
      .single();

    const currentQty = Number(stockLevel?.quantity || 0);
    const delta = countedQuantity - currentQty;

    if (delta === 0) {
      return NextResponse.json({
        message: 'No adjustment needed. Recorded quantity matches physical count.',
        delta: 0,
      });
    }

    const isPositive = delta > 0;
    const quantityChange = Math.abs(delta);

    // If positive delta: to_location gets quantityChange
    // If negative delta: from_location loses quantityChange
    const { data: move, error } = await supabase
      .from('stock_moves')
      .insert({
        doc_type: 'adjustment',
        status: 'done',
        product_id: productId,
        from_location_id: isPositive ? null : locationId,
        to_location_id: isPositive ? locationId : null,
        quantity: quantityChange,
        reference: `Adj: ${reason} (Δ ${delta > 0 ? '+' : ''}${delta})`,
      })
      .select('*, product:products(*), fromLocation:locations!from_location_id(*), toLocation:locations!to_location_id(*)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      moveId: move.id,
      docType: 'adjustment',
      move,
      previousQuantity: currentQty,
      countedQuantity,
      delta,
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

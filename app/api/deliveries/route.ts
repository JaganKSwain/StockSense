import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';

const deliverySchema = z.object({
  productId: z.string().uuid(),
  fromLocationId: z.string().uuid(),
  quantity: z.coerce.number().positive('Quantity must be greater than zero'),
  reference: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = deliverySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { productId, fromLocationId, quantity, reference } = parsed.data;
    const supabase = createAdminClient();

    // 1. Check current stock level at source location
    const { data: stockLevel } = await supabase
      .from('stock_levels')
      .select('quantity')
      .eq('product_id', productId)
      .eq('location_id', fromLocationId)
      .single();

    const currentQty = Number(stockLevel?.quantity || 0);
    if (currentQty < quantity) {
      return NextResponse.json(
        { error: `Insufficient stock at source location (available: ${currentQty}, requested: ${quantity})` },
        { status: 400 }
      );
    }

    // 2. Insert stock move (delivery: to_location_id is null)
    const { data: move, error } = await supabase
      .from('stock_moves')
      .insert({
        doc_type: 'delivery',
        status: 'done',
        product_id: productId,
        from_location_id: fromLocationId,
        to_location_id: null,
        quantity,
        reference: reference || 'Delivery Order',
      })
      .select('*, product:products(*), fromLocation:locations!from_location_id(*)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 3. Compute if product crossed low_stock_threshold
    const { data: allLevels } = await supabase
      .from('stock_levels')
      .select('quantity')
      .eq('product_id', productId);

    const totalRemaining = (allLevels || []).reduce((sum, item) => sum + Number(item.quantity), 0);
    const threshold = Number(move.product?.low_stock_threshold || 10);
    const lowStockTriggered = totalRemaining <= threshold;

    return NextResponse.json({
      success: true,
      moveId: move.id,
      docType: 'delivery',
      move,
      totalRemaining,
      threshold,
      lowStockTriggered,
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

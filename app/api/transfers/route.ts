import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';

const transferSchema = z.object({
  productId: z.string().uuid(),
  fromLocationId: z.string().uuid(),
  toLocationId: z.string().uuid(),
  quantity: z.coerce.number().positive('Quantity must be greater than zero'),
  reference: z.string().optional(),
}).refine(data => data.fromLocationId !== data.toLocationId, {
  message: 'Source and destination locations cannot be the same',
  path: ['toLocationId'],
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = transferSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { productId, fromLocationId, toLocationId, quantity, reference } = parsed.data;
    const supabase = createAdminClient();

    // Check availability at source location
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

    // Insert transfer move (both from and to location specified)
    const { data: move, error } = await supabase
      .from('stock_moves')
      .insert({
        doc_type: 'transfer',
        status: 'done',
        product_id: productId,
        from_location_id: fromLocationId,
        to_location_id: toLocationId,
        quantity,
        reference: reference || 'Internal Transfer',
      })
      .select('*, product:products(*), fromLocation:locations(*), toLocation:locations(*)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      moveId: move.id,
      docType: 'transfer',
      move,
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

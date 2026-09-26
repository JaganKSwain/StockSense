import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';

const receiptSchema = z.object({
  productId: z.string().uuid(),
  toLocationId: z.string().uuid(),
  quantity: z.coerce.number().positive('Quantity must be greater than zero'),
  reference: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = receiptSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { productId, toLocationId, quantity, reference } = parsed.data;
    const supabase = createAdminClient();

    // Insert stock move (receipt: from_location_id is null)
    // The Postgres trigger automatically adjusts derived stock_levels!
    const { data: move, error } = await supabase
      .from('stock_moves')
      .insert({
        doc_type: 'receipt',
        status: 'done',
        product_id: productId,
        from_location_id: null,
        to_location_id: toLocationId,
        quantity,
        reference: reference || 'Receipt Entry',
      })
      .select('*, product:products(*), toLocation:locations(*)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      moveId: move.id,
      docType: 'receipt',
      move,
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

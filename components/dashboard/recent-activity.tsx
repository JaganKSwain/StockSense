'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRealtimeChannel } from '@/hooks/use-realtime-channel';
import type { StockMove } from '@/lib/types';
import Link from 'next/link';

export function RecentActivity() {
  const [moves, setMoves] = useState<StockMove[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecent = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('stock_moves')
        .select('*, product:products(*), fromLocation:locations!from_location_id(*), toLocation:locations!to_location_id(*)')
        .order('created_at', { ascending: false })
        .limit(6);

      if (!error && data) {
        const normalized = data.map((m: any) => ({
          ...m,
          docType: m.doc_type || m.docType,
          createdAt: m.created_at || m.createdAt,
          fromLocationId: m.from_location_id || m.fromLocationId,
          toLocationId: m.to_location_id || m.toLocationId,
          productId: m.product_id || m.productId,
        }));
        setMoves(normalized);
      }
    } catch (err) {
      console.warn('Failed to load recent moves:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecent();
  }, []);

  useRealtimeChannel('stock_moves', () => {
    fetchRecent();
  });

  const getDocTypeIcon = (type: string) => {
    switch (type) {
      case 'receipt':
        return { icon: 'input', color: 'text-[#45dfa4]', bg: 'bg-[#45dfa4]/10 border-[#45dfa4]/20' };
      case 'delivery':
        return { icon: 'local_shipping', color: 'text-[#ffb4ab]', bg: 'bg-[#93000a]/20 border-[#ffb4ab]/20' };
      case 'transfer':
        return { icon: 'sync_alt', color: 'text-[#22d3ee]', bg: 'bg-[#22d3ee]/10 border-[#22d3ee]/20' };
      case 'adjustment':
        return { icon: 'tune', color: 'text-[#ffd2d0]', bg: 'bg-[#ffaba8]/10 border-[#ffaba8]/20' };
      default:
        return { icon: 'swap_horiz', color: 'text-zinc-400', bg: 'bg-zinc-800 border-zinc-700' };
    }
  };

  return (
    <div className="flex flex-col bg-[#1c1b1c] rounded-xl border border-[#3c494c]/20 p-5 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-[#3c494c]/20">
        <div>
          <h3 className="font-semibold text-sm text-[#e5e2e3]">Live Stock Moves</h3>
          <p className="text-xs text-[#859397]">Real-time operational audit trail</p>
        </div>
        <Link
          href="/ledger"
          className="text-xs text-[#22d3ee] hover:underline font-mono"
        >
          View Ledger →
        </Link>
      </div>

      <div className="divide-y divide-[#3c494c]/20 mt-2">
        {loading && (
          <div className="py-8 text-center text-xs text-[#859397]">
            Connecting to real-time ledger...
          </div>
        )}

        {!loading && moves.length === 0 && (
          <div className="py-8 text-center text-xs text-[#859397]">
            No stock movements recorded yet.
          </div>
        )}

        {moves.map((move) => {
          const style = getDocTypeIcon(move.docType);
          const isPositive = move.docType === 'receipt' || (move.docType === 'adjustment' && move.toLocationId);
          const qtyPrefix = isPositive ? '+' : '-';

          return (
            <div
              key={move.id}
              className="py-3 flex items-center justify-between gap-3 hover:bg-[#201f20]/50 transition-colors px-1 rounded-md"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${style.bg} ${style.color}`}
                >
                  <span className="material-symbols-outlined text-[17px]">
                    {style.icon}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-[#e5e2e3] font-medium truncate">
                      {move.product?.name || 'Item'}
                    </span>
                    <span className="font-mono text-[10px] text-[#859397]">
                      {move.product?.sku}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#859397] truncate">
                    {move.reference || move.docType}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div
                  className={`font-mono text-xs font-semibold ${
                    isPositive ? 'text-[#45dfa4]' : 'text-[#ffb4ab]'
                  }`}
                >
                  {qtyPrefix}
                  {move.quantity} {move.product?.unit || 'u'}
                </div>
                <div className="font-mono text-[10px] text-[#859397]">
                  {new Date(move.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import type { Product, StockLevel, StockMove } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

interface ProductDetailSheetProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductDetailSheet({ product, isOpen, onClose }: ProductDetailSheetProps) {
  const [levels, setLevels] = useState<StockLevel[]>([]);
  const [moves, setMoves] = useState<StockMove[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!product || !isOpen) return;

    setLoading(true);
    const supabase = createClient();

    // Fetch location stock breakdown
    const fetchDetails = async () => {
      try {
        const { data: levelData } = await supabase
          .from('stock_levels')
          .select('*, location:locations(*)')
          .eq('product_id', product.id);

        const { data: moveData } = await supabase
          .from('stock_moves')
          .select('*, fromLocation:locations!from_location_id(*), toLocation:locations!to_location_id(*)')
          .eq('product_id', product.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (levelData) {
          setLevels(levelData.map((lvl: any) => ({
            ...lvl,
            locationId: lvl.location_id || lvl.locationId,
            productId: lvl.product_id || lvl.productId,
            quantity: Number(lvl.quantity),
          })));
        }
        if (moveData) {
          setMoves(moveData.map((m: any) => ({
            ...m,
            docType: m.doc_type || m.docType,
            createdAt: m.created_at || m.createdAt,
            fromLocationId: m.from_location_id || m.fromLocationId,
            toLocationId: m.to_location_id || m.toLocationId,
            productId: m.product_id || m.productId,
          })));
        }
      } catch (err) {
        console.error('Error fetching product details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const totalStock = levels.reduce((sum, l) => sum + Number(l.quantity), 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-xl bg-[#131314] border-l border-[#3c494c]/30 h-full p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-[#3c494c]/20">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#201f20] text-[#22d3ee] border border-[#3c494c]/30">
                  {product.sku}
                </span>
                <span className="text-xs text-[#859397]">{product.category || 'General'}</span>
              </div>
              <h2 className="text-xl font-semibold text-[#e5e2e3] mt-1">{product.name}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#859397] hover:text-[#e5e2e3] hover:bg-[#201f20] transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3.5 bg-[#1c1b1c] rounded-xl border border-[#3c494c]/20">
              <span className="text-xs text-[#859397] uppercase font-mono">Total Recorded Stock</span>
              <div className="text-2xl font-mono font-semibold text-[#e5e2e3] mt-1">
                {totalStock} <span className="text-xs font-normal text-[#859397]">{product.unit}</span>
              </div>
            </div>
            <div className="p-3.5 bg-[#1c1b1c] rounded-xl border border-[#3c494c]/20">
              <span className="text-xs text-[#859397] uppercase font-mono">Safety Threshold</span>
              <div className="text-2xl font-mono font-semibold text-[#ffd2d0] mt-1">
                {product.lowStockThreshold} <span className="text-xs font-normal text-[#859397]">{product.unit}</span>
              </div>
            </div>
          </div>

          {/* Per-Location Stock Distribution */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#859397]">
              Per-Location Physical Distribution
            </h3>

            {loading ? (
              <div className="py-6 text-center text-xs text-[#859397]">Loading location split...</div>
            ) : levels.length === 0 ? (
              <div className="py-4 text-xs text-[#859397] bg-[#1c1b1c] p-3 rounded-lg border border-[#3c494c]/20">
                No location inventory recorded yet.
              </div>
            ) : (
              <div className="space-y-2">
                {levels.map((lvl) => (
                  <div
                    key={lvl.locationId}
                    className="p-3 bg-[#1c1b1c] rounded-lg border border-[#3c494c]/20 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[18px] text-[#22d3ee]">
                        warehouse
                      </span>
                      <div>
                        <div className="text-sm font-medium text-[#e5e2e3]">
                          {lvl.location?.name || 'Storage Location'}
                        </div>
                        <div className="text-[11px] text-[#859397]">WH-01 Active Bin</div>
                      </div>
                    </div>
                    <div className="font-mono text-sm font-semibold text-[#45dfa4]">
                      {lvl.quantity} {product.unit}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Movement History */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#859397]">
              Recent Audit Moves ({moves.length})
            </h3>
            <div className="divide-y divide-[#3c494c]/20 border border-[#3c494c]/20 rounded-xl bg-[#1c1b1c] overflow-hidden">
              {moves.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#859397]">
                  No ledger history for this item.
                </div>
              ) : (
                moves.map((m) => {
                  const isPositive = m.docType === 'receipt' || (m.docType === 'adjustment' && m.toLocationId);
                  return (
                    <div key={m.id} className="p-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono text-[#bbc9cd] uppercase font-medium">
                          {m.docType}
                        </span>
                        <p className="text-[11px] text-[#859397]">{m.reference || 'Stock Move'}</p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`font-mono font-semibold ${
                            isPositive ? 'text-[#45dfa4]' : 'text-[#ffb4ab]'
                          }`}
                        >
                          {isPositive ? '+' : '-'}
                          {m.quantity} {product.unit}
                        </span>
                        <div className="font-mono text-[10px] text-[#859397]">
                          {new Date(m.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-[#3c494c]/20 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#201f20] hover:bg-[#2a2a2b] text-xs font-medium text-[#e5e2e3] transition-colors"
          >
            Close Sheet
          </button>
        </div>
      </div>
    </div>
  );
}

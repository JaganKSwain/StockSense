'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { createClient } from '@/lib/supabase/client';
import type { Product, Location, StockLevel } from '@/lib/types';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useRealtimeChannel } from '@/hooks/use-realtime-channel';

export default function NewAdjustmentPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [levels, setLevels] = useState<StockLevel[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [countedQty, setCountedQty] = useState<number | ''>('');
  const [reason, setReason] = useState('Damaged in transit');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = React.useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: pData } = await supabase.from('products').select('*').order('name');
      const { data: lData } = await supabase.from('locations').select('*').order('name');
      const { data: slData } = await supabase.from('stock_levels').select('*');

      if (pData && pData.length > 0) {
        setProducts(pData as any);
        setSelectedProductId((prev) => prev || pData[0].id);
      }
      if (lData && lData.length > 0) {
        setLocations(lData as any);
        setSelectedLocationId((prev) => prev || lData[0].id);
      }
      if (slData) {
        const normalizedLevels = slData.map((l: any) => ({
          productId: l.product_id || l.productId,
          locationId: l.location_id || l.locationId,
          quantity: Number(l.quantity),
        }));
        setLevels(normalizedLevels);
      }
    } catch (err) {
      console.error('Error loading adjustment dependencies:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useRealtimeChannel('stock_levels', loadData);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Current recorded quantity in selected location
  const currentRecordedQty = levels.find(
    (l) => l.productId === selectedProductId && l.locationId === selectedLocationId
  )?.quantity || 0;

  const numCounted = typeof countedQty === 'number' ? countedQty : currentRecordedQty;
  const delta = numCounted - currentRecordedQty;
  const hasDelta = typeof countedQty === 'number' && delta !== 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !selectedLocationId || countedQty === '' || Number(countedQty) < 0) {
      toast.error('Please enter a valid non-negative physical count');
      return;
    }

    if (!reason.trim()) {
      toast.error('Please provide a reason code for auditability');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProductId,
          locationId: selectedLocationId,
          countedQuantity: Number(countedQty),
          reason: reason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to validate adjustment');

      toast.success(
        `Adjustment Logged — Inventory reconciled to ${countedQty} ${selectedProduct?.unit || 'units'} (Δ ${
          delta > 0 ? '+' : ''
        }${delta})`
      );

      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Validation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0e0f] text-[#e5e2e3]">
      <Sidebar />
      <div className="pl-64">
        <Topbar breadcrumbs={[{ label: 'Adjustments', href: '/dashboard' }, { label: 'Stock Adjustment' }]} />

        <main className="pt-14 px-8 py-8 w-full min-h-screen flex justify-center">
          <div className="max-w-2xl w-full space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#859397]">
                <span>Operations</span>
                <span>/</span>
                <span className="text-[#ffd2d0]">Reconciliation</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <h1 className="text-2xl font-semibold text-[#e5e2e3] tracking-tight">Stock Adjustment</h1>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#201f20] border border-[#3c494c]/30 font-mono text-xs text-[#ffd2d0]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ffd2d0] animate-pulse"></span>
                  <span>Physical Audit</span>
                </div>
              </div>
              <p className="text-xs text-[#859397] mt-0.5">
                Reconcile disparities between system-recorded stock and physical floor counts with full audit reasons.
              </p>
            </div>

            {/* Form Card */}
            <div className="bg-[#1c1b1c] rounded-xl border border-[#3c494c]/30 shadow-2xl overflow-hidden">
              <div className="h-1 w-full bg-gradient-to-r from-[#ffd2d0] via-[#ffaba8] to-[#22d3ee]"></div>

              <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
                {/* Product Selection */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#e5e2e3]">
                    Product to Reconcile <span className="text-[#22d3ee]">*</span>
                  </label>
                  <select
                    disabled={loading}
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full bg-[#131314] text-xs font-mono text-[#e5e2e3] rounded-lg border border-[#3c494c]/40 p-2.5 focus:border-[#22d3ee] focus:outline-none"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.sku} — {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location Selection */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#e5e2e3]">
                    Physical Location / Bay <span className="text-[#22d3ee]">*</span>
                  </label>
                  <select
                    disabled={loading}
                    value={selectedLocationId}
                    onChange={(e) => setSelectedLocationId(e.target.value)}
                    className="w-full bg-[#131314] text-xs font-mono text-[#e5e2e3] rounded-lg border border-[#3c494c]/40 p-2.5 focus:border-[#22d3ee] focus:outline-none"
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Audit Comparison Panel */}
                <div className="p-4 bg-[#131314] rounded-xl border border-[#3c494c]/30 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Recorded Stock */}
                    <div className="p-3 bg-[#1c1b1c] rounded-lg border border-[#3c494c]/20">
                      <span className="text-[11px] font-mono text-[#859397] uppercase">
                        Current System Balance
                      </span>
                      <div className="text-xl font-mono font-semibold text-[#e5e2e3] mt-1">
                        {currentRecordedQty} <span className="text-xs text-[#859397] font-normal">{selectedProduct?.unit || 'u'}</span>
                      </div>
                    </div>

                    {/* Physical Count Input */}
                    <div className="p-3 bg-[#1c1b1c] rounded-lg border border-[#22d3ee]/40">
                      <span className="text-[11px] font-mono text-[#22d3ee] uppercase">
                        Actual Counted Qty *
                      </span>
                      <input
                        type="number"
                        min="0"
                        required
                        placeholder={String(currentRecordedQty)}
                        value={countedQty}
                        onChange={(e) => setCountedQty(e.target.value ? Number(e.target.value) : '')}
                        className="w-full bg-transparent text-xl font-mono font-semibold text-white mt-1 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Computed Delta Indicator */}
                  {countedQty !== '' && (
                    <div
                      className={`p-3 rounded-lg border flex items-center justify-between font-mono text-xs ${
                        delta < 0
                          ? 'bg-[#93000a]/20 border-[#ffb4ab]/40 text-[#ffb4ab]'
                          : delta > 0
                          ? 'bg-[#003825]/40 border-[#45dfa4]/40 text-[#45dfa4]'
                          : 'bg-[#201f20] border-[#3c494c]/30 text-[#859397]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">
                          {delta < 0 ? 'trending_down' : delta > 0 ? 'trending_up' : 'check'}
                        </span>
                        <span>
                          {delta < 0
                            ? 'Deficit adjustment'
                            : delta > 0
                            ? 'Surplus adjustment'
                            : 'Exact match (zero change)'}
                        </span>
                      </div>
                      <span className="text-sm font-semibold">
                        Δ {delta > 0 ? '+' : ''}
                        {delta} {selectedProduct?.unit}
                      </span>
                    </div>
                  )}
                </div>

                {/* Reason Code */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#e5e2e3]">
                    Reason / Audit Code <span className="text-[#22d3ee]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 3 kg damaged during unloading"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-[#131314] text-xs text-[#e5e2e3] rounded-lg border border-[#3c494c]/40 p-2.5 focus:border-[#22d3ee] focus:outline-none"
                  />
                  <div className="flex gap-2 pt-1">
                    {['Damaged in transit', 'Floor count mismatch', 'Spoilage / Expired', 'Routine audit'].map(
                      (preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setReason(preset)}
                          className="px-2 py-0.5 rounded bg-[#201f20] hover:bg-[#2a2a2b] text-[10px] text-[#859397] hover:text-[#e5e2e3] border border-[#3c494c]/20"
                        >
                          {preset}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-[#3c494c]/20 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-4 py-2 rounded-lg bg-[#201f20] hover:bg-[#2a2a2b] text-xs text-[#e5e2e3] font-medium transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting || loading || countedQty === ''}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#ffd2d0] hover:bg-[#ffaba8] text-[#410006] font-semibold text-xs transition-all shadow-md disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[16px]">tune</span>
                    <span>{submitting ? 'Applying Adjustment...' : 'Validate Adjustment'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { createClient } from '@/lib/supabase/client';
import type { Product, Location, StockLevel } from '@/lib/types';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useRealtimeChannel } from '@/hooks/use-realtime-channel';

export default function NewDeliveryPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [levels, setLevels] = useState<StockLevel[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [reference, setReference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = React.useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: pData } = await supabase.from('products').select('*').order('name');
      const { data: lData } = await supabase.from('locations').select('*').order('name');
      const { data: slData } = await supabase.from('stock_levels').select('*');

      if (pData && pData.length > 0) {
        const normalized = pData.map((p: any) => ({
          ...p,
          lowStockThreshold: Number(p.low_stock_threshold ?? p.lowStockThreshold ?? 10),
        }));
        setProducts(normalized);
        setSelectedProductId((prev) => prev || normalized[0].id);
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
      console.error('Error loading delivery dependencies:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Re-fetch automatically when inventory changes in real-time
  useRealtimeChannel('stock_levels', loadData);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Available stock at selected location
  const sourceStock = levels.find(
    (l) => l.productId === selectedProductId && l.locationId === selectedLocationId
  )?.quantity || 0;

  // Total stock across all locations for this product
  const totalProductStock = levels
    .filter((l) => l.productId === selectedProductId)
    .reduce((sum, l) => sum + Number(l.quantity), 0);

  const numQty = typeof quantity === 'number' ? quantity : 0;
  const remainingAfter = totalProductStock - numQty;
  const threshold = selectedProduct?.lowStockThreshold || 10;
  const willTriggerLowStock = numQty > 0 && remainingAfter <= threshold;
  const hasInsufficientStock = numQty > sourceStock;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !selectedLocationId || !quantity || Number(quantity) <= 0) {
      toast.error('Please complete all required fields with a valid positive quantity');
      return;
    }

    if (hasInsufficientStock) {
      toast.error(`Cannot deliver ${quantity} units: Only ${sourceStock} available at this location`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProductId,
          fromLocationId: selectedLocationId,
          quantity: Number(quantity),
          reference: reference.trim() || 'Sales Order Outbound',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to validate delivery');

      if (data.lowStockTriggered) {
        toast.warning(
          `⚠ Low Stock Triggered! ${selectedProduct?.name} dropped to ${data.totalRemaining} units (Threshold: ${data.threshold})`
        );
      } else {
        toast.success(
          `Delivery Validated — Dispatched ${quantity} ${selectedProduct?.unit || 'units'}`
        );
      }

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
        <Topbar breadcrumbs={[{ label: 'Deliveries', href: '/dashboard' }, { label: 'New Delivery Order' }]} />

        <main className="pt-14 px-8 py-8 w-full min-h-screen flex justify-center">
          <div className="max-w-2xl w-full space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#859397]">
                <span>Operations</span>
                <span>/</span>
                <span className="text-[#ffd2d0]">Outbound Dispatch</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <h1 className="text-2xl font-semibold text-[#e5e2e3] tracking-tight">New Delivery Order</h1>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#201f20] border border-[#3c494c]/30 font-mono text-xs text-[#ffd2d0]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ffd2d0] animate-pulse"></span>
                  <span>Pick & Dispatch</span>
                </div>
              </div>
              <p className="text-xs text-[#859397] mt-0.5">
                Record stock leaving the warehouse for customer fulfillment with predictive low-stock checking.
              </p>
            </div>

            {/* Form Card */}
            <div className="bg-[#1c1b1c] rounded-xl border border-[#3c494c]/30 shadow-2xl overflow-hidden">
              <div className="h-1 w-full bg-gradient-to-r from-[#ffd2d0] to-[#ffaba8]"></div>

              <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
                {/* Field 1: Product Selection */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#e5e2e3]">
                    Product / SKU <span className="text-[#22d3ee]">*</span>
                  </label>
                  <select
                    disabled={loading}
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full bg-[#131314] text-xs font-mono text-[#e5e2e3] rounded-lg border border-[#3c494c]/40 p-2.5 focus:border-[#22d3ee] focus:outline-none"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.sku} — {p.name} (Threshold: {p.lowStockThreshold} {p.unit})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Field 2: Source Location */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-[#e5e2e3]">
                      Source Pick Location <span className="text-[#22d3ee]">*</span>
                    </label>
                    <span className="text-[11px] font-mono text-[#bbc9cd]">
                      On hand here: <strong className="text-[#45dfa4]">{sourceStock} {selectedProduct?.unit || 'u'}</strong>
                    </span>
                  </div>
                  <select
                    disabled={loading}
                    value={selectedLocationId}
                    onChange={(e) => setSelectedLocationId(e.target.value)}
                    className="w-full bg-[#131314] text-xs font-mono text-[#e5e2e3] rounded-lg border border-[#3c494c]/40 p-2.5 focus:border-[#22d3ee] focus:outline-none"
                  >
                    {locations.map((loc) => {
                      const qty = levels.find(
                        (l) => l.productId === selectedProductId && l.locationId === loc.id
                      )?.quantity || 0;
                      return (
                        <option key={loc.id} value={loc.id}>
                          {loc.name} — ({qty} available)
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Field 3: Quantity */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#e5e2e3]">
                    Quantity to Dispatch <span className="text-[#22d3ee]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max={sourceStock}
                      required
                      placeholder="e.g. 8"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : '')}
                      className={`w-full bg-[#131314] text-sm font-mono text-[#e5e2e3] rounded-lg border p-2.5 pr-14 focus:outline-none ${
                        hasInsufficientStock
                          ? 'border-[#ffb4ab] text-[#ffb4ab]'
                          : 'border-[#3c494c]/40 focus:border-[#22d3ee]'
                      }`}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-[#859397]">
                      {selectedProduct?.unit || 'units'}
                    </div>
                  </div>
                </div>

                {/* Predictive Low Stock Alert Banner */}
                {willTriggerLowStock && !hasInsufficientStock && (
                  <div className="p-3.5 bg-[#93000a]/20 border border-[#ffb4ab]/40 rounded-lg flex items-start gap-3 animate-in fade-in duration-200">
                    <span className="material-symbols-outlined text-[#ffb4ab] text-[20px] shrink-0 mt-0.5">
                      warning
                    </span>
                    <div className="text-xs space-y-0.5">
                      <p className="font-semibold text-[#ffb4ab]">
                        Predictive Low-Stock Alert
                      </p>
                      <p className="text-[#e5e2e3]">
                        Validating this delivery will drop total stock from{' '}
                        <strong className="font-mono">{totalProductStock}</strong> to{' '}
                        <strong className="font-mono text-[#ffb4ab]">{remainingAfter} {selectedProduct?.unit}</strong>,
                        crossing the minimum safety threshold of{' '}
                        <strong className="font-mono">{threshold} {selectedProduct?.unit}</strong>.
                      </p>
                    </div>
                  </div>
                )}

                {hasInsufficientStock && (
                  <div className="p-3 bg-red-950/40 border border-red-800/40 rounded-lg text-xs text-red-400">
                    Cannot fulfill: Requested quantity exceeds available bin inventory ({sourceStock} available).
                  </div>
                )}

                {/* Field 4: Sales Order Reference */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#e5e2e3]">
                    Sales Order / Customer Manifest
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SO#2291 — Delta Corp"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full bg-[#131314] text-xs text-[#e5e2e3] rounded-lg border border-[#3c494c]/40 p-2.5 focus:border-[#22d3ee] focus:outline-none"
                  />
                </div>

                {/* Action Buttons */}
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
                    disabled={submitting || loading || hasInsufficientStock}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#ffd2d0] hover:bg-[#ffaba8] text-[#410006] font-semibold text-xs transition-all shadow-md disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                    <span>{submitting ? 'Validating Delivery...' : 'Validate Delivery Order'}</span>
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

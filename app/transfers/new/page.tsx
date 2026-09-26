'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { createClient } from '@/lib/supabase/client';
import type { Product, Location, StockLevel } from '@/lib/types';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function NewTransferPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [levels, setLevels] = useState<StockLevel[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [fromLocationId, setFromLocationId] = useState('');
  const [toLocationId, setToLocationId] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [reference, setReference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient();
        const { data: pData } = await supabase.from('products').select('*').order('name');
        const { data: lData } = await supabase.from('locations').select('*').order('name');
        const { data: slData } = await supabase.from('stock_levels').select('*');

        if (pData && pData.length > 0) {
          setProducts(pData as any);
          setSelectedProductId(pData[0].id);
        }
        if (lData && lData.length >= 2) {
          setLocations(lData as any);
          setFromLocationId(lData[0].id);
          setToLocationId(lData[1].id);
        } else if (lData && lData.length === 1) {
          setLocations(lData as any);
          setFromLocationId(lData[0].id);
        }
        if (slData) {
          setLevels(slData as any);
        }
      } catch (err) {
        console.error('Error loading transfer dependencies:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Available stock at source
  const sourceStock = levels.find(
    (l) => l.productId === selectedProductId && l.locationId === fromLocationId
  )?.quantity || 0;

  const numQty = typeof quantity === 'number' ? quantity : 0;
  const hasInsufficientStock = numQty > sourceStock;
  const isSameLocation = fromLocationId && toLocationId && fromLocationId === toLocationId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !fromLocationId || !toLocationId || !quantity || Number(quantity) <= 0) {
      toast.error('Please complete all fields with a valid positive quantity');
      return;
    }

    if (isSameLocation) {
      toast.error('Source and destination locations cannot be the same');
      return;
    }

    if (hasInsufficientStock) {
      toast.error(`Cannot transfer: Only ${sourceStock} available at source location`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProductId,
          fromLocationId,
          toLocationId,
          quantity: Number(quantity),
          reference: reference.trim() || 'Internal Relocation',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to validate transfer');

      toast.success(
        `Transfer Validated — Relocated ${quantity} ${selectedProduct?.unit || 'units'}! Total inventory balance unchanged.`
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
        <Topbar breadcrumbs={[{ label: 'Transfers', href: '/dashboard' }, { label: 'Internal Transfer' }]} />

        <main className="pt-14 px-8 py-8 w-full min-h-screen flex justify-center">
          <div className="max-w-2xl w-full space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#859397]">
                <span>Operations</span>
                <span>/</span>
                <span className="text-[#22d3ee]">Inter-Bay Routing</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <h1 className="text-2xl font-semibold text-[#e5e2e3] tracking-tight">New Internal Transfer</h1>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#201f20] border border-[#3c494c]/30 font-mono text-xs text-[#22d3ee]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22d3ee] animate-pulse"></span>
                  <span>Zero Net Delta</span>
                </div>
              </div>
              <p className="text-xs text-[#859397] mt-0.5">
                Relocate inventory between warehouse zones or racks without altering overall company inventory.
              </p>
            </div>

            {/* Form Card */}
            <div className="bg-[#1c1b1c] rounded-xl border border-[#3c494c]/30 shadow-2xl overflow-hidden">
              <div className="h-1 w-full bg-gradient-to-r from-[#22d3ee] via-[#68fcbf] to-[#22d3ee]"></div>

              <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
                {/* Product Selection */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#e5e2e3]">
                    Product to Relocate <span className="text-[#22d3ee]">*</span>
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

                {/* Connected Location Row */}
                <div className="p-4 bg-[#131314] rounded-xl border border-[#3c494c]/30 space-y-3">
                  <span className="text-[11px] font-mono text-[#859397] uppercase">
                    Routing Vector
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-9 gap-2 items-center">
                    {/* From Location */}
                    <div className="md:col-span-4 space-y-1">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-[#859397]">From Location</span>
                        <span className="text-[#45dfa4] font-mono">({sourceStock} {selectedProduct?.unit || 'u'})</span>
                      </div>
                      <select
                        disabled={loading}
                        value={fromLocationId}
                        onChange={(e) => setFromLocationId(e.target.value)}
                        className="w-full bg-[#1c1b1c] text-xs font-mono text-[#e5e2e3] rounded-lg border border-[#3c494c]/40 p-2 focus:border-[#22d3ee] focus:outline-none"
                      >
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Arrow Icon */}
                    <div className="md:col-span-1 flex justify-center text-[#22d3ee]">
                      <span className="material-symbols-outlined text-[20px]">
                        arrow_forward
                      </span>
                    </div>

                    {/* To Location */}
                    <div className="md:col-span-4 space-y-1">
                      <span className="text-[11px] text-[#859397]">To Location</span>
                      <select
                        disabled={loading}
                        value={toLocationId}
                        onChange={(e) => setToLocationId(e.target.value)}
                        className={`w-full bg-[#1c1b1c] text-xs font-mono text-[#e5e2e3] rounded-lg border p-2 focus:outline-none ${
                          isSameLocation ? 'border-[#ffb4ab]' : 'border-[#3c494c]/40 focus:border-[#22d3ee]'
                        }`}
                      >
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {isSameLocation && (
                    <p className="text-[11px] text-[#ffb4ab] pt-1">
                      Source and destination must be different bins.
                    </p>
                  )}
                </div>

                {/* Quantity */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#e5e2e3]">
                    Quantity to Transfer <span className="text-[#22d3ee]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max={sourceStock}
                      required
                      placeholder="e.g. 20"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : '')}
                      className="w-full bg-[#131314] text-sm font-mono text-[#e5e2e3] rounded-lg border border-[#3c494c]/40 p-2.5 pr-14 focus:border-[#22d3ee] focus:outline-none"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-[#859397]">
                      {selectedProduct?.unit || 'units'}
                    </div>
                  </div>
                </div>

                {/* Reference */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#e5e2e3]">
                    Transfer Memo / Reason
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Replenish Production Line"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full bg-[#131314] text-xs text-[#e5e2e3] rounded-lg border border-[#3c494c]/40 p-2.5 focus:border-[#22d3ee] focus:outline-none"
                  />
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
                    disabled={submitting || loading || hasInsufficientStock || !!isSameLocation}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#22d3ee] hover:bg-[#8aebff] text-[#00363e] font-semibold text-xs transition-all shadow-md disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[16px]">sync_alt</span>
                    <span>{submitting ? 'Executing Transfer...' : 'Validate Transfer'}</span>
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

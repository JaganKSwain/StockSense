'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { createClient } from '@/lib/supabase/client';
import type { Product, Location } from '@/lib/types';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function NewReceiptPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
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

        if (pData && pData.length > 0) {
          setProducts(pData as any);
          setSelectedProductId(pData[0].id);
        }
        if (lData && lData.length > 0) {
          setLocations(lData as any);
          setSelectedLocationId(lData[0].id);
        }
      } catch (err) {
        console.error('Error loading receipt dependencies:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !selectedLocationId || !quantity || Number(quantity) <= 0) {
      toast.error('Please complete all required fields with a valid positive quantity');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProductId,
          toLocationId: selectedLocationId,
          quantity: Number(quantity),
          reference: reference.trim() || 'Vendor Inbound PO',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to validate receipt');

      toast.success(
        `Receipt Validated — Added ${quantity} ${selectedProduct?.unit || 'units'} of ${selectedProduct?.name} to inventory!`
      );

      // Redirect to dashboard to witness live KPI update
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
        <Topbar breadcrumbs={[{ label: 'Receipts', href: '/dashboard' }, { label: 'New Receipt' }]} />

        <main className="pt-14 px-8 py-8 w-full min-h-screen flex justify-center">
          <div className="max-w-2xl w-full space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#859397]">
                <span>Operations</span>
                <span>/</span>
                <span className="text-[#22d3ee]">Inbound Intake</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <h1 className="text-2xl font-semibold text-[#e5e2e3] tracking-tight">New Receipt</h1>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#201f20] border border-[#3c494c]/30 font-mono text-xs text-[#22d3ee]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22d3ee] animate-pulse"></span>
                  <span>Inbound PO</span>
                </div>
              </div>
              <p className="text-xs text-[#859397] mt-0.5">
                Log incoming stock from vendor or supply chain directly into warehouse storage.
              </p>
            </div>

            {/* Form Card */}
            <div className="bg-[#1c1b1c] rounded-xl border border-[#3c494c]/30 shadow-2xl overflow-hidden">
              <div className="h-1 w-full bg-gradient-to-r from-[#22d3ee] to-[#45dfa4]"></div>

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
                        {p.sku} — {p.name} ({p.category || 'General'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Field 2: Destination Location */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-[#e5e2e3]">
                      Destination Location <span className="text-[#22d3ee]">*</span>
                    </label>
                    <span className="text-[11px] font-mono text-[#45dfa4] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">check_circle</span>
                      Optimal Storage Bin
                    </span>
                  </div>
                  <select
                    disabled={loading}
                    value={selectedLocationId}
                    onChange={(e) => setSelectedLocationId(e.target.value)}
                    className="w-full bg-[#131314] text-xs font-mono text-[#e5e2e3] rounded-lg border border-[#3c494c]/40 p-2.5 focus:border-[#22d3ee] focus:outline-none"
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} (Warehouse Zone)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Field 3: Quantity */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#e5e2e3]">
                    Quantity Received <span className="text-[#22d3ee]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="e.g. 50"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : '')}
                      className="w-full bg-[#131314] text-sm font-mono text-[#e5e2e3] rounded-lg border border-[#3c494c]/40 p-2.5 pr-14 focus:border-[#22d3ee] focus:outline-none"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-[#859397]">
                      {selectedProduct?.unit || 'units'}
                    </div>
                  </div>
                </div>

                {/* Field 4: Supplier Reference / PO */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#e5e2e3]">
                    Supplier Reference / PO# (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Metals — PO#1042"
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
                    disabled={submitting || loading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#22d3ee] hover:bg-[#8aebff] text-[#00363e] font-semibold text-xs transition-all shadow-md disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[16px]">check</span>
                    <span>{submitting ? 'Validating & Adjusting...' : 'Validate Receipt'}</span>
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

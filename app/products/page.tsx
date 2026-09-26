'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { ProductDetailSheet } from '@/components/products/product-detail-sheet';
import { StockBadge } from '@/components/shared/stock-badge';
import { createClient } from '@/lib/supabase/client';
import { useRealtimeChannel } from '@/hooks/use-realtime-channel';
import type { Product, StockLevel } from '@/lib/types';
import { toast } from 'sonner';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [levels, setLevels] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New product form state
  const [newSku, setNewSku] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newUnit, setNewUnit] = useState('unit');
  const [newThreshold, setNewThreshold] = useState(10);
  const [creating, setCreating] = useState(false);

  const loadData = async () => {
    try {
      const supabase = createClient();
      const { data: pData } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      const { data: lData } = await supabase.from('stock_levels').select('*');

      if (pData) {
        setProducts(
          pData.map((p) => ({
            id: p.id,
            sku: p.sku,
            name: p.name,
            category: p.category,
            unit: p.unit || 'unit',
            lowStockThreshold: p.low_stock_threshold || 10,
          }))
        );
      }

      if (lData) {
        const map: Record<string, number> = {};
        for (const item of lData) {
          map[item.product_id] = (map[item.product_id] || 0) + Number(item.quantity);
        }
        setLevels(map);
      }
    } catch (err) {
      console.warn('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useRealtimeChannel('stock_levels', () => {
    loadData();
  });

  useRealtimeChannel('products', () => {
    loadData();
  });

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === 'All' || p.category === selectedCategory;

      const currentStock = levels[p.id] || 0;
      let matchesStatus = true;
      if (selectedStatus === 'Healthy') matchesStatus = currentStock > p.lowStockThreshold;
      if (selectedStatus === 'Low Stock') matchesStatus = currentStock <= p.lowStockThreshold && currentStock > 0;
      if (selectedStatus === 'Out of Stock') matchesStatus = currentStock <= 0;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchTerm, selectedCategory, selectedStatus, levels]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSku || !newName) {
      toast.error('SKU and Product Name are required');
      return;
    }
    setCreating(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('products').insert({
        sku: newSku.toUpperCase().trim(),
        name: newName.trim(),
        category: newCategory.trim() || 'General',
        unit: newUnit.trim() || 'unit',
        low_stock_threshold: Number(newThreshold) || 10,
      });

      if (error) throw error;
      toast.success(`Product ${newSku} created successfully`);
      setShowCreateModal(false);
      setNewSku('');
      setNewName('');
      setNewCategory('');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create product');
    } finally {
      setCreating(false);
    }
  };

  const totalSKUs = products.length;
  const lowCount = products.filter((p) => (levels[p.id] || 0) <= p.lowStockThreshold).length;
  const healthyCount = totalSKUs - lowCount;

  return (
    <div className="min-h-screen bg-[#0e0e0f] text-[#e5e2e3]">
      <Sidebar />
      <div className="pl-64">
        <Topbar
          breadcrumbs={[{ label: 'Products' }]}
          action={
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#22d3ee] hover:bg-[#8aebff] text-[#00363e] text-xs font-semibold transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>New Product</span>
            </button>
          }
        />

        <main className="pt-14 px-8 py-8 w-full min-h-screen space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-[#e5e2e3] tracking-tight">Products Catalog</h1>
                <span className="px-2 py-0.5 rounded bg-[#201f20] text-[#22d3ee] font-mono text-[11px] border border-[#3c494c]/30">
                  Live Stock Sync
                </span>
              </div>
              <p className="text-xs text-[#859397] mt-1">
                {products.length} registered SKUs with atomic per-location balance tracking
              </p>
            </div>
          </div>

          {/* 4 Summary Telemetry Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#1c1b1c] rounded-xl p-4 border border-[#3c494c]/20 flex justify-between items-center">
              <div>
                <span className="text-[11px] font-mono uppercase text-[#859397]">Total SKUs</span>
                <div className="text-2xl font-mono font-semibold text-[#e5e2e3]">{totalSKUs}</div>
              </div>
              <span className="material-symbols-outlined text-[24px] text-[#22d3ee]">inventory_2</span>
            </div>

            <div className="bg-[#1c1b1c] rounded-xl p-4 border border-[#3c494c]/20 flex justify-between items-center">
              <div>
                <span className="text-[11px] font-mono uppercase text-[#859397]">Healthy Stock</span>
                <div className="text-2xl font-mono font-semibold text-[#45dfa4]">{healthyCount}</div>
              </div>
              <span className="material-symbols-outlined text-[24px] text-[#45dfa4]">check_circle</span>
            </div>

            <div className="bg-[#1c1b1c] rounded-xl p-4 border border-[#3c494c]/20 flex justify-between items-center">
              <div>
                <span className="text-[11px] font-mono uppercase text-[#859397]">Low Stock / Deficit</span>
                <div className="text-2xl font-mono font-semibold text-[#ffd2d0]">{lowCount}</div>
              </div>
              <span className="material-symbols-outlined text-[24px] text-[#ffb4ab]">warning</span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-[#1c1b1c] rounded-xl border border-[#3c494c]/20 p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              {/* Search Input */}
              <div className="relative w-full sm:w-72">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#859397] text-[16px]">
                  search
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or SKU..."
                  className="w-full bg-[#131314] border border-[#3c494c]/30 text-[#e5e2e3] placeholder:text-[#859397] text-xs rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:border-[#22d3ee]"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-[#131314] border border-[#3c494c]/30 text-[#e5e2e3] text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-[#22d3ee]"
              >
                <option value="All">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-[#131314] border border-[#3c494c]/30 text-[#e5e2e3] text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-[#22d3ee]"
              >
                <option value="All">Status: All</option>
                <option value="Healthy">Healthy Reserves</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>

            <div className="text-right text-xs font-mono text-[#859397]">
              Showing {filteredProducts.length} of {products.length} products
            </div>
          </div>

          {/* Table */}
          <div className="bg-[#1c1b1c] rounded-xl border border-[#3c494c]/20 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#161618] border-b border-[#3c494c]/30 text-[11px] text-[#859397] font-medium uppercase tracking-wider font-mono">
                    <th className="py-3 px-4">SKU / Code</th>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Unit</th>
                    <th className="py-3 px-4 text-right">Threshold</th>
                    <th className="py-3 px-4 text-right">Current Stock</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3c494c]/15 text-xs text-[#e5e2e3]">
                  {loading && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[#859397]">
                        Connecting to database...
                      </td>
                    </tr>
                  )}

                  {!loading && filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[#859397]">
                        No matching products found.
                      </td>
                    </tr>
                  )}

                  {filteredProducts.map((p) => {
                    const currentStock = levels[p.id] || 0;
                    return (
                      <tr
                        key={p.id}
                        onClick={() => setActiveProduct(p)}
                        className="hover:bg-[#201f20]/60 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-4 font-mono font-medium text-[#22d3ee]">
                          {p.sku}
                        </td>
                        <td className="py-3 px-4 font-medium text-white">
                          {p.name}
                        </td>
                        <td className="py-3 px-4 text-[#bbc9cd]">
                          {p.category || 'General'}
                        </td>
                        <td className="py-3 px-4 font-mono text-[#859397]">
                          {p.unit}
                        </td>
                        <td className="py-3 px-4 font-mono text-right text-[#859397]">
                          {p.lowStockThreshold}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <StockBadge
                            quantity={currentStock}
                            threshold={p.lowStockThreshold}
                            unit={p.unit}
                          />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveProduct(p);
                            }}
                            className="px-2.5 py-1 rounded bg-[#201f20] hover:bg-[#2a2a2b] text-[11px] text-[#22d3ee] font-mono border border-[#3c494c]/30"
                          >
                            Breakdown →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Slide-over Detail Sheet */}
      <ProductDetailSheet
        product={activeProduct}
        isOpen={!!activeProduct}
        onClose={() => setActiveProduct(null)}
      />

      {/* Create Product Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1c1b1c] border border-[#3c494c]/30 rounded-xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#3c494c]/20">
              <h3 className="font-semibold text-base text-[#e5e2e3]">Add New Product</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[#859397] hover:text-[#e5e2e3]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#859397] font-mono mb-1">SKU / Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RAW-STL-002"
                  value={newSku}
                  onChange={(e) => setNewSku(e.target.value)}
                  className="w-full bg-[#131314] border border-[#3c494c]/30 rounded-lg px-3 py-2 text-[#e5e2e3] font-mono focus:outline-none focus:border-[#22d3ee]"
                />
              </div>

              <div>
                <label className="block text-[#859397] font-mono mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Copper Tubing 15mm"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-[#131314] border border-[#3c494c]/30 rounded-lg px-3 py-2 text-[#e5e2e3] focus:outline-none focus:border-[#22d3ee]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#859397] font-mono mb-1">Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Raw Materials"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-[#131314] border border-[#3c494c]/30 rounded-lg px-3 py-2 text-[#e5e2e3] focus:outline-none focus:border-[#22d3ee]"
                  />
                </div>
                <div>
                  <label className="block text-[#859397] font-mono mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    placeholder="e.g. kg, unit, L"
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full bg-[#131314] border border-[#3c494c]/30 rounded-lg px-3 py-2 text-[#e5e2e3] focus:outline-none focus:border-[#22d3ee]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#859397] font-mono mb-1">Safety Threshold (Low Stock Alert)</label>
                <input
                  type="number"
                  min="1"
                  value={newThreshold}
                  onChange={(e) => setNewThreshold(Number(e.target.value))}
                  className="w-full bg-[#131314] border border-[#3c494c]/30 rounded-lg px-3 py-2 text-[#e5e2e3] font-mono focus:outline-none focus:border-[#22d3ee]"
                />
              </div>

              <div className="pt-3 border-t border-[#3c494c]/20 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-[#201f20] hover:bg-[#2a2a2b] text-[#e5e2e3]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-1.5 rounded-lg bg-[#22d3ee] text-[#00363e] font-semibold hover:bg-[#8aebff] disabled:opacity-50"
                >
                  {creating ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

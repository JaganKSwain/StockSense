'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { createClient } from '@/lib/supabase/client';
import { useRealtimeChannel } from '@/hooks/use-realtime-channel';
import type { StockMove } from '@/lib/types';

export default function LedgerPage() {
  const [moves, setMoves] = useState<StockMove[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const fetchMoves = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('stock_moves')
        .select('*, product:products(*), fromLocation:locations!stock_moves_from_location_id_fkey(*), toLocation:locations!stock_moves_to_location_id_fkey(*)')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setMoves(data as any);
      }
    } catch (err) {
      console.warn('Failed to fetch ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMoves();
  }, []);

  useRealtimeChannel('stock_moves', (payload) => {
    console.log('⚡ New move received on ledger:', payload);
    if (payload.new?.id) {
      setHighlightId(payload.new.id);
      setTimeout(() => setHighlightId(null), 3000);
    }
    fetchMoves();
  });

  const filteredMoves = useMemo(() => {
    return moves.filter((m) => {
      const matchesType = selectedType === 'all' || m.docType === selectedType;
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        !search ||
        m.product?.name?.toLowerCase().includes(search) ||
        m.product?.sku?.toLowerCase().includes(search) ||
        m.reference?.toLowerCase().includes(search);

      return matchesType && matchesSearch;
    });
  }, [moves, selectedType, searchTerm]);

  const getDocTypeBadge = (type: string) => {
    switch (type) {
      case 'receipt':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#45dfa4]/15 text-[#45dfa4] border border-[#45dfa4]/30 font-mono text-[10px] uppercase font-semibold">
            <span className="material-symbols-outlined text-[12px]">move_to_inbox</span>
            Receipt
          </span>
        );
      case 'delivery':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#ffb4ab]/15 text-[#ffb4ab] border border-[#ffb4ab]/30 font-mono text-[10px] uppercase font-semibold">
            <span className="material-symbols-outlined text-[12px]">local_shipping</span>
            Delivery
          </span>
        );
      case 'transfer':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#22d3ee]/15 text-[#22d3ee] border border-[#22d3ee]/30 font-mono text-[10px] uppercase font-semibold">
            <span className="material-symbols-outlined text-[12px]">sync_alt</span>
            Transfer
          </span>
        );
      case 'adjustment':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#ffd2d0]/15 text-[#ffd2d0] border border-[#ffd2d0]/30 font-mono text-[10px] uppercase font-semibold">
            <span className="material-symbols-outlined text-[12px]">tune</span>
            Adjustment
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px]">
            {type}
          </span>
        );
    }
  };

  const handleExportCSV = () => {
    if (moves.length === 0) return;
    const headers = ['Timestamp', 'Type', 'SKU', 'Product', 'Quantity', 'From', 'To', 'Reference', 'Status'];
    const rows = moves.map((m) => [
      m.createdAt,
      m.docType,
      m.product?.sku || '',
      m.product?.name || '',
      m.quantity,
      m.fromLocation?.name || 'External / Supplier',
      m.toLocation?.name || 'Customer / Dispatch',
      m.reference || '',
      m.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `stocksense_ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#0e0e0f] text-[#e5e2e3]">
      <Sidebar />
      <div className="pl-64">
        <Topbar
          breadcrumbs={[{ label: 'Ledger' }]}
          action={
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#201f20] hover:bg-[#2a2a2b] border border-[#3c494c]/30 text-xs font-medium text-[#e5e2e3] transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">file_download</span>
              <span>Export CSV</span>
            </button>
          }
        />

        <main className="pt-14 px-8 py-8 w-full min-h-screen space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-[#e5e2e3] tracking-tight">Stock Movement Ledger</h1>
                <span className="px-2 py-0.5 rounded bg-[#201f20] text-[#22d3ee] font-mono text-[11px] border border-[#3c494c]/30">
                  Immutable Audit Log
                </span>
              </div>
              <p className="text-xs text-[#859397] mt-1">
                Single source of truth tracking every receipt, delivery, transfer, and adjustment with zero drift.
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-[#1c1b1c] rounded-xl border border-[#3c494c]/20 p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { label: 'All Operations', value: 'all' },
                { label: 'Receipts', value: 'receipt' },
                { label: 'Deliveries', value: 'delivery' },
                { label: 'Transfers', value: 'transfer' },
                { label: 'Adjustments', value: 'adjustment' },
              ].map((pill) => (
                <button
                  key={pill.value}
                  onClick={() => setSelectedType(pill.value)}
                  className={`px-3 py-1.5 rounded-lg font-mono text-xs transition-colors ${
                    selectedType === pill.value
                      ? 'bg-[#22d3ee] text-[#00363e] font-semibold'
                      : 'bg-[#131314] text-[#859397] hover:text-[#e5e2e3] border border-[#3c494c]/30'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#859397] text-[16px]">
                search
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search reference, SKU, item..."
                className="w-full bg-[#131314] border border-[#3c494c]/30 text-[#e5e2e3] placeholder:text-[#859397] text-xs rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:border-[#22d3ee]"
              />
            </div>
          </div>

          {/* Master Table */}
          <div className="bg-[#1c1b1c] rounded-xl border border-[#3c494c]/20 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#161618] border-b border-[#3c494c]/30 text-[11px] text-[#859397] font-medium uppercase tracking-wider font-mono">
                    <th className="py-3 px-4">Date / Time</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Product / SKU</th>
                    <th className="py-3 px-4">Location Vector (From → To)</th>
                    <th className="py-3 px-4 text-right">Quantity</th>
                    <th className="py-3 px-4">Reference / Memo</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3c494c]/15 text-xs text-[#e5e2e3]">
                  {loading && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[#859397]">
                        Fetching immutable ledger records...
                      </td>
                    </tr>
                  )}

                  {!loading && filteredMoves.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[#859397]">
                        No stock moves match the selected filter.
                      </td>
                    </tr>
                  )}

                  {filteredMoves.map((m) => {
                    const isPositive = m.docType === 'receipt' || (m.docType === 'adjustment' && m.toLocationId);
                    const isHighlighted = highlightId === m.id;

                    return (
                      <tr
                        key={m.id}
                        className={`transition-colors hover:bg-[#201f20]/50 ${
                          isHighlighted ? 'bg-[#f87171]/15 animate-amber-flash' : ''
                        }`}
                      >
                        {/* Timestamp */}
                        <td className="py-3 px-4 font-mono text-[11px] text-[#859397] whitespace-nowrap">
                          {new Date(m.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          {new Date(m.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>

                        {/* Doc Type Badge */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {getDocTypeBadge(m.docType)}
                        </td>

                        {/* Product SKU & Name */}
                        <td className="py-3 px-4">
                          <div className="font-medium text-white">{m.product?.name || 'Item'}</div>
                          <span className="font-mono text-[11px] text-[#22d3ee]">
                            {m.product?.sku}
                          </span>
                        </td>

                        {/* Location Vector */}
                        <td className="py-3 px-4 font-mono text-[11px] text-[#bbc9cd]">
                          {m.fromLocation ? (
                            <span className="text-[#ffb4ab]">{m.fromLocation.name}</span>
                          ) : (
                            <span className="text-[#859397]">Vendor / Intake</span>
                          )}
                          <span className="mx-2 text-[#3c494c]">→</span>
                          {m.toLocation ? (
                            <span className="text-[#45dfa4]">{m.toLocation.name}</span>
                          ) : (
                            <span className="text-[#859397]">Customer / Dispatch</span>
                          )}
                        </td>

                        {/* Quantity */}
                        <td className="py-3 px-4 text-right font-mono text-sm font-semibold whitespace-nowrap">
                          <span className={isPositive ? 'text-[#45dfa4]' : 'text-[#ffb4ab]'}>
                            {isPositive ? '+' : '-'}
                            {m.quantity} {m.product?.unit || 'u'}
                          </span>
                        </td>

                        {/* Reference */}
                        <td className="py-3 px-4 text-xs text-[#859397] max-w-xs truncate">
                          {m.reference || '—'}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#201f20] text-[#45dfa4] border border-[#45dfa4]/30">
                            {m.status}
                          </span>
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
    </div>
  );
}

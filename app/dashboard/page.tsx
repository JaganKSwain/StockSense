'use client';

import dynamic from 'next/dynamic';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { useDashboardKpis } from '@/hooks/use-dashboard-kpis';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import Link from 'next/link';

const MovementChart = dynamic(
  () => import('@/components/dashboard/movement-chart').then((mod) => mod.MovementChart),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-56 flex items-center justify-center text-xs font-mono text-[#859397]">
        Loading velocity chart...
      </div>
    ),
  }
);

export default function DashboardPage() {
  const { kpis, highlightKey } = useDashboardKpis();

  const isLowStockCritical = kpis.lowStockCount > 0;

  return (
    <div className="min-h-screen bg-[#0e0e0f] text-[#e5e2e3]">
      <Sidebar />
      <div className="pl-64">
        <Topbar breadcrumbs={[{ label: 'Dashboard' }]} />

        <main className="pt-14 px-8 py-8 w-full min-h-screen space-y-6">
          {/* Sub-Header & Telemetry Strip */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-[#e5e2e3] tracking-tight">
                  Warehouse Health Overview
                </h1>
                <span className="px-2 py-0.5 rounded bg-[#201f20] text-[#bbc9cd] font-mono text-[11px] uppercase tracking-wider border border-[#3c494c]/30">
                  WH-01-SYS
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#859397] mt-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#45dfa4] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#45dfa4]"></span>
                </span>
                <span className="font-mono text-[#45dfa4]">Updated via Supabase CDC</span>
                <span>•</span>
                <span className="font-mono">Real-time immutable stock ledger active</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center bg-[#1c1b1c] border border-[#3c494c]/30 px-3 py-1.5 rounded-lg text-xs gap-2 text-[#e5e2e3]">
                <span className="material-symbols-outlined text-[#859397] text-[16px]">warehouse</span>
                <span className="font-medium">Central Warehouse</span>
              </div>

              <Link
                href="/receipts/new"
                className="flex items-center gap-1.5 bg-[#201f20] hover:bg-[#2a2a2b] border border-[#3c494c]/30 text-[#e5e2e3] px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">add_box</span>
                <span>New Receipt</span>
              </Link>

              <Link
                href="/deliveries/new"
                className="flex items-center gap-1.5 bg-[#22d3ee] text-[#00363e] hover:bg-[#8aebff] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                <span>New Delivery</span>
              </Link>
            </div>
          </div>

          {/* 5-Metric Operational Telemetry Deck */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Card 1: Total Units */}
            <div className={`p-4 bg-[#1c1b1c] rounded-xl border border-[#3c494c]/30 flex flex-col justify-between transition-all ${highlightKey ? 'animate-amber-flash' : ''}`}>
              <div className="flex items-center justify-between text-[#859397] mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider">In Stock Products</span>
                <span className="material-symbols-outlined text-[18px]">inventory_2</span>
              </div>
              <div>
                <div className="text-2xl font-mono font-semibold text-[#e5e2e3] tracking-tight">
                  {kpis.totalProducts}
                </div>
                <div className="flex items-center justify-between pt-1 text-[11px] text-[#859397]">
                  <span>Active catalog items</span>
                  <span className="font-mono text-[#45dfa4] font-medium">+100% auditable</span>
                </div>
              </div>
            </div>

            {/* Card 2: Low Stock / Critical Alert (Turns Red when lowStockCount > 0!) */}
            <div
              className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                isLowStockCritical
                  ? 'bg-[#93000a]/20 border-[#ffb4ab]/40 animate-pulse'
                  : 'bg-[#1c1b1c] border-[#3c494c]/30'
              }`}
            >
              <div
                className={`flex items-center justify-between mb-2 ${
                  isLowStockCritical ? 'text-[#ffb4ab]' : 'text-[#859397]'
                }`}
              >
                <span className="text-[11px] font-mono uppercase tracking-wider font-medium">
                  Low Stock Items
                </span>
                <span className="material-symbols-outlined text-[18px]">
                  {isLowStockCritical ? 'warning' : 'check_circle'}
                </span>
              </div>
              <div>
                <div
                  className={`text-2xl font-mono font-semibold tracking-tight ${
                    isLowStockCritical ? 'text-[#ffb4ab]' : 'text-[#e5e2e3]'
                  }`}
                >
                  {kpis.lowStockCount}
                </div>
                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <span className={isLowStockCritical ? 'text-[#ffb4ab]/80' : 'text-[#859397]'}>
                    {isLowStockCritical ? 'Below safety threshold' : 'All levels healthy'}
                  </span>
                  {isLowStockCritical && (
                    <span className="px-1.5 py-0.5 rounded bg-[#93000a] text-[#ffdad6] font-mono text-[10px] font-semibold">
                      Action Required
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Card 3: Pending Receipts */}
            <div className="p-4 bg-[#1c1b1c] rounded-xl border border-[#3c494c]/30 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#859397] mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider">Pending Receipts</span>
                <span className="material-symbols-outlined text-[18px] text-[#45dfa4]">move_to_inbox</span>
              </div>
              <div>
                <div className="text-2xl font-mono font-semibold text-[#e5e2e3] tracking-tight">
                  {kpis.pendingReceipts} <span className="text-xs font-normal text-[#859397]">inbound</span>
                </div>
                <div className="flex items-center justify-between pt-1 text-[11px] text-[#859397]">
                  <span>Supplier deliveries</span>
                  <span className="font-mono text-[#bbc9cd]">Auto-adjusts stock</span>
                </div>
              </div>
            </div>

            {/* Card 4: Pending Deliveries */}
            <div className="p-4 bg-[#1c1b1c] rounded-xl border border-[#3c494c]/30 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#859397] mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider">Outbound Queue</span>
                <span className="material-symbols-outlined text-[18px] text-[#ffd2d0]">local_shipping</span>
              </div>
              <div>
                <div className="text-2xl font-mono font-semibold text-[#ffd2d0] tracking-tight">
                  {kpis.pendingDeliveries} <span className="text-xs font-normal text-[#859397]">orders</span>
                </div>
                <div className="flex items-center justify-between pt-1 text-[11px] text-[#859397]">
                  <span>Customer shipments</span>
                  <span className="font-mono text-[#ffd2d0]">Predictive alerts</span>
                </div>
              </div>
            </div>

            {/* Card 5: Internal Transfers */}
            <div className="p-4 bg-[#1c1b1c] rounded-xl border border-[#3c494c]/30 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#859397] mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider">Active Transfers</span>
                <span className="material-symbols-outlined text-[18px] text-[#22d3ee]">sync_alt</span>
              </div>
              <div>
                <div className="text-2xl font-mono font-semibold text-[#22d3ee] tracking-tight">
                  {kpis.scheduledTransfers} <span className="text-xs font-normal text-[#859397]">routes</span>
                </div>
                <div className="flex items-center justify-between pt-1 text-[11px] text-[#859397]">
                  <span>Internal bay relocation</span>
                  <span className="font-mono text-[#22d3ee]">Zero net loss</span>
                </div>
              </div>
            </div>
          </div>

          {/* Primary Intelligence Workspace (65% / 35%) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: 7-Day Stock Velocity Chart */}
            <div className="lg:col-span-7 bg-[#1c1b1c] rounded-xl border border-[#3c494c]/20 p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#3c494c]/20">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-sm text-[#e5e2e3]">Stock Velocity & Movement</h2>
                    <span className="px-2 py-0.5 rounded bg-[#2a2a2b] text-[#45dfa4] font-mono text-[10px]">
                      Live Throughput
                    </span>
                  </div>
                  <p className="text-xs text-[#859397]">
                    Real-time comparison between inbound supplier receipts and customer dispatches
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-[#22d3ee]"></span>
                    <span className="text-[#bbc9cd]">Inbound</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-[#45dfa4]"></span>
                    <span className="text-[#bbc9cd]">Outbound</span>
                  </div>
                </div>
              </div>

              <MovementChart />
            </div>

            {/* Right Column: Recent Stock Moves Activity */}
            <div className="lg:col-span-5">
              <RecentActivity />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-[#0e0e0f] text-[#e5e2e3]">
      <Sidebar />
      <div className="pl-64">
        <Topbar breadcrumbs={[{ label: 'Settings' }]} />

        <main className="pt-14 px-8 py-8 w-full min-h-screen space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-[#e5e2e3] tracking-tight">
              Warehouse Configuration & Settings
            </h1>
            <p className="text-xs text-[#859397] mt-1">
              Multi-warehouse management, location zoning, and audit preferences.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-[#1c1b1c] rounded-xl border border-[#3c494c]/20 space-y-4">
              <h2 className="text-sm font-semibold text-white">Configured Warehouses</h2>
              <div className="space-y-3">
                <div className="p-3 bg-[#131314] rounded-lg border border-[#3c494c]/30 flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium text-[#e5e2e3]">Central Warehouse (WH-01)</div>
                    <div className="text-xs text-[#859397]">Austin, TX • Main Distribution Hub</div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[#45dfa4]/10 text-[#45dfa4] text-[10px] font-mono border border-[#45dfa4]/20">
                    Primary
                  </span>
                </div>

                <div className="p-3 bg-[#131314] rounded-lg border border-[#3c494c]/30 flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium text-[#e5e2e3]">East Logistics Hub (WH-02)</div>
                    <div className="text-xs text-[#859397]">Houston, TX • Bulk Overflow Facility</div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[#22d3ee]/10 text-[#22d3ee] text-[10px] font-mono border border-[#22d3ee]/20">
                    Active
                  </span>
                </div>
              </div>
            </div>

            <div className="p-5 bg-[#1c1b1c] rounded-xl border border-[#3c494c]/20 space-y-4">
              <h2 className="text-sm font-semibold text-white">System & Realtime Sync Telemetry</h2>
              <div className="space-y-2 text-xs font-mono text-[#859397]">
                <div className="flex justify-between py-1.5 border-b border-[#3c494c]/20">
                  <span>Engine:</span>
                  <span className="text-[#e5e2e3]">Supabase PostgreSQL 15</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#3c494c]/20">
                  <span>Replication:</span>
                  <span className="text-[#45dfa4]">CDC WebSocket (10 events/sec)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#3c494c]/20">
                  <span>Fallback Polling:</span>
                  <span className="text-[#e5e2e3]">4000ms adaptive heartbeat</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span>Ledger Integrity:</span>
                  <span className="text-[#22d3ee]">Immutable Append-Only + Triggers</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

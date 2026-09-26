'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
  { label: 'Products', href: '/products', icon: 'inventory_2' },
  { label: 'Receipts', href: '/receipts/new', icon: 'move_to_inbox' },
  { label: 'Deliveries', href: '/deliveries/new', icon: 'local_shipping' },
  { label: 'Transfers', href: '/transfers/new', icon: 'sync_alt' },
  { label: 'Adjustments', href: '/adjustments/new', icon: 'tune' },
  { label: 'Ledger', href: '/ledger', icon: 'receipt_long' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#0e0e0f] border-r border-[#3c494c]/30 z-50 flex flex-col justify-between select-none">
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-[#3c494c]/20">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#22d3ee]/10 border border-[#22d3ee]/30 flex items-center justify-center text-[#22d3ee]">
              <span className="material-symbols-outlined text-[18px]">package_2</span>
            </div>
            <span className="font-semibold text-base text-[#e5e2e3] tracking-tight">
              StockSense
            </span>
          </div>
          <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-[#2a2a2b] text-[#bbc9cd] border border-[#3c494c]/30">
            v2.4
          </span>
        </div>

        {/* Section Label */}
        <div className="px-4 py-2 mt-2">
          <span className="font-mono text-[11px] text-[#859397] uppercase tracking-wider">
            Operations
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1 px-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-colors',
                  isActive
                    ? 'bg-[#201f20] text-[#22d3ee] font-medium border-l-2 border-[#22d3ee]'
                    : 'text-[#bbc9cd] hover:bg-[#201f20] hover:text-[#e5e2e3]'
                )}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="my-2 border-t border-[#3c494c]/20"></div>

          <Link
            href="/settings"
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-colors',
              pathname === '/settings'
                ? 'bg-[#201f20] text-[#22d3ee] font-medium border-l-2 border-[#22d3ee]'
                : 'text-[#bbc9cd] hover:bg-[#201f20] hover:text-[#e5e2e3]'
            )}
          >
            <span className="material-symbols-outlined text-[18px]">settings</span>
            <span>Settings</span>
          </Link>
        </nav>
      </div>

      {/* User / Profile Footer */}
      <div className="p-3 border-t border-[#3c494c]/20 bg-[#1c1b1c]">
        <Link
          href="/login"
          title="Switch Operator Profile / Ingress Portal"
          className="flex items-center justify-between p-2 rounded-lg bg-[#201f20] hover:bg-[#2a2a2b] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <div className="w-7 h-7 rounded-full bg-[#22d3ee] flex items-center justify-center font-bold text-xs text-[#00363e]">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'OP'}
              </div>
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-[#45dfa4] ring-2 ring-[#1c1b1c]"></span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[12px] text-[#e5e2e3] truncate font-medium">
                {user?.name || 'Priya Sharma'}
              </div>
              <div className="font-mono text-[10px] text-[#22d3ee] truncate">
                {user?.role || 'Supervisor'} • {user?.badgeId || 'SUP-01'}
              </div>
            </div>
          </div>
          <span className="material-symbols-outlined text-[#859397] text-[16px]">
            switch_account
          </span>
        </Link>
      </div>
    </aside>
  );
}

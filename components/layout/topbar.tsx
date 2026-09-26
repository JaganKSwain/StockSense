'use client';

import React from 'react';
import Link from 'next/link';

interface TopbarProps {
  breadcrumbs?: { label: string; href?: string }[];
  action?: React.ReactNode;
}

export function Topbar({ breadcrumbs, action }: TopbarProps) {
  return (
    <header className="fixed top-0 left-64 right-0 h-14 bg-[#0e0e0f]/90 backdrop-blur-md border-b border-[#3c494c]/30 z-40 flex items-center justify-between px-6">
      {/* Left: Breadcrumbs & Live Pulse */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-[12px]">
          <span className="text-[#859397]">Warehouses</span>
          <span className="text-[#3c494c]">/</span>
          <span className="text-[#e5e2e3] font-semibold">Central Warehouse (WH-01)</span>
          {breadcrumbs &&
            breadcrumbs.map((b, i) => (
              <React.Fragment key={i}>
                <span className="text-[#3c494c]">/</span>
                {b.href ? (
                  <Link href={b.href} className="text-[#859397] hover:text-[#e5e2e3]">
                    {b.label}
                  </Link>
                ) : (
                  <span className="text-[#22d3ee] font-medium">{b.label}</span>
                )}
              </React.Fragment>
            ))}
        </div>

        <div className="h-4 w-[1px] bg-[#3c494c]/40 hidden sm:block"></div>

        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#1c1b1c] border border-[#3c494c]/30">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#45dfa4] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#45dfa4]"></span>
          </span>
          <span className="font-mono text-[11px] text-[#45dfa4] font-medium">Live</span>
          <span className="text-[#3c494c]">•</span>
          <span className="font-mono text-[11px] text-[#859397]">CDC Active</span>
        </div>
      </div>

      {/* Right: Search, Actions, Profile */}
      <div className="flex items-center gap-3">
        {action}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-[#1c1b1c] border border-[#3c494c]/30 rounded-lg text-[#859397] font-mono text-[11px]">
          <span className="material-symbols-outlined text-[15px]">search</span>
          <span>Search SKU, Bin, PO...</span>
          <kbd className="px-1.5 py-0.5 rounded bg-[#2a2a2b] border border-[#3c494c]/40 text-[#bbc9cd] text-[10px]">
            Ctrl+K
          </kbd>
        </div>

        <div className="w-8 h-8 rounded-full bg-[#22d3ee] flex items-center justify-center text-[#00363e]">
          <span className="material-symbols-outlined text-[18px]">person</span>
        </div>
      </div>
    </header>
  );
}

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface RealtimeIndicatorProps {
  isLive?: boolean;
  className?: string;
}

export function RealtimeIndicator({ isLive = true, className }: RealtimeIndicatorProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-border bg-[#161618] text-xs font-medium text-zinc-300",
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        <span
          className={cn(
            "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
            isLive ? "bg-[#22D3EE]" : "bg-zinc-500"
          )}
        />
        <span
          className={cn(
            "relative inline-flex rounded-full h-2 w-2",
            isLive ? "bg-[#22D3EE]" : "bg-zinc-500"
          )}
        />
      </span>
      <span className="font-mono text-[11px] tracking-wide uppercase">
        {isLive ? 'Live Sync' : 'Connecting'}
      </span>
    </div>
  );
}

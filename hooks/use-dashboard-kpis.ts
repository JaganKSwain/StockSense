'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DashboardKpis } from '@/lib/types';
import { useRealtimeChannel } from './use-realtime-channel';

export function useDashboardKpis(initialKpis?: DashboardKpis) {
  const [kpis, setKpis] = useState<DashboardKpis>(
    initialKpis || {
      totalProducts: 6,
      lowStockCount: 1,
      pendingReceipts: 0,
      pendingDeliveries: 0,
      scheduledTransfers: 0,
    }
  );
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(true);
  const [highlightKey, setHighlightKey] = useState<string | null>(null);

  const fetchLatestKpis = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/kpis');
      if (res.ok) {
        const data = await res.json();
        setKpis(data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.warn('Failed to poll dashboard KPIs:', err);
    }
  }, []);

  // CDC event handler: instantly refetch and trigger remote highlight
  const handleRealtimeChange = useCallback(
    (payload: any) => {
      console.log('⚡ Realtime CDC received on dashboard:', payload);
      setHighlightKey(Date.now().toString());
      fetchLatestKpis();
    },
    [fetchLatestKpis]
  );

  useRealtimeChannel('stock_moves', handleRealtimeChange);
  useRealtimeChannel('stock_levels', handleRealtimeChange);

  // 3-second polling fallback in case venue Wi-Fi drops websocket frames
  useEffect(() => {
    const timer = setInterval(() => {
      fetchLatestKpis();
    }, 4000);
    return () => clearInterval(timer);
  }, [fetchLatestKpis]);

  return {
    kpis,
    lastUpdated,
    isLiveConnected,
    highlightKey,
    refetch: fetchLatestKpis,
  };
}

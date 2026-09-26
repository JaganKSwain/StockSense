import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StockBadgeProps {
  quantity: number;
  threshold?: number;
  unit?: string;
  className?: string;
}

export function StockBadge({ quantity, threshold = 10, unit = 'units', className }: StockBadgeProps) {
  if (quantity <= 0) {
    return (
      <Badge variant="destructive" className={cn("font-mono font-medium", className)}>
        0 {unit} (Out of Stock)
      </Badge>
    );
  }

  if (quantity <= threshold) {
    return (
      <Badge variant="destructive" className={cn("font-mono font-medium bg-red-950/40 text-red-400 border-red-800/40", className)}>
        {quantity} {unit} (Low Stock)
      </Badge>
    );
  }

  if (quantity <= threshold * 1.5) {
    return (
      <Badge variant="warning" className={cn("font-mono font-medium", className)}>
        {quantity} {unit} (Moderate)
      </Badge>
    );
  }

  return (
    <Badge variant="success" className={cn("font-mono font-medium", className)}>
      {quantity} {unit}
    </Badge>
  );
}

export type DocType = 'receipt' | 'delivery' | 'transfer' | 'adjustment';
export type MoveStatus = 'draft' | 'waiting' | 'ready' | 'done' | 'canceled';

export interface Warehouse {
  id: string;
  name: string;
  createdAt?: string;
}

export interface Location {
  id: string;
  warehouseId: string;
  name: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string | null;
  unit: string;
  lowStockThreshold: number;
  createdAt?: string;
}

export interface StockLevel {
  productId: string;
  locationId: string;
  quantity: number;
  product?: Product;
  location?: Location;
}

export interface StockMove {
  id: string;
  docType: DocType;
  status: MoveStatus;
  productId: string;
  fromLocationId: string | null;
  toLocationId: string | null;
  quantity: number;
  reference: string | null;
  createdAt: string;
  product?: Product;
  fromLocation?: Location;
  toLocation?: Location;
  sourceHighlight?: 'self' | 'realtime';
}

export interface DashboardKpis {
  totalProducts: number;
  lowStockCount: number;
  pendingReceipts: number;
  pendingDeliveries: number;
  scheduledTransfers: number;
}

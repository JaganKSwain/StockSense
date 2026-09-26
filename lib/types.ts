export type DocType = 'receipt' | 'delivery' | 'transfer' | 'adjustment';
export type MoveStatus = 'draft' | 'waiting' | 'ready' | 'done' | 'canceled';

export interface Warehouse {
  id: string;
  name: string;
  created_at?: string;
  createdAt?: string;
}

export interface Location {
  id: string;
  warehouse_id?: string;
  warehouseId?: string;
  name: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string | null;
  unit: string;
  low_stock_threshold?: number;
  lowStockThreshold: number;
  created_at?: string;
  createdAt?: string;
}

export interface StockLevel {
  product_id?: string;
  productId: string;
  location_id?: string;
  locationId: string;
  quantity: number;
  product?: Product;
  location?: Location;
}

export interface StockMove {
  id: string;
  doc_type?: DocType;
  docType: DocType;
  status: MoveStatus;
  product_id?: string;
  productId: string;
  from_location_id?: string | null;
  fromLocationId?: string | null;
  to_location_id?: string | null;
  toLocationId?: string | null;
  quantity: number;
  reference: string | null;
  created_at?: string;
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

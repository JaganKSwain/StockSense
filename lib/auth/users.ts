export interface AppUser {
  id: string;
  email: string;
  passwordHash: string; // Plain or hashed
  name: string;
  role: 'Supervisor' | 'Operator' | 'Auditor';
  badgeId: string;
  warehouseId: string;
  warehouseName: string;
  terminal: string;
}

export const PRESET_USERS: AppUser[] = [
  {
    id: 'user-001-sup',
    email: 'supervisor@stocksense.io',
    passwordHash: 'StockSense2026!',
    name: 'Priya Sharma',
    role: 'Supervisor',
    badgeId: 'SUP-01',
    warehouseId: '11111111-1111-1111-1111-111111111111',
    warehouseName: 'Central Warehouse (WH-01)',
    terminal: 'Austin Ingress Terminal Term-01',
  },
  {
    id: 'user-002-op',
    email: 'operator@stocksense.io',
    passwordHash: 'StockSense2026!',
    name: 'Marcus Vance',
    role: 'Operator',
    badgeId: 'OP-88219',
    warehouseId: '11111111-1111-1111-1111-111111111111',
    warehouseName: 'Central Warehouse (WH-01)',
    terminal: 'Floor Terminal Term-WH01-ING-09',
  },
  {
    id: 'user-003-aud',
    email: 'auditor@stocksense.io',
    passwordHash: 'StockSense2026!',
    name: 'Elena Rostova',
    role: 'Auditor',
    badgeId: 'AUD-04',
    warehouseId: '11111111-1111-1111-1111-111111111111',
    warehouseName: 'Central Warehouse (WH-01)',
    terminal: 'Audit & Compliance Console',
  },
];

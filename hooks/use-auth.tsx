'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'Supervisor' | 'Operator' | 'Auditor';
  badgeId: string;
  warehouseName: string;
  terminal?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (userData: { user: AuthUser; token: string }) => void;
  logout: () => void;
}

const DEFAULT_USER: AuthUser = {
  id: 'user-001-sup',
  email: 'supervisor@stocksense.io',
  name: 'Priya Sharma',
  role: 'Supervisor',
  badgeId: 'SUP-01',
  warehouseName: 'Central Warehouse (WH-01)',
  terminal: 'Austin Ingress Terminal Term-01',
};

const AuthContext = createContext<AuthContextType>({
  user: DEFAULT_USER,
  token: null,
  loading: false,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(DEFAULT_USER);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('stocksense_jwt_token');
      const storedUser = localStorage.getItem('stocksense_user_profile');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } else {
        // Fallback to default user
        setUser(DEFAULT_USER);
      }
    } catch {
      setUser(DEFAULT_USER);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (data: { user: AuthUser; token: string }) => {
    setUser(data.user);
    setToken(data.token);
    try {
      localStorage.setItem('stocksense_jwt_token', data.token);
      localStorage.setItem('stocksense_user_profile', JSON.stringify(data.user));
    } catch {}
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem('stocksense_jwt_token');
      localStorage.removeItem('stocksense_user_profile');
      document.cookie = 'stocksense_jwt=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    } catch {}
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

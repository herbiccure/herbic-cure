'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
}

interface AuthContextType {
  customer: CustomerUser | null;
  isLoading: boolean;
  login: (customer: CustomerUser) => void;
  register: (customer: CustomerUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<CustomerUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('herbic_customer') || localStorage.getItem('herbicas_customer');
      if (saved) {
        setCustomer(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to parse customer session', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (userData: CustomerUser) => {
    setCustomer(userData);
    localStorage.setItem('herbic_customer', JSON.stringify(userData));
  };

  const register = (userData: CustomerUser) => {
    login(userData);
  };

  const logout = () => {
    setCustomer(null);
    localStorage.removeItem('herbic_customer');
    localStorage.removeItem('herbicas_customer');
  };

  return (
    <AuthContext.Provider value={{ customer, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

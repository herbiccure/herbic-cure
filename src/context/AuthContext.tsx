'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { authClient } from '@/lib/auth/auth-client';

export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string | null;
}

interface AuthContextType {
  customer: CustomerUser | null;
  session: unknown;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refetchSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: sessionData, isPending, refetch } = authClient.useSession();

  const customer: CustomerUser | null = useMemo(() => {
    if (!sessionData?.user) return null;
    return {
      id: sessionData.user.id,
      name: sessionData.user.name || 'Customer',
      email: sessionData.user.email,
      role: (sessionData.user as { role?: string }).role || 'CUSTOMER',
      phone: (sessionData.user as { phone?: string | null }).phone || null,
    };
  }, [sessionData]);

  const login = async ({ email, password }: { email: string; password: string }) => {
    try {
      const res = await authClient.signIn.email({
        email,
        password,
      });
      if (res.error) {
        return { success: false, error: res.error.message || 'Login failed' };
      }
      refetch();
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: (err instanceof Error ? err.message : null) || 'An unexpected error occurred' };
    }
  };

  const logout = async () => {
    try {
      await authClient.signOut();
      refetch();
      window.location.href = '/account/login';
    } catch {
      window.location.href = '/account/login';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        customer,
        session: sessionData,
        isLoading: isPending,
        login,
        logout,
        refetchSession: refetch,
      }}
    >
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

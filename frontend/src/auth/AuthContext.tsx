import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../api/client';

interface AuthState {
  token: string | null;
  role: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    token: localStorage.getItem('ecm_token'),
    role: localStorage.getItem('ecm_role'),
  });

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post('/api/auth/login', { email, password });
    const { access_token, role } = res.data;
    localStorage.setItem('ecm_token', access_token);
    localStorage.setItem('ecm_role', role);
    setAuth({ token: access_token, role });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('ecm_token');
    localStorage.removeItem('ecm_role');
    setAuth({ token: null, role: null });
  }, []);

  return (
    <AuthContext.Provider value={{ ...auth, login, logout, isAuthenticated: !!auth.token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

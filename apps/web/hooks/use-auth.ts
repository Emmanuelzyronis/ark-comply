'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
  workspace_id: string;
  role: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem('arkcomply_token');
    if (!token) { setLoading(false); return; }
    try {
      const { user: me } = await api.get<{ user: AuthUser }>('/api/auth/me');
      setUser(me);
    } catch {
      localStorage.removeItem('arkcomply_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const login = async (email: string, password: string) => {
    const { token, user: me } = await api.post<{ token: string; user: AuthUser }>('/api/auth/login', { email, password });
    localStorage.setItem('arkcomply_token', token);
    setUser(me);
    return me;
  };

  const register = async (data: { email: string; password: string; full_name?: string; workspace_name?: string }) => {
    const { token, user: me } = await api.post<{ token: string; user: AuthUser }>('/api/auth/register', data);
    localStorage.setItem('arkcomply_token', token);
    setUser(me);
    return me;
  };

  const logout = () => {
    localStorage.removeItem('arkcomply_token');
    setUser(null);
    window.location.href = '/';
  };

  return { user, loading, login, register, logout };
}

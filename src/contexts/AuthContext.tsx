import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

interface RegisterData {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on mount, refreshing via Supabase if needed
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem('token');
      const storedRefreshToken = localStorage.getItem('refreshToken');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedRefreshToken && storedUser) {
        // Attempt to refresh the session so we always have a valid token
        const { data, error } = await supabase.auth.setSession({
          access_token: storedToken,
          refresh_token: storedRefreshToken,
        });

        if (!error && data.session) {
          const freshToken = data.session.access_token;
          const freshRefresh = data.session.refresh_token;
          localStorage.setItem('token', freshToken);
          localStorage.setItem('refreshToken', freshRefresh);
          setToken(freshToken);
          setUser(JSON.parse(storedUser));
        } else {
          // Token is invalid/expired and can't be refreshed — clear everything
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    restoreSession();
  }, []);

  const persistSession = (data: { token: string; refreshToken: string; user: User }) => {
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));

    // Sync with Supabase client
    supabase.auth.setSession({
      access_token: data.token,
      refresh_token: data.refreshToken,
    });
  };

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      persistSession(data);
    } else {
      throw new Error(data.error || 'Login failed');
    }
  };

  const register = async (userData: RegisterData) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (response.ok) {
      if (data.token) {
        persistSession(data);
      } else {
        throw new Error('Registration succeeded but no session was returned. Please sign in.');
      }
    } else {
      throw new Error(data.error || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e) {
      console.error('Logout API call failed:', e);
    }

    // Clear Supabase session
    await supabase.auth.signOut();

    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

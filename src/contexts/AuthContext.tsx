import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  signInWithGoogle: (returnTo?: string) => Promise<void>;
  updateUser: (user: User) => void;
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
  // Immediately restore from localStorage so the UI doesn't flash logged-out state
  const storedUser = (() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  })();

  const [user, setUser] = useState<User | null>(storedUser);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const restoringRef = useRef(false);

  // Restore session: handles OAuth redirect, persisted Supabase sessions, and email login
  useEffect(() => {
    const restoreSession = async () => {
      if (restoringRef.current) return;
      restoringRef.current = true;

      try {
        // 1. Check if Supabase already has a session (OAuth redirect or persisted)
        let { data: { session } } = await supabase.auth.getSession();

        // 2. If no session, try restoring from localStorage (email login)
        if (!session) {
          const storedToken = localStorage.getItem('token');
          const storedRefreshToken = localStorage.getItem('refreshToken');

          if (storedToken && storedRefreshToken) {
            const { data, error } = await supabase.auth.setSession({
              access_token: storedToken,
              refresh_token: storedRefreshToken,
            });

            if (!error && data.session) {
              session = data.session;
            } else {
              // Invalid/expired tokens — clear everything
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('user');
            }
          }
        }

        // 3. If we have a valid session, sync with backend to get Prisma user profile
        if (session) {
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const { user: backendUser } = await response.json();
            setToken(session.access_token);
            setUser(backendUser);
            localStorage.setItem('token', session.access_token);
            localStorage.setItem('refreshToken', session.refresh_token);
            localStorage.setItem('user', JSON.stringify(backendUser));
          } else if (response.status === 401 || response.status === 403) {
            // Backend rejected token — sign out and clear
            await supabase.auth.signOut();
            setUser(null);
            setToken(null);
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
          }
          // For other errors (5xx, network), keep the existing localStorage session
        }
      } catch (err) {
        console.error('Session restore error:', err);
        // Don't clear on network errors — user stays logged in with cached credentials
      } finally {
        setLoading(false);
        restoringRef.current = false;
      }
    };

    restoreSession();
  }, []);

  // Periodic session refresh — keeps Supabase token alive while app is open
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session) {
          // Session expired — try custom refresh
          const storedRefreshToken = localStorage.getItem('refreshToken');
          if (storedRefreshToken) {
            const refreshRes = await fetch('/api/auth/refresh', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken: storedRefreshToken }),
            });
            if (refreshRes.ok) {
              const refreshData = await refreshRes.json();
              setToken(refreshData.token);
              localStorage.setItem('token', refreshData.token);
              localStorage.setItem('refreshToken', refreshData.refreshToken);
              await supabase.auth.setSession({
                access_token: refreshData.token,
                refresh_token: refreshData.refreshToken,
              });
            }
          }
        } else if (data.session.access_token !== token) {
          // Supabase auto-refreshed the token — sync our state
          setToken(data.session.access_token);
          localStorage.setItem('token', data.session.access_token);
          localStorage.setItem('refreshToken', data.session.refresh_token);
        }
      } catch (e) {
        console.error('Periodic session refresh error:', e);
      }
    }, 5 * 60 * 1000); // every 5 minutes

    return () => clearInterval(interval);
  }, [token]);

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

  const signInWithGoogle = async (returnTo?: string) => {
    const redirectTo = `${window.location.origin}${returnTo || '/dashboard'}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) {
      throw new Error(error.message);
    }
    // OAuth redirect happens; session will be restored on callback
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
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
    signInWithGoogle,
    updateUser,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { logoutOneSignal } from '@/lib/onesignal';

export type UserRole = 'customer' | 'worker' | 'admin';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, data: { full_name: string; role: UserRole }) => Promise<{ error: any }>;
  logout: () => Promise<void>;
}

// Replaced with Supabase Auth
const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const syncUser = useCallback(async (sessionUser: any) => {
    if (!sessionUser) {
      console.log('[3juma-Auth] No session found');
      setUser(null);
      setLoading(false);
      return;
    }

    if (!supabase) {
      setLoading(false);
      return;
    }

    console.log('[3juma-Auth] Syncing user:', sessionUser.id);

    try {
      // Fetch the public user ID based on auth_id
      let { data: publicUser, error } = await supabase
        .from('users')
        .select('id, full_name, role, phone')
        .eq('auth_id', sessionUser.id)
        .maybeSingle();

      // If not found, it might be a delay in the trigger, wait and retry once
      if (!publicUser && !error) {
        await new Promise(r => setTimeout(r, 1000));
        const retry = await supabase
          .from('users')
          .select('id, full_name, role, phone')
          .eq('auth_id', sessionUser.id)
          .maybeSingle();
        publicUser = retry.data;
        if (publicUser) console.log('[3juma-Auth] Public user found on retry');
      }

      if (error) console.error('[3juma-Auth] Sync error:', error);

      if (publicUser) {
        console.log('[3juma-Auth] Public profile synced:', publicUser.role);
        setUser({
          id: publicUser.id, // Use the public.users table ID
          name: publicUser.full_name,
          email: sessionUser.email!,
          role: publicUser.role as UserRole,
          phone: publicUser.phone || sessionUser.phone,
        });
      } else {
        console.warn('[3juma-Auth] No public profile found, using fallback');
        // Fallback to session metadata if public record is truly missing
        setUser({
          id: sessionUser.id,
          name: sessionUser.user_metadata?.full_name || 'User',
          email: sessionUser.email!,
          role: sessionUser.user_metadata?.role || 'customer',
          phone: sessionUser.phone,
        });
      }
    } catch (err) {
      console.error('Error syncing user:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Check active sessions
    supabase.auth.getSession().then(({ data: { session } }) => {
      syncUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      syncUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [syncUser]);

  const login = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: new Error('Supabase not configured') };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }, []);

  const signUp = useCallback(async (email: string, password: string, data: { full_name: string; role: UserRole }) => {
    if (!supabase) return { error: new Error('Supabase not configured') };
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: data.full_name,
          role: data.role,
        },
      },
    });
    return { error };
  }, []);

  const logout = useCallback(async () => {
    logoutOneSignal();
    if (supabase) await supabase.auth.signOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, signUp, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

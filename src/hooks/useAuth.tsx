import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { ROUTES } from '@/lib/routes';
import { logoutOneSignal } from '@/lib/onesignal';
import { removeAllWebPushForUser } from '@/lib/webPushClient';

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
  resetPasswordForEmail: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
}

// Replaced with Supabase Auth
const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const syncUser = useCallback(async (sessionUser: { id: string; email?: string; phone?: string; user_metadata?: Record<string, unknown> } | null) => {
    if (!sessionUser) {
      setUser(null);
      setLoading(false);
      return;
    }

    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      let publicUser: { id: string; full_name: string; role: string; phone: string | null } | null = null;
      let lastError: Error | null = null;

      for (let attempt = 0; attempt < 6; attempt++) {
        const { data, error } = await supabase
          .from('users')
          .select('id, full_name, role, phone')
          .eq('auth_id', sessionUser.id)
          .maybeSingle();

        if (error) {
          lastError = new Error(error.message);
          break;
        }
        if (data) {
          publicUser = data;
          break;
        }
        await new Promise((r) => setTimeout(r, 400));
      }

      if (lastError) {
        if (import.meta.env.DEV) console.error('[3juma-Auth] Sync error:', lastError);
        setUser(null);
        setLoading(false);
        return;
      }

      if (publicUser) {
        setUser({
          id: publicUser.id,
          name: publicUser.full_name,
          email: sessionUser.email!,
          role: publicUser.role as UserRole,
          phone: publicUser.phone || sessionUser.phone,
        });
      } else {
        if (import.meta.env.DEV) {
          console.warn('[3juma-Auth] No public.users row for auth id — signing out (avoid wrong id in app)');
        }
        await supabase.auth.signOut();
        setUser(null);
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error('[3juma-Auth] Error syncing user:', err);
      setUser(null);
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
        emailRedirectTo:
          typeof window !== 'undefined' ? `${window.location.origin}${ROUTES.verify}` : undefined,
      },
    });
    return { error };
  }, []);

  const resetPasswordForEmail = useCallback(async (email: string) => {
    if (!supabase) return { error: new Error('Supabase not configured') };
    const redirectTo =
      typeof window !== 'undefined' ? `${window.location.origin}${ROUTES.resetPassword}` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    return { error };
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    if (!supabase) return { error: new Error('Supabase not configured') };
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error };
  }, []);

  const logout = useCallback(async () => {
    if (supabase && user?.id) await removeAllWebPushForUser(supabase, user.id);
    logoutOneSignal();
    if (supabase) await supabase.auth.signOut();
    setUser(null);
  }, [user?.id]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        signUp,
        resetPasswordForEmail,
        updatePassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

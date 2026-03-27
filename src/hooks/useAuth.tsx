import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

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
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Mock users for development — replace with Supabase auth
const MOCK_USERS: Record<string, AuthUser & { password: string }> = {
  'worker@3juma.com': {
    id: 'w-1',
    name: 'Kwame Asante',
    email: 'worker@3juma.com',
    role: 'worker',
    phone: '+233 24 000 0001',
    password: 'worker123',
  },
  'admin@3juma.com': {
    id: 'a-1',
    name: 'Ama Dispatcher',
    email: 'admin@3juma.com',
    role: 'admin',
    phone: '+233 24 000 0000',
    password: 'admin123',
  },
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('3juma_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (email: string, password: string, role: UserRole): Promise<boolean> => {
    // TODO: Replace with supabase.auth.signInWithPassword()
    const mockUser = MOCK_USERS[email];
    if (mockUser && mockUser.password === password && mockUser.role === role) {
      const { password: _, ...userData } = mockUser;
      setUser(userData);
      localStorage.setItem('3juma_user', JSON.stringify(userData));
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('3juma_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

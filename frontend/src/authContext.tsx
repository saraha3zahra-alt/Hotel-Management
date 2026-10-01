import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface User {
  username: string;
  name: string;
  role: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (u: string, p: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => false,
  logout: () => {},
  isAuthenticated: false,
});

export const useAuth = () => useContext(AuthContext);

const AUTH_KEY = 'majestic_hotel_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_KEY);
      return saved ? JSON.parse(saved) : { username: 'admin', name: 'أحمد محمود', role: 'مدير النظام' };
    } catch {
      return { username: 'admin', name: 'أحمد محمود', role: 'مدير النظام' };
    }
  });

  const login = (u: string, _p: string): boolean => {
    let newUser: User = { username: u, name: 'أحمد محمود', role: 'مدير النظام' };
    if (u.includes('reception') || u.includes('مواظف')) {
      newUser = { username: u, name: 'سارة علي', role: 'موظف استقبال' };
    } else if (u.includes('finance') || u.includes('مالي')) {
      newUser = { username: u, name: 'محمد حسن', role: 'المدير المالي' };
    }
    setUser(newUser);
    try {
      localStorage.setItem(AUTH_KEY, JSON.stringify(newUser));
    } catch { /* ignore */ }
    return true;
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(AUTH_KEY);
    } catch { /* ignore */ }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

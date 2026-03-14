import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User } from '../types';
import { auth } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAdmin: boolean;
  isGuest: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  enterAsGuest: () => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isGuest, setIsGuest] = useState(() => localStorage.getItem('guest') === 'true');
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = user?.roles?.includes('ROLE_ADMIN') ?? false;

  useEffect(() => {
    if (token) {
      auth.me()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('token');
          setToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const data = await auth.login(email, password);
    localStorage.setItem('token', data.token);
    localStorage.removeItem('guest');
    setIsGuest(false);
    setToken(data.token);
    const me = await auth.me();
    setUser(me);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('guest');
    setToken(null);
    setUser(null);
    setIsGuest(false);
  };

  const enterAsGuest = () => {
    localStorage.setItem('guest', 'true');
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsGuest(true);
  };

  const refreshUser = useCallback(async () => {
    if (token) {
      const me = await auth.me();
      setUser(me);
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, isAdmin, isGuest, login, logout, enterAsGuest, refreshUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

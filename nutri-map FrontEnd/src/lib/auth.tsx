import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from './types';
import { storage } from './storage';
import { api } from './api';

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const checkAuth = async () => {
      const session = storage.getSession();
      if (session?.user) setUser(session.user as User);
      setIsLoading(false);
    };

    checkAuth();
  }, []);
  
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await api.login(email, password);
      if (result?.token && result.user) {
        storage.setSession({ user: result.user, token: result.token });
        setUser(result.user);
        return true;
      }
      return false;
    } catch (err) {
      // Login failed (network/backend). Bubble the error up so callers (LoginPage)
      // can display backend-provided messages to the user.
      // eslint-disable-next-line no-console
      console.error('Login error', err);
      throw err;
    }
  };

  const logout = async () => {
    storage.setSession(null);
    setUser(null);
  };
  
  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

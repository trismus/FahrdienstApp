import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authAPI } from '../services/api';
import type { User } from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: () => boolean;
  isOperator: () => boolean;
  isDriver: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load current user on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await authAPI.me();
        setUser(response.data);
      } catch (error) {
        // Not logged in or session expired
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (username: string, password: string) => {
    const response = await authAPI.login(username, password);
    setUser(response.data);
  };

  const logout = async () => {
    await authAPI.logout();
    setUser(null);
    window.location.href = '/login';
  };

  const isAdmin = () => user?.role === 'admin';
  const isOperator = () => user?.role === 'dispatcher' || user?.role === 'admin';
  const isDriver = () => user?.role === 'driver' || user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAdmin,
        isOperator,
        isDriver,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

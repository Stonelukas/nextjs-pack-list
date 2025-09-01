"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Priority } from '@/types';
import { logError, AppError, ErrorType } from '@/lib/error-utils';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication provider that manages user state and authentication status
 * In a real application, this would integrate with your authentication service
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate checking for existing authentication on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // In a real app, this would check for valid tokens/sessions
        const savedUser = localStorage.getItem('pack-list-user');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          setUser(userData);
        } else {
          // Create a default user for demo purposes
          const defaultUser: User = {
            id: 'demo-user-1',
            name: 'Demo User',
            email: 'demo@packList.app',
            preferences: {
              theme: 'system',
              defaultPriority: Priority.MEDIUM,
              autoSave: true,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          setUser(defaultUser);
          localStorage.setItem('pack-list-user', JSON.stringify(defaultUser));
        }
      } catch (error) {
        logError(
          new AppError(
            'Failed to load user authentication data',
            ErrorType.STORAGE,
            { 
              originalError: error instanceof Error ? error.message : String(error),
              operation: 'checkAuthStatus'
            }
          )
        );
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('pack-list-user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('pack-list-user');
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates, updatedAt: new Date() };
      setUser(updatedUser);
      localStorage.setItem('pack-list-user', JSON.stringify(updatedUser));
    }
  };

  const value: AuthContextValue = {
    user,
    isLoading,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
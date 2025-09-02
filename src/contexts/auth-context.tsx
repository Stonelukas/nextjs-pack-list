"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUser as useClerkUser } from '@clerk/nextjs';
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
 * Integrates with Clerk for authentication and syncs user data
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const { user: clerkUser, isLoaded: clerkLoaded } = useClerkUser();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync Clerk user with our User type
  useEffect(() => {
    const syncUser = async () => {
      try {
        if (clerkLoaded) {
          if (clerkUser) {
            // Convert Clerk user to our User type
            const appUser: User = {
              id: clerkUser.id,
              name: clerkUser.fullName || clerkUser.firstName || 'User',
              email: clerkUser.primaryEmailAddress?.emailAddress || '',
              preferences: {
                theme: 'system',
                defaultPriority: Priority.MEDIUM,
                autoSave: true,
              },
              createdAt: new Date(clerkUser.createdAt || Date.now()),
              updatedAt: new Date(clerkUser.updatedAt || Date.now()),
            };
            
            // Check for saved preferences
            const savedPreferences = localStorage.getItem(`pack-list-preferences-${clerkUser.id}`);
            if (savedPreferences) {
              appUser.preferences = JSON.parse(savedPreferences);
            }
            
            setUser(appUser);
            localStorage.setItem('pack-list-user', JSON.stringify(appUser));
          } else {
            // No Clerk user - clear local state
            setUser(null);
            localStorage.removeItem('pack-list-user');
          }
          setIsLoading(false);
        }
      } catch (error) {
        logError(
          new AppError(
            'Failed to sync user authentication data',
            ErrorType.STORAGE,
            { 
              originalError: error instanceof Error ? error.message : String(error),
              operation: 'syncUser'
            }
          )
        );
        setIsLoading(false);
      }
    };

    syncUser();
  }, [clerkUser, clerkLoaded]);

  // These functions are now handled by Clerk
  // Keeping them for backward compatibility but they're no-ops
  const login = (userData: User) => {
    // Authentication is handled by Clerk
    console.warn('Login is now handled by Clerk. Use SignInButton component instead.');
  };

  const logout = () => {
    // Authentication is handled by Clerk
    console.warn('Logout is now handled by Clerk. Use UserButton or SignOutButton component instead.');
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates, updatedAt: new Date() };
      setUser(updatedUser);
      localStorage.setItem('pack-list-user', JSON.stringify(updatedUser));
      
      // Save preferences separately for persistence
      if (updates.preferences) {
        localStorage.setItem(`pack-list-preferences-${user.id}`, JSON.stringify(updatedUser.preferences));
      }
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

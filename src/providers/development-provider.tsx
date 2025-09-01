'use client'

import { useEffect } from 'react';
import { initializeDevTools } from '@/lib/dev-tools';

interface DevelopmentProviderProps {
  children: React.ReactNode;
}

export function DevelopmentProvider({ children }: DevelopmentProviderProps) {
  useEffect(() => {
    // Initialize development tools in development environment
    initializeDevTools();
  }, []);

  return <>{children}</>;
}
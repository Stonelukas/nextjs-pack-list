"use client";

import { useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { useNavigationStore } from "@/store/navigation-store";

interface NavigationHistoryOptions {
  maxHistorySize?: number;
  excludePatterns?: RegExp[];
}

/**
 * Hook to track and manage navigation history
 */
export function useNavigationHistory(options: NavigationHistoryOptions = {}) {
  const { maxHistorySize = 50, excludePatterns = [] } = options;
  const pathname = usePathname();
  const { navigationHistory, addToHistory, clearHistory } = useNavigationStore();
  const previousPathRef = useRef<string>("");

  useEffect(() => {
    // Skip if path hasn't changed
    if (pathname === previousPathRef.current) return;

    // Check if path should be excluded
    const shouldExclude = excludePatterns.some((pattern) => pattern.test(pathname));
    if (shouldExclude) return;

    // Add to history
    addToHistory(pathname);
    previousPathRef.current = pathname;

    // Trim history if it exceeds max size
    if (navigationHistory.length > maxHistorySize) {
      const trimmedHistory = navigationHistory.slice(-maxHistorySize);
      // Would need to update the store to handle this
    }
  }, [pathname, addToHistory, navigationHistory, maxHistorySize, excludePatterns]);

  const goBack = useCallback(
    (steps = 1) => {
      const targetIndex = navigationHistory.length - steps - 1;
      if (targetIndex >= 0 && navigationHistory[targetIndex]) {
        window.location.href = navigationHistory[targetIndex];
      }
    },
    [navigationHistory]
  );

  const canGoBack = useCallback(
    (steps = 1) => {
      return navigationHistory.length > steps;
    },
    [navigationHistory]
  );

  const getPreviousPath = useCallback(
    (steps = 1) => {
      const targetIndex = navigationHistory.length - steps - 1;
      return targetIndex >= 0 ? navigationHistory[targetIndex] : null;
    },
    [navigationHistory]
  );

  return {
    history: navigationHistory,
    currentPath: pathname,
    previousPath: getPreviousPath(1),
    goBack,
    canGoBack,
    clearHistory,
    historyLength: navigationHistory.length,
  };
}

/**
 * Hook to track visited pages in current session
 */
export function useVisitedPages() {
  const visitedRef = useRef<Set<string>>(new Set());
  const pathname = usePathname();

  useEffect(() => {
    visitedRef.current.add(pathname);
  }, [pathname]);

  const hasVisited = useCallback((path: string) => {
    return visitedRef.current.has(path);
  }, []);

  const getVisitedPages = useCallback(() => {
    return Array.from(visitedRef.current);
  }, []);

  const clearVisited = useCallback(() => {
    visitedRef.current.clear();
  }, []);

  return {
    hasVisited,
    visitedPages: getVisitedPages(),
    clearVisited,
    visitedCount: visitedRef.current.size,
  };
}

/**
 * Hook for managing recent pages with persistence
 */
export function useRecentPages(maxRecent = 5) {
  const { recentPages, addRecentPage, clearRecentPages } = useNavigationStore();
  const pathname = usePathname();

  useEffect(() => {
    // Add current page to recent pages
    addRecentPage({
      path: pathname,
      title: document.title,
      timestamp: new Date().toISOString(),
    });
  }, [pathname, addRecentPage]);

  const getRecentPages = useCallback(() => {
    return recentPages.slice(0, maxRecent);
  }, [recentPages, maxRecent]);

  const removeFromRecent = useCallback(
    (path: string) => {
      // This would need to be implemented in the store
      // For now, we can only clear all
      console.log("Remove from recent not yet implemented:", path);
    },
    []
  );

  return {
    recentPages: getRecentPages(),
    clearRecentPages,
    removeFromRecent,
  };
}
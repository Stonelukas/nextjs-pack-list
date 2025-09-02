"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useNavigationStore } from "@/store/navigation-store";
import { toast } from "sonner";

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  action: () => void;
  description?: string;
  enabled?: boolean;
}

/**
 * Hook to manage keyboard shortcuts for navigation
 */
export function useNavigationShortcuts() {
  const router = useRouter();
  const {
    toggleSidebar,
    toggleMobileMenu,
    goBack,
    navigationHistory,
  } = useNavigationStore();

  const handleShortcut = useCallback(
    (e: KeyboardEvent) => {
      // Define shortcuts
      const shortcuts: ShortcutConfig[] = [
        {
          key: "b",
          ctrl: true,
          action: () => {
            toggleSidebar();
            toast.success("Sidebar toggled");
          },
          description: "Toggle sidebar",
        },
        {
          key: "m",
          ctrl: true,
          action: () => {
            toggleMobileMenu();
            toast.success("Mobile menu toggled");
          },
          description: "Toggle mobile menu",
        },
        {
          key: "ArrowLeft",
          alt: true,
          action: () => {
            const previousPath = goBack();
            if (previousPath) {
              router.push(previousPath);
              toast.info(`Navigating back to ${previousPath}`);
            } else {
              toast.warning("No previous page in history");
            }
          },
          description: "Go back",
          enabled: navigationHistory.length > 1,
        },
        {
          key: "h",
          ctrl: true,
          shift: true,
          action: () => {
            router.push("/");
            toast.info("Navigating home");
          },
          description: "Go home",
        },
        {
          key: "l",
          ctrl: true,
          shift: true,
          action: () => {
            router.push("/lists");
            toast.info("Navigating to lists");
          },
          description: "Go to lists",
        },
        {
          key: "t",
          ctrl: true,
          shift: true,
          action: () => {
            router.push("/templates");
            toast.info("Navigating to templates");
          },
          description: "Go to templates",
        },
      ];

      // Check for matching shortcut
      for (const shortcut of shortcuts) {
        if (shortcut.enabled === false) continue;

        const ctrlMatch = shortcut.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const keyMatch = e.key === shortcut.key || e.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && altMatch && shiftMatch && keyMatch) {
          e.preventDefault();
          shortcut.action();
          return;
        }
      }
    },
    [router, toggleSidebar, toggleMobileMenu, goBack, navigationHistory]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [handleShortcut]);

  // Return shortcut list for documentation purposes
  return {
    shortcuts: [
      { keys: "Ctrl+B", description: "Toggle sidebar" },
      { keys: "Ctrl+M", description: "Toggle mobile menu" },
      { keys: "Alt+←", description: "Go back" },
      { keys: "Ctrl+Shift+H", description: "Go home" },
      { keys: "Ctrl+Shift+L", description: "Go to lists" },
      { keys: "Ctrl+Shift+T", description: "Go to templates" },
    ],
  };
}

/**
 * Hook to provide programmatic navigation helpers
 */
export function useNavigationHelpers() {
  const router = useRouter();
  const { goBack, navigationHistory, addToHistory } = useNavigationStore();

  const navigateTo = useCallback(
    (path: string, options?: { replace?: boolean; scroll?: boolean }) => {
      if (options?.replace) {
        router.replace(path, { scroll: options.scroll });
      } else {
        router.push(path, { scroll: options?.scroll });
      }
    },
    [router]
  );

  const navigateBack = useCallback(
    (fallback = "/") => {
      const previousPath = goBack();
      if (previousPath) {
        router.push(previousPath);
      } else if (window.history.length > 1) {
        router.back();
      } else {
        router.push(fallback);
      }
    },
    [router, goBack]
  );

  const navigateForward = useCallback(() => {
    if (window.history.length > 0) {
      window.history.forward();
    }
  }, []);

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  const prefetch = useCallback(
    (path: string) => {
      router.prefetch(path);
    },
    [router]
  );

  return {
    navigateTo,
    navigateBack,
    navigateForward,
    refresh,
    prefetch,
    canGoBack: navigationHistory.length > 1,
    historyLength: navigationHistory.length,
  };
}
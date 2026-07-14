import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNavigationStore } from "@/store/navigation-store";

export function useNavigationShortcuts() {
  const navigate = useNavigate();
  const { toggleMobileMenu, toggleSidebar } = useNavigationStore();
  const handleShortcut = useCallback((event: KeyboardEvent) => {
    const modifier = event.ctrlKey || event.metaKey;
    if (modifier && event.key.toLowerCase() === "b") { event.preventDefault(); toggleSidebar(); }
    else if (modifier && event.key.toLowerCase() === "m") { event.preventDefault(); toggleMobileMenu(); }
    else if (event.altKey && event.key === "ArrowLeft") { event.preventDefault(); navigate(-1); }
    else if (modifier && event.shiftKey && event.key.toLowerCase() === "h") { event.preventDefault(); navigate("/"); }
    else if (modifier && event.shiftKey && event.key.toLowerCase() === "l") { event.preventDefault(); navigate("/lists"); }
    else if (modifier && event.shiftKey && event.key.toLowerCase() === "t") { event.preventDefault(); navigate("/templates"); }
  }, [navigate, toggleMobileMenu, toggleSidebar]);
  useEffect(() => { window.addEventListener("keydown", handleShortcut); return () => window.removeEventListener("keydown", handleShortcut); }, [handleShortcut]);
  return { shortcuts: [{ keys: "Ctrl+B", description: "Toggle sidebar" }, { keys: "Ctrl+M", description: "Toggle mobile menu" }, { keys: "Alt+←", description: "Go back" }, { keys: "Ctrl+Shift+H", description: "Go home" }, { keys: "Ctrl+Shift+L", description: "Go to lists" }, { keys: "Ctrl+Shift+T", description: "Go to templates" }] };
}

export function useNavigationHelpers() {
  const navigate = useNavigate();
  return {
    navigateTo: (path: string, options?: { replace?: boolean }) => navigate(path, { replace: options?.replace }),
    navigateBack: (fallback = "/") => { if (window.history.length > 1) navigate(-1); else navigate(fallback); },
    navigateForward: () => navigate(1),
    refresh: () => navigate(0),
    prefetch: (path: string) => {
      void path;
    },
    canGoBack: window.history.length > 1,
    historyLength: window.history.length,
  };
}

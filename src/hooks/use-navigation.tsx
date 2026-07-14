import { useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useNavigationStore } from "@/store/navigation-store";
import { useBreadcrumbs } from "./use-breadcrumbs";
import { useRoleBasedAccess, type Permission } from "./use-role-based-navigation";

export interface NavigationSection {
  id: string;
  title: string;
  path: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: NavigationSection[];
  requiredPermissions?: Permission[];
}

export interface NavigationContext {
  currentSection: string | null;
  currentPath: string;
  breadcrumbs: Array<{ label: string; href: string; isActive: boolean }>;
  isActive: (path: string, exact?: boolean) => boolean;
  canAccess: (permissions?: Permission[]) => boolean;
  navigate: (path: string, options?: { replace?: boolean }) => void;
  goBack: () => void;
  refresh: () => void;
}

export function useNavigation(): NavigationContext {
  const { pathname } = useLocation();
  const routerNavigate = useNavigate();
  const { hasAllPermissions } = useRoleBasedAccess();
  const breadcrumbs = useBreadcrumbs();
  const currentSection = pathname.startsWith("/lists") ? "lists" : pathname.startsWith("/templates") ? "templates" : pathname.startsWith("/settings") ? "settings" : pathname.startsWith("/admin") ? "admin" : pathname === "/" ? "dashboard" : null;
  const isActive = useCallback((path: string, exact = false) => exact ? pathname === path : path === "/" ? pathname === "/" : pathname.startsWith(path), [pathname]);
  const canAccess = useCallback((permissions?: Permission[]) => !permissions?.length || hasAllPermissions(permissions), [hasAllPermissions]);
  return {
    currentSection,
    currentPath: pathname,
    breadcrumbs,
    isActive,
    canAccess,
    navigate: (path, options) => routerNavigate(path, { replace: options?.replace }),
    goBack: () => {
      if (window.history.length > 1) routerNavigate(-1);
      else routerNavigate("/");
    },
    refresh: () => routerNavigate(0),
  };
}

export function useFilteredNavigation(sections: NavigationSection[]) {
  const { canAccess } = useNavigation();
  return useMemo(() => {
    const filter = (items: NavigationSection[]): NavigationSection[] => items.filter((item) => canAccess(item.requiredPermissions)).map((item) => ({ ...item, children: item.children ? filter(item.children) : undefined }));
    return filter(sections);
  }, [canAccess, sections]);
}

export function useContextualActions() {
  const { currentPath, currentSection } = useNavigation();
  return useMemo(() => {
    if (currentSection === "lists" && currentPath === "/lists") return [{ title: "New list", href: "/lists/new", variant: "default" }];
    if (currentSection === "lists" && /^\/lists\/[^/]+$/.test(currentPath)) return [{ title: "Edit", href: `${currentPath}/edit`, variant: "outline" }];
    if (currentSection === "dashboard") return [{ title: "New list", href: "/lists/new", variant: "default" }, { title: "Browse templates", href: "/templates", variant: "outline" }];
    return [];
  }, [currentPath, currentSection]);
}

export function useNavigationMetadata() {
  const { currentSection, currentPath, breadcrumbs } = useNavigation();
  return useMemo(() => ({ title: currentSection ? `${currentSection[0].toUpperCase()}${currentSection.slice(1)} | Route Ledger` : "Route Ledger", description: "Dependable packing lists for every route", section: currentSection, path: currentPath, breadcrumbString: breadcrumbs.map((value) => value.label).join(" > ") }), [breadcrumbs, currentPath, currentSection]);
}

export function useNavigationState() {
  const store = useNavigationStore();
  const { currentSection } = useNavigation();
  return { sidebarOpen: store.sidebarOpen, sidebarCollapsed: store.sidebarCollapsed, mobileMenuOpen: store.mobileMenuOpen, activeSection: currentSection, toggleSidebar: store.toggleSidebar, toggleSidebarCollapsed: store.toggleSidebarCollapsed, setMobileMenuOpen: store.setMobileMenuOpen };
}

"use client";

import { useMemo, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useNavigationStore } from "@/store/navigation-store";
import { useRoleBasedAccess } from "./use-role-based-navigation";
import { useBreadcrumbs } from "./use-breadcrumbs";
import { useActiveRoute } from "./use-active-route";

export interface NavigationSection {
  id: string;
  title: string;
  path: string;
  icon?: React.ComponentType<any>;
  children?: NavigationSection[];
  requiredPermissions?: string[];
}

export interface NavigationContext {
  currentSection: string | null;
  currentPath: string;
  breadcrumbs: Array<{ label: string; href: string; isActive: boolean }>;
  isActive: (path: string, exact?: boolean) => boolean;
  canAccess: (permissions?: string[]) => boolean;
  navigate: (path: string, options?: { replace?: boolean }) => void;
  goBack: () => void;
  refresh: () => void;
}

/**
 * Central navigation hook that provides all navigation functionality
 */
export function useNavigation(): NavigationContext {
  const pathname = usePathname();
  const router = useRouter();
  const { goBack: storeGoBack } = useNavigationStore();
  const { hasAllPermissions } = useRoleBasedAccess();
  const breadcrumbs = useBreadcrumbs();

  // Determine current section based on pathname
  const currentSection = useMemo(() => {
    if (pathname.startsWith('/lists')) return 'lists';
    if (pathname.startsWith('/templates')) return 'templates';
    if (pathname.startsWith('/settings')) return 'settings';
    if (pathname.startsWith('/admin')) return 'admin';
    if (pathname === '/') return 'dashboard';
    return null;
  }, [pathname]);

  // Check if a path is active
  const isActive = useCallback((path: string, exact = false) => {
    if (exact) return pathname === path;
    if (path === '/' && pathname !== '/') return false;
    return pathname.startsWith(path);
  }, [pathname]);

  // Check if user can access routes with specific permissions
  const canAccess = useCallback((permissions?: string[]) => {
    if (!permissions || permissions.length === 0) return true;
    return hasAllPermissions(permissions);
  }, [hasAllPermissions]);

  // Navigate to a path
  const navigate = useCallback((path: string, options?: { replace?: boolean }) => {
    if (options?.replace) {
      router.replace(path);
    } else {
      router.push(path);
    }
  }, [router]);

  // Go back in navigation history
  const goBack = useCallback(() => {
    const previousPath = storeGoBack();
    if (previousPath) {
      router.push(previousPath);
    } else if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  }, [router, storeGoBack]);

  // Refresh current page
  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  return {
    currentSection,
    currentPath: pathname,
    breadcrumbs,
    isActive,
    canAccess,
    navigate,
    goBack,
    refresh,
  };
}

/**
 * Hook to get filtered navigation sections based on user permissions
 */
export function useFilteredNavigation(sections: NavigationSection[]): NavigationSection[] {
  const { canAccess } = useNavigation();

  return useMemo(() => {
    const filterSections = (items: NavigationSection[]): NavigationSection[] => {
      return items
        .filter(section => canAccess(section.requiredPermissions))
        .map(section => ({
          ...section,
          children: section.children ? filterSections(section.children) : undefined,
        }));
    };

    return filterSections(sections);
  }, [sections, canAccess]);
}

/**
 * Hook to get contextual actions based on current route
 */
export function useContextualActions() {
  const { currentPath, currentSection } = useNavigation();

  return useMemo(() => {
    const actions: Array<{
      title: string;
      href?: string;
      onClick?: () => void;
      icon?: React.ComponentType<any>;
      variant?: string;
    }> = [];

    switch (currentSection) {
      case 'lists':
        if (currentPath === '/lists') {
          actions.push(
            { title: 'New List', href: '/lists/new', variant: 'default' },
            { title: 'Import', onClick: () => console.log('Import'), variant: 'outline' }
          );
        } else if (currentPath.match(/^\/lists\/[^\/]+$/)) {
          const listId = currentPath.split('/')[2];
          actions.push(
            { title: 'Edit', href: `/lists/${listId}/edit`, variant: 'outline' },
            { title: 'Share', href: `/lists/${listId}/share`, variant: 'outline' },
            { title: 'Export', onClick: () => console.log('Export'), variant: 'outline' }
          );
        }
        break;

      case 'templates':
        if (currentPath === '/templates') {
          actions.push(
            { title: 'Create Template', href: '/templates/new', variant: 'default' },
            { title: 'Browse Gallery', href: '/templates/gallery', variant: 'outline' }
          );
        }
        break;

      case 'dashboard':
        actions.push(
          { title: 'New List', href: '/lists/new', variant: 'default' },
          { title: 'Browse Templates', href: '/templates', variant: 'outline' }
        );
        break;
    }

    return actions;
  }, [currentPath, currentSection]);
}

/**
 * Hook to get navigation metadata for the current route
 */
export function useNavigationMetadata() {
  const { currentSection, currentPath, breadcrumbs } = useNavigation();

  return useMemo(() => {
    const metadata = {
      title: 'Pack List',
      description: 'Smart Packing List Tracker',
      section: currentSection,
      path: currentPath,
      breadcrumbString: breadcrumbs.map(b => b.label).join(' > '),
    };

    // Customize based on section
    switch (currentSection) {
      case 'lists':
        metadata.title = 'Packing Lists | Pack List';
        metadata.description = 'Manage your packing lists';
        break;
      case 'templates':
        metadata.title = 'Templates | Pack List';
        metadata.description = 'Browse and create packing list templates';
        break;
      case 'settings':
        metadata.title = 'Settings | Pack List';
        metadata.description = 'Manage your account and preferences';
        break;
      case 'admin':
        metadata.title = 'Admin Dashboard | Pack List';
        metadata.description = 'Administrative tools and analytics';
        break;
    }

    return metadata;
  }, [currentSection, currentPath, breadcrumbs]);
}

/**
 * Hook to manage navigation state and provide common navigation utilities
 */
export function useNavigationState() {
  const {
    sidebarOpen,
    sidebarCollapsed,
    mobileMenuOpen,
    toggleSidebar,
    toggleSidebarCollapsed,
    setMobileMenuOpen,
    activeSection,
    setActiveSection,
  } = useNavigationStore();

  const { currentSection } = useNavigation();

  // Auto-set active section based on current route
  useMemo(() => {
    if (currentSection && currentSection !== activeSection) {
      setActiveSection(currentSection);
    }
  }, [currentSection, activeSection, setActiveSection]);

  return {
    sidebarOpen,
    sidebarCollapsed,
    mobileMenuOpen,
    activeSection: activeSection || currentSection,
    toggleSidebar,
    toggleSidebarCollapsed,
    setMobileMenuOpen,
    setActiveSection,
  };
}

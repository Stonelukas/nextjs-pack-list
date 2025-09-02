"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

interface RouteConfig {
  path: string;
  exact?: boolean;
  children?: RouteConfig[];
}

/**
 * Hook to determine if a route is active based on the current pathname
 */
export function useActiveRoute(route: string | RouteConfig, exact = false): boolean {
  const pathname = usePathname();

  return useMemo(() => {
    const routePath = typeof route === "string" ? route : route.path;
    const isExact = typeof route === "string" ? exact : route.exact ?? exact;

    if (isExact) {
      return pathname === routePath;
    }

    // Special case for root path
    if (routePath === "/" && pathname !== "/") {
      return false;
    }

    // Check if current path starts with route path
    return pathname.startsWith(routePath);
  }, [pathname, route, exact]);
}

/**
 * Hook to get the active route from a list of routes
 */
export function useActiveRouteFromList(routes: RouteConfig[]): RouteConfig | null {
  const pathname = usePathname();

  return useMemo(() => {
    // Sort routes by path length (longest first) for more specific matches
    const sortedRoutes = [...routes].sort((a, b) => b.path.length - a.path.length);

    for (const route of sortedRoutes) {
      if (route.exact && pathname === route.path) {
        return route;
      }
      if (!route.exact && pathname.startsWith(route.path)) {
        // Check for root path special case
        if (route.path === "/" && pathname !== "/") {
          continue;
        }
        return route;
      }
    }

    return null;
  }, [pathname, routes]);
}

/**
 * Hook to check if any of the child routes are active
 */
export function useHasActiveChild(parentPath: string, childPaths: string[]): boolean {
  const pathname = usePathname();

  return useMemo(() => {
    // Check if we're on the parent path itself
    if (pathname === parentPath) {
      return false;
    }

    // Check if we're on any child path
    return childPaths.some(childPath => {
      const fullPath = `${parentPath}${childPath}`;
      return pathname === fullPath || pathname.startsWith(`${fullPath}/`);
    });
  }, [pathname, parentPath, childPaths]);
}
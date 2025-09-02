"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";

export interface Breadcrumb {
  label: string;
  href: string;
  isActive: boolean;
}

interface RouteMapping {
  [key: string]: string | ((segment: string) => string);
}

const defaultRouteMapping: RouteMapping = {
  lists: "Lists",
  templates: "Templates",
  tags: "Tags",
  categories: "Categories",
  settings: "Settings",
  new: "New",
  edit: "Edit",
};

/**
 * Hook to generate breadcrumbs from the current pathname
 */
export function useBreadcrumbs(customMapping?: RouteMapping): Breadcrumb[] {
  const pathname = usePathname();

  return useMemo(() => {
    const mapping = { ...defaultRouteMapping, ...customMapping };
    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbs: Breadcrumb[] = [];

    // Always add home
    breadcrumbs.push({
      label: "Home",
      href: "/",
      isActive: pathname === "/",
    });

    // Build breadcrumbs from path segments
    let currentPath = "";
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === segments.length - 1;

      // Get label from mapping or capitalize segment
      let label = segment;
      if (mapping[segment]) {
        label = typeof mapping[segment] === "function"
          ? (mapping[segment] as Function)(segment)
          : mapping[segment] as string;
      } else {
        // Check if it's an ID (common patterns)
        if (segment.match(/^[a-f\d]{24}$/i) || segment.match(/^\d+$/)) {
          // For IDs, try to get a better label from the previous segment
          const prevSegment = segments[index - 1];
          if (prevSegment === "lists") {
            label = "List Details";
          } else if (prevSegment === "templates") {
            label = "Template Details";
          } else {
            label = "Details";
          }
        } else {
          // Capitalize and replace hyphens/underscores with spaces
          label = segment
            .replace(/[-_]/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase());
        }
      }

      breadcrumbs.push({
        label,
        href: currentPath,
        isActive: isLast,
      });
    });

    return breadcrumbs;
  }, [pathname, customMapping]);
}

/**
 * Hook to get a formatted breadcrumb string (e.g., "Home > Lists > New")
 */
export function useBreadcrumbString(separator = " > ", customMapping?: RouteMapping): string {
  const breadcrumbs = useBreadcrumbs(customMapping);
  return useMemo(
    () => breadcrumbs.map((crumb) => crumb.label).join(separator),
    [breadcrumbs, separator]
  );
}

/**
 * Hook to get the parent breadcrumb (useful for back navigation)
 */
export function useParentBreadcrumb(customMapping?: RouteMapping): Breadcrumb | null {
  const breadcrumbs = useBreadcrumbs(customMapping);
  return useMemo(() => {
    if (breadcrumbs.length <= 1) return null;
    return breadcrumbs[breadcrumbs.length - 2];
  }, [breadcrumbs]);
}
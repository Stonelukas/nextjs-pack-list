"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { Fragment } from "react";

interface BreadcrumbItem {
  title: string;
  href?: string;
}

export function Breadcrumbs() {
  const pathname = usePathname();

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { title: "Home", href: "/" },
    ];

    let currentPath = "";
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === segments.length - 1;

      // Handle dynamic routes and format titles
      let title = segment;
      
      // Format common route names
      switch (segment) {
        case "lists":
          title = "Lists";
          break;
        case "templates":
          title = "Templates";
          break;
        case "settings":
          title = "Settings";
          break;
        case "new":
          title = "New";
          break;
        case "edit":
          title = "Edit";
          break;
        default:
          // Handle UUIDs or IDs (don't show them in breadcrumbs)
          if (segment.match(/^[a-f0-9-]+$/i) && segment.length > 20) {
            title = "Details";
          } else {
            // Capitalize first letter
            title = segment.charAt(0).toUpperCase() + segment.slice(1);
          }
      }

      breadcrumbs.push({
        title,
        href: isLast ? undefined : currentPath,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't show breadcrumbs on home page
  if (pathname === "/") {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center space-x-1 text-sm text-muted-foreground mb-4"
    >
      {breadcrumbs.map((breadcrumb, index) => (
        <Fragment key={index}>
          {index > 0 && (
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          )}
          {breadcrumb.href ? (
            <Link
              href={breadcrumb.href}
              className={cn(
                "hover:text-foreground transition-colors",
                index === 0 && "flex items-center gap-1"
              )}
            >
              {index === 0 && <Home className="h-3 w-3" />}
              {breadcrumb.title}
            </Link>
          ) : (
            <span
              className={cn(
                "text-foreground font-medium",
                index === 0 && "flex items-center gap-1"
              )}
              aria-current="page"
            >
              {index === 0 && <Home className="h-3 w-3" />}
              {breadcrumb.title}
            </span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
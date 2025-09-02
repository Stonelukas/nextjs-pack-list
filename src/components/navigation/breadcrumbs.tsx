"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { Fragment } from "react";
import { useBreadcrumbs } from "@/hooks/navigation";

export function Breadcrumbs() {
  const pathname = usePathname();
  const breadcrumbs = useBreadcrumbs();

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
          {!breadcrumb.isActive ? (
            <Link
              href={breadcrumb.href}
              className={cn(
                "hover:text-foreground transition-colors",
                index === 0 && "flex items-center gap-1"
              )}
            >
              {index === 0 && <Home className="h-3 w-3" />}
              {breadcrumb.label}
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
              {breadcrumb.label}
            </span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
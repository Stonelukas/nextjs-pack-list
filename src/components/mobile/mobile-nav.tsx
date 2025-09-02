"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package2, FileText, Settings, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRoleBasedAccess } from "@/hooks/use-role-based-navigation";

const getNavItems = (userRole: string) => [
  {
    href: "/",
    icon: Home,
    label: "Home",
  },
  {
    href: "/lists",
    icon: Package2,
    label: "Lists",
    requiredPermissions: ["view_lists"],
  },
  {
    href: "/templates",
    icon: FileText,
    label: "Templates",
    requiredPermissions: ["view_templates"],
  },
  {
    href: "/settings",
    icon: Settings,
    label: "Settings",
  },
  ...(userRole === "admin" ? [{
    href: "/admin",
    icon: Shield,
    label: "Admin",
  }] : []),
];

export function MobileNav() {
  const pathname = usePathname();
  const { userRole, hasAllPermissions } = useRoleBasedAccess();

  // Get filtered navigation items based on user role and permissions
  const navItems = getNavItems(userRole).filter(item => {
    if (!item.requiredPermissions) return true;
    return hasAllPermissions(item.requiredPermissions);
  });

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden"
      role="navigation"
      aria-label="Mobile navigation"
    >
      <div className="flex h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors flex-1",
                "min-h-[44px] min-w-[44px]", // Ensure touch target size
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label={`Navigate to ${item.label}`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
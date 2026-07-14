import { FileText, Home, Package2, Settings, Shield } from "lucide-react";
import { NavLink } from "react-router-dom";

import {
  useRoleBasedAccess,
  type Permission,
} from "@/hooks/use-role-based-navigation";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const { hasAllPermissions, isAdmin } = useRoleBasedAccess();
  const items: Array<{
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    permissions?: Permission[];
  }> = [
    { href: "/", label: "Overview", icon: Home },
    { href: "/lists", label: "Lists", icon: Package2, permissions: ["view_lists"] },
    { href: "/templates", label: "Templates", icon: FileText, permissions: ["view_templates"] },
    { href: "/settings", label: "Settings", icon: Settings, permissions: ["access_settings"] },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: Shield }] : []),
  ];

  return (
    <nav
      className="mobile-nav fixed inset-x-0 bottom-0 z-50 border-t bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Mobile navigation"
    >
      <div className="flex min-h-16 gap-1 p-1">
        {items
          .filter((item) => !item.permissions || hasAllPermissions(item.permissions))
          .map(({ href, icon: Icon, label }) => (
            <NavLink
              key={href}
              to={href}
              end={href === "/"}
              className={({ isActive }) =>
                cn(
                  "relative flex min-h-16 min-w-11 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 text-xs font-semibold transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary ring-1 ring-inset ring-primary/15"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )
              }
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
      </div>
    </nav>
  );
}

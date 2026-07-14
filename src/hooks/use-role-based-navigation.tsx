import { useAuth } from "@clerk/clerk-react";
import { useMemo } from "react";

import { useAdminAccess } from "@/features/admin/hooks/use-admin-access";

export type UserRole = "guest" | "user" | "admin";
export type Permission =
  | "view_lists"
  | "create_lists"
  | "edit_lists"
  | "delete_lists"
  | "view_templates"
  | "create_templates"
  | "edit_templates"
  | "delete_templates"
  | "manage_users"
  | "view_analytics"
  | "access_settings"
  | "export_data"
  | "import_data";

const rolePermissions: Record<UserRole, Permission[]> = {
  guest: ["view_templates"],
  user: ["view_lists", "create_lists", "edit_lists", "delete_lists", "view_templates", "create_templates", "access_settings", "export_data", "import_data"],
  admin: ["view_lists", "create_lists", "edit_lists", "delete_lists", "view_templates", "create_templates", "edit_templates", "delete_templates", "manage_users", "view_analytics", "access_settings", "export_data", "import_data"],
};

export function useRoleBasedAccess() {
  const { isSignedIn } = useAuth();
  const { isAdmin, loading } = useAdminAccess();
  const userRole: UserRole = !isSignedIn ? "guest" : isAdmin ? "admin" : "user";
  const permissions = rolePermissions[userRole];
  const hasPermission = (permission: Permission) => permissions.includes(permission);
  const hasAllPermissions = (required: Permission[]) => required.every(hasPermission);
  const hasAnyPermission = (required: Permission[]) => required.some(hasPermission);
  return { userRole, permissions, hasPermission, hasAllPermissions, hasAnyPermission, loading, isGuest: userRole === "guest", isUser: userRole === "user", isAdmin };
}

export interface RoleBasedNavItem {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  description?: string;
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
  requiredPermissions?: Permission[];
  requiredRole?: UserRole;
  hideForRoles?: UserRole[];
  children?: RoleBasedNavItem[];
}

export function useFilteredNavigation(navItems: RoleBasedNavItem[]) {
  const { userRole, hasAllPermissions } = useRoleBasedAccess();
  return useMemo(() => {
    const filter = (item: RoleBasedNavItem): RoleBasedNavItem | null => {
      if (item.hideForRoles?.includes(userRole)) return null;
      if (item.requiredRole && item.requiredRole !== userRole) return null;
      if (item.requiredPermissions && !hasAllPermissions(item.requiredPermissions)) return null;
      const children = item.children?.map(filter).filter((value): value is RoleBasedNavItem => value !== null);
      return { ...item, children };
    };
    return navItems.map(filter).filter((value): value is RoleBasedNavItem => value !== null);
  }, [hasAllPermissions, navItems, userRole]);
}

export function useRoleBasedActions() {
  const { hasPermission, userRole } = useRoleBasedAccess();
  return {
    canCreateList: hasPermission("create_lists"),
    canEditList: hasPermission("edit_lists"),
    canDeleteList: hasPermission("delete_lists"),
    canCreateTemplate: hasPermission("create_templates"),
    canEditTemplate: hasPermission("edit_templates"),
    canDeleteTemplate: hasPermission("delete_templates"),
    canAccessSettings: hasPermission("access_settings"),
    canExportData: hasPermission("export_data"),
    canImportData: hasPermission("import_data"),
    canManageUsers: hasPermission("manage_users"),
    canViewAnalytics: hasPermission("view_analytics"),
    isGuest: userRole === "guest",
    requiresUpgrade: (permission: Permission) => !hasPermission(permission) && userRole !== "admin",
  };
}

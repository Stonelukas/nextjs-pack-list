"use client";

import { useMemo } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useConvexStore } from "@/hooks/use-convex-store";

// Define user roles (can be extended)
export type UserRole = "guest" | "user" | "premium" | "admin";

// Define permission types
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

// Role to permissions mapping
const rolePermissions: Record<UserRole, Permission[]> = {
  guest: [
    "view_templates", // Guests can only browse templates
  ],
  user: [
    "view_lists",
    "create_lists",
    "edit_lists",
    "delete_lists",
    "view_templates",
    "access_settings",
    "export_data",
    "import_data",
  ],
  premium: [
    "view_lists",
    "create_lists",
    "edit_lists",
    "delete_lists",
    "view_templates",
    "create_templates",
    "edit_templates",
    "delete_templates",
    "access_settings",
    "export_data",
    "import_data",
  ],
  admin: [
    // All permissions
    "view_lists",
    "create_lists",
    "edit_lists",
    "delete_lists",
    "view_templates",
    "create_templates",
    "edit_templates",
    "delete_templates",
    "manage_users",
    "view_analytics",
    "access_settings",
    "export_data",
    "import_data",
  ],
};

/**
 * Hook to get user role and check permissions
 */
export function useRoleBasedAccess() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { user: convexUser } = useConvexStore();

  // Determine user role based on authentication state and user data
  const userRole = useMemo((): UserRole => {
    if (!isSignedIn) return "guest";

    const userEmail = user?.primaryEmailAddress?.emailAddress;

    // Check for admin role based on email
    if (userEmail === "stonelukas@pm.me" || userEmail?.includes("admin")) {
      return "admin";
    }

    // This can be extended to check user metadata, subscriptions, etc.
    // if (convexUser?.subscription === 'premium') return 'premium';
    // if (convexUser?.role === 'admin') return 'admin';

    return "user";
  }, [isSignedIn, user, convexUser]);

  // Get permissions for current user role
  const permissions = useMemo(
    () => rolePermissions[userRole] || [],
    [userRole]
  );

  // Check if user has specific permission
  const hasPermission = useMemo(
    () => (permission: Permission) => permissions.includes(permission),
    [permissions]
  );

  // Check multiple permissions (all must be true)
  const hasAllPermissions = useMemo(
    () => (requiredPermissions: Permission[]) =>
      requiredPermissions.every(permission => permissions.includes(permission)),
    [permissions]
  );

  // Check multiple permissions (at least one must be true)
  const hasAnyPermission = useMemo(
    () => (requiredPermissions: Permission[]) =>
      requiredPermissions.some(permission => permissions.includes(permission)),
    [permissions]
  );

  return {
    userRole,
    permissions,
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    isGuest: userRole === "guest",
    isUser: userRole === "user",
    isPremium: userRole === "premium",
    isAdmin: userRole === "admin",
  };
}

/**
 * Navigation item with role-based visibility
 */
export interface RoleBasedNavItem {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  requiredPermissions?: Permission[];
  requiredRole?: UserRole;
  hideForRoles?: UserRole[];
  children?: RoleBasedNavItem[];
}

/**
 * Hook to filter navigation items based on user permissions
 */
export function useFilteredNavigation(navItems: RoleBasedNavItem[]): RoleBasedNavItem[] {
  const { userRole, hasAllPermissions, hasAnyPermission } = useRoleBasedAccess();

  return useMemo(() => {
    const filterItem = (item: RoleBasedNavItem): RoleBasedNavItem | null => {
      // Check if item should be hidden for current role
      if (item.hideForRoles?.includes(userRole)) {
        return null;
      }

      // Check required role
      if (item.requiredRole && userRole !== item.requiredRole) {
        // Allow higher privilege roles to see lower role items
        const roleHierarchy: UserRole[] = ["guest", "user", "premium", "admin"];
        const currentRoleIndex = roleHierarchy.indexOf(userRole);
        const requiredRoleIndex = roleHierarchy.indexOf(item.requiredRole);
        
        if (currentRoleIndex < requiredRoleIndex) {
          return null;
        }
      }

      // Check required permissions
      if (item.requiredPermissions) {
        if (!hasAllPermissions(item.requiredPermissions)) {
          return null;
        }
      }

      // Filter children recursively
      const filteredChildren = item.children
        ?.map(filterItem)
        .filter((child): child is RoleBasedNavItem => child !== null);

      return {
        ...item,
        children: filteredChildren,
      };
    };

    return navItems
      .map(filterItem)
      .filter((item): item is RoleBasedNavItem => item !== null);
  }, [navItems, userRole, hasAllPermissions]);
}

/**
 * Hook to get role-based action availability
 */
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
    
    // Helper methods
    isGuest: userRole === "guest",
    requiresUpgrade: (permission: Permission) => 
      !hasPermission(permission) && userRole !== "admin",
  };
}
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRoleBasedAccess } from "@/hooks/use-role-based-navigation";
import {
  Download,
  Edit,
  Share2,
  Copy,
  Trash2,
  Plus,
  Settings,
  FileText,
  Archive,
  CheckCircle,
  XCircle,
  Users,
  BarChart3,
  Shield,
} from "lucide-react";

type ContextAction = {
  title: string;
  href?: string;
  onClick?: () => void;
  icon: React.ReactNode;
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
  roles?: string[];
};

const getContextualActions = (pathname: string): ContextAction[] => {
  // List detail page actions
  if (pathname.match(/^\/lists\/[^\/]+$/)) {
    const listId = pathname.split("/")[2];
    return [
      {
        title: "Edit List",
        href: `/lists/${listId}/edit`,
        icon: <Edit className="h-4 w-4 mr-2" />,
        variant: "outline",
      },
      {
        title: "Share",
        href: `/lists/${listId}/share`,
        icon: <Share2 className="h-4 w-4 mr-2" />,
        variant: "outline",
      },
      {
        title: "Export",
        onClick: () => {
          // Export functionality will be handled by export dialog
          const exportButton = document.querySelector('[data-export-trigger]') as HTMLButtonElement;
          exportButton?.click();
        },
        icon: <Download className="h-4 w-4 mr-2" />,
        variant: "outline",
      },
      {
        title: "Duplicate",
        onClick: () => {
          // Duplicate functionality
          console.log("Duplicate list:", listId);
        },
        icon: <Copy className="h-4 w-4 mr-2" />,
        variant: "outline",
      },
      {
        title: "Archive",
        onClick: () => {
          // Archive functionality
          console.log("Archive list:", listId);
        },
        icon: <Archive className="h-4 w-4 mr-2" />,
        variant: "outline",
      },
      {
        title: "Delete",
        onClick: () => {
          // Delete functionality with confirmation
          if (confirm("Are you sure you want to delete this list?")) {
            console.log("Delete list:", listId);
          }
        },
        icon: <Trash2 className="h-4 w-4 mr-2" />,
        variant: "destructive",
      },
    ];
  }

  // Lists page actions
  if (pathname === "/lists") {
    return [
      {
        title: "New List",
        href: "/lists/new",
        icon: <Plus className="h-4 w-4 mr-2" />,
        variant: "default",
      },
      {
        title: "Import",
        onClick: () => {
          // Import functionality
          const importButton = document.querySelector('[data-import-trigger]') as HTMLButtonElement;
          importButton?.click();
        },
        icon: <FileText className="h-4 w-4 mr-2" />,
        variant: "outline",
      },
    ];
  }

  // Templates page actions
  if (pathname === "/templates") {
    return [
      {
        title: "Create Template",
        href: "/templates/new",
        icon: <Plus className="h-4 w-4 mr-2" />,
        variant: "default",
      },
      {
        title: "Browse Gallery",
        href: "/templates/gallery",
        icon: <FileText className="h-4 w-4 mr-2" />,
        variant: "outline",
      },
    ];
  }

  // Template detail page actions
  if (pathname.match(/^\/templates\/[^\/]+$/)) {
    const templateId = pathname.split("/")[2];
    return [
      {
        title: "Use Template",
        onClick: () => {
          // Use template functionality
          console.log("Use template:", templateId);
        },
        icon: <CheckCircle className="h-4 w-4 mr-2" />,
        variant: "default",
      },
      {
        title: "Edit Template",
        href: `/templates/${templateId}/edit`,
        icon: <Edit className="h-4 w-4 mr-2" />,
        variant: "outline",
      },
      {
        title: "Duplicate",
        onClick: () => {
          // Duplicate template
          console.log("Duplicate template:", templateId);
        },
        icon: <Copy className="h-4 w-4 mr-2" />,
        variant: "outline",
      },
      {
        title: "Delete",
        onClick: () => {
          // Delete template with confirmation
          if (confirm("Are you sure you want to delete this template?")) {
            console.log("Delete template:", templateId);
          }
        },
        icon: <Trash2 className="h-4 w-4 mr-2" />,
        variant: "destructive",
      },
    ];
  }

  // Settings page actions
  if (pathname.startsWith("/settings")) {
    return [
      {
        title: "Profile",
        href: "/settings/profile",
        icon: <Settings className="h-4 w-4 mr-2" />,
        variant: pathname === "/settings/profile" ? "secondary" : "outline",
      },
      {
        title: "Preferences",
        href: "/settings/preferences",
        icon: <Settings className="h-4 w-4 mr-2" />,
        variant: pathname === "/settings/preferences" ? "secondary" : "outline",
      },
      {
        title: "Account",
        href: "/settings/account",
        icon: <Settings className="h-4 w-4 mr-2" />,
        variant: pathname === "/settings/account" ? "secondary" : "outline",
      },
    ];
  }

  // Admin pages (role-based) - No contextual nav needed, admin dashboard is self-contained
  if (pathname.startsWith("/admin")) {
    return [];
  }

  // Dashboard/Home page actions
  if (pathname === "/" || pathname === "/dashboard") {
    return [
      {
        title: "New List",
        href: "/lists/new",
        icon: <Plus className="h-4 w-4 mr-2" />,
        variant: "default",
      },
      {
        title: "Browse Templates",
        href: "/templates",
        icon: <FileText className="h-4 w-4 mr-2" />,
        variant: "outline",
      },
    ];
  }

  // Default empty actions
  return [];
};

export function ContextualNav() {
  const pathname = usePathname();
  const { userRole, hasPermission } = useRoleBasedAccess();

  // Get actions for current path
  const actions = getContextualActions(pathname).filter(action => {
    // Filter by role if specified
    if (action.roles && action.roles.length > 0) {
      return action.roles.includes(userRole);
    }
    return true;
  });

  // Don't render if no actions available
  if (actions.length === 0) return null;

  return (
    <div className="flex items-center gap-2 py-2 border-t">
      {actions.map((action, index) => (
        action.href ? (
          <Link key={index} href={action.href}>
            <Button 
              variant={action.variant || "outline"} 
              size="sm"
              className="h-8"
            >
              {action.icon}
              <span className="hidden sm:inline">{action.title}</span>
              <span className="sm:hidden">{action.title.split(" ")[0]}</span>
            </Button>
          </Link>
        ) : (
          <Button
            key={index}
            variant={action.variant || "outline"}
            size="sm"
            onClick={action.onClick}
            className="h-8"
          >
            {action.icon}
            <span className="hidden sm:inline">{action.title}</span>
            <span className="sm:hidden">{action.title.split(" ")[0]}</span>
          </Button>
        )
      ))}
    </div>
  );
}
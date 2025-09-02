"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useNavigationStore } from "@/store/navigation-store";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronRight,
  ChevronDown,
  Home,
  List,
  LayoutTemplate,
  Plus,
  Settings,
  Archive,
  Star,
  Clock,
  CheckCircle,
  Circle,
  Tag,
  Folder,
} from "lucide-react";
import { useConvexStore } from "@/hooks/use-convex-store";
import { 
  useFilteredNavigation, 
  useRoleBasedActions,
  useRoleBasedAccess,
  type RoleBasedNavItem,
  type Permission 
} from "@/hooks/use-role-based-navigation";

interface SidebarProps {
  className?: string;
}

interface NavSection {
  title: string;
  items: RoleBasedNavItem[];
  collapsible?: boolean;
  defaultOpen?: boolean;
  requiredPermissions?: Permission[];
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { lists } = useConvexStore();
  const { 
    sidebarOpen, 
    sidebarCollapsed,
    toggleSection,
    isSectionCollapsed,
    setActiveSection
  } = useNavigationStore();
  const { canCreateList, canCreateTemplate } = useRoleBasedActions();
  const { hasAllPermissions } = useRoleBasedAccess();

  // Set active section based on pathname
  useEffect(() => {
    if (pathname.startsWith('/lists')) {
      setActiveSection('lists');
    } else if (pathname.startsWith('/templates')) {
      setActiveSection('templates');
    } else if (pathname.startsWith('/tags') || pathname.startsWith('/categories')) {
      setActiveSection('organize');
    } else {
      setActiveSection('main');
    }
  }, [pathname, setActiveSection]);

  const isActive = (href: string) => {
    if (href === "/" && pathname === "/") return true;
    if (href !== "/" && pathname.startsWith(href)) return true;
    return false;
  };

  // Calculate list statistics
  const activeListCount = lists.filter((list) => !list.completedAt).length;
  const completedListCount = lists.filter((list) => list.completedAt).length;
  const templateCount = lists.filter((list) => list.isTemplate).length;

  const navSections: NavSection[] = [
    {
      title: "Main",
      collapsible: false,
      items: [
        {
          title: "Dashboard",
          href: "/",
          icon: Home,
        },
        {
          title: "New List",
          href: "/lists/new",
          icon: Plus,
          requiredPermissions: ["create_lists"],
        },
      ],
    },
    {
      title: "Lists",
      collapsible: true,
      defaultOpen: true,
      requiredPermissions: ["view_lists"],
      items: [
        {
          title: "All Lists",
          href: "/lists",
          icon: List,
          badge: lists.length,
          requiredPermissions: ["view_lists"],
        },
        {
          title: "Active",
          href: "/lists?status=active",
          icon: Circle,
          badge: activeListCount,
          requiredPermissions: ["view_lists"],
        },
        {
          title: "Completed",
          href: "/lists?status=completed",
          icon: CheckCircle,
          badge: completedListCount,
          requiredPermissions: ["view_lists"],
        },
        {
          title: "Archived",
          href: "/lists?status=archived",
          icon: Archive,
          badge: 0,
          requiredPermissions: ["view_lists"],
        },
      ],
    },
    {
      title: "Templates",
      collapsible: true,
      defaultOpen: false,
      requiredPermissions: ["view_templates"],
      items: [
        {
          title: "Browse Templates",
          href: "/templates",
          icon: LayoutTemplate,
          requiredPermissions: ["view_templates"],
        },
        {
          title: "My Templates",
          href: "/templates?filter=mine",
          icon: Star,
          badge: templateCount,
          requiredPermissions: ["create_templates"],
        },
        {
          title: "Recent",
          href: "/templates?filter=recent",
          icon: Clock,
          requiredPermissions: ["view_templates"],
        },
      ],
    },
    {
      title: "Organize",
      collapsible: true,
      defaultOpen: false,
      requiredPermissions: ["view_lists"],
      items: [
        {
          title: "Tags",
          href: "/tags",
          icon: Tag,
          requiredPermissions: ["view_lists"],
        },
        {
          title: "Categories",
          href: "/categories",
          icon: Folder,
          requiredPermissions: ["view_lists"],
        },
      ],
    },
  ];

  // Apply role-based filtering to navigation sections
  const filteredSections = navSections
    .map(section => {
      // Filter section items
      const filteredItems = useFilteredNavigation(section.items);
      
      // Only show section if it has visible items and user has required permissions
      if (filteredItems.length === 0) return null;
      
      // Check section-level permissions
      if (section.requiredPermissions) {
        if (!hasAllPermissions(section.requiredPermissions)) return null;
      }
      
      return {
        ...section,
        items: filteredItems,
      };
    })
    .filter((section): section is NavSection => section !== null);

  // Recent lists for quick access
  const recentLists = lists
    .sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt).getTime();
      return dateB - dateA;
    })
    .slice(0, 5);

  return (
    <aside
      className={cn(
        "flex h-full w-64 flex-col border-r bg-background",
        className
      )}
    >
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-4 py-4">
          {filteredSections.map((section) => (
            <div key={section.title}>
              {section.collapsible ? (
                <Collapsible
                  open={!isSectionCollapsed(section.title.toLowerCase())}
                  onOpenChange={() =>
                    toggleSection(section.title.toLowerCase())
                  }
                >
                  <CollapsibleTrigger className="flex w-full items-center justify-between px-2 py-1.5 text-sm font-semibold hover:bg-accent rounded-md transition-colors">
                    <span>{section.title}</span>
                    {!isSectionCollapsed(section.title.toLowerCase()) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 mt-1">
                    {section.items.map((item) => (
                      <SidebarNavItem
                        key={item.href}
                        item={item}
                        isActive={isActive(item.href)}
                      />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <>
                  <h4 className="px-2 py-1.5 text-sm font-semibold">
                    {section.title}
                  </h4>
                  <div className="space-y-1">
                    {section.items.map((item) => (
                      <SidebarNavItem
                        key={item.href}
                        item={item}
                        isActive={isActive(item.href)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}

          {/* Recent Lists Section */}
          {recentLists.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="px-2 py-1.5 text-sm font-semibold">
                  Recent Lists
                </h4>
                <div className="space-y-1">
                  {recentLists.map((list) => (
                    <Link
                      key={list._id}
                      href={`/lists/${list._id}`}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors",
                        pathname === `/lists/${list._id}` &&
                          "bg-accent text-accent-foreground"
                      )}
                    >
                      <List className="h-4 w-4" />
                      <span className="truncate">{list.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>

      {/* Settings at bottom */}
      <div className="border-t p-3">
        <Link href="/settings">
          <Button
            variant={pathname === "/settings" ? "secondary" : "ghost"}
            className="w-full justify-start"
            size="sm"
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </Link>
      </div>
    </aside>
  );
}

interface SidebarNavItemProps {
  item: RoleBasedNavItem;
  isActive: boolean;
  depth?: number;
}

function SidebarNavItem({
  item,
  isActive,
  depth = 0,
}: SidebarNavItemProps) {
  const Icon = item.icon;

  return (
    <>
      <Link
        href={item.href}
        className={cn(
          "flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors",
          isActive && "bg-accent text-accent-foreground font-medium",
          depth > 0 && "ml-4"
        )}
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <span>{item.title}</span>
        </div>
        {item.badge !== undefined && item.badge > 0 && (
          <span
            className={cn(
              "flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-xs",
              isActive
                ? "bg-background text-accent-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {item.badge}
          </span>
        )}
      </Link>
      {item.children?.map((child) => (
        <SidebarNavItem
          key={child.href}
          item={child}
          isActive={isActive}
          depth={depth + 1}
        />
      ))}
    </>
  );
}
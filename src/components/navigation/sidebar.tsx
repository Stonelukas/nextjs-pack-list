import {
  CheckCircle,
  Circle,
  Folder,
  Home,
  LayoutTemplate,
  List,
  Plus,
  Settings,
  Shield,
  Star,
  Tag,
} from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";

import { ScrollArea } from "@/components/ui/scroll-area";
import { useLists } from "@/features/lists/hooks/use-lists";
import { useRoleBasedAccess } from "@/hooks/use-role-based-navigation";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
}

interface SidebarLink {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  show?: boolean;
}

function isCurrentLink(pathname: string, search: string, href: string) {
  const [targetPathname, targetSearch = ""] = href.split("?");
  if (pathname !== targetPathname) return false;

  const current = new URLSearchParams(search);
  const target = new URLSearchParams(targetSearch);
  if (targetPathname === "/lists") {
    return current.get("status") === target.get("status");
  }
  if (targetPathname === "/templates") {
    return current.get("filter") === target.get("filter");
  }
  return true;
}

function groupHeadingId(title: string) {
  return `sidebar-${title.toLowerCase().replaceAll(" ", "-")}`;
}

function NavigationGroup({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  const headingId = groupHeadingId(title);

  return (
    <section aria-labelledby={headingId}>
      <h2
        className="mb-2 px-3 text-xs font-semibold tracking-wide text-muted-foreground"
        id={headingId}
      >
        {title}
      </h2>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

function SidebarNavigationLink({
  badge,
  current,
  href,
  icon: Icon,
  title,
}: SidebarLink & { current: boolean }) {
  return (
    <Link
      to={href}
      aria-current={current ? "page" : undefined}
      aria-label={typeof badge === "number" && badge > 0 ? `${title}, ${badge}` : undefined}
      className={cn(
        "flex min-h-11 items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted",
        current &&
          "bg-primary/10 text-primary ring-1 ring-inset ring-primary/15",
      )}
    >
      <span className="flex min-w-0 items-center gap-3">
        <Icon className="size-4 shrink-0" aria-hidden="true" />
        <span className="truncate">{title}</span>
      </span>
      {typeof badge === "number" && badge > 0 ? (
        <span className="ml-2 min-w-6 rounded-full bg-surface px-2 py-0.5 text-center text-xs font-semibold text-muted-foreground ring-1 ring-inset ring-border">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation();
  const { lists } = useLists();
  const { hasPermission, isAdmin } = useRoleBasedAccess();
  const values = lists ?? [];
  const active = values.filter((list) => !list.completedAt).length;
  const completed = values.filter((list) => list.completedAt).length;
  const recent = [...values]
    .sort(
      (left, right) =>
        (right.updatedAt ?? right._creationTime) -
        (left.updatedAt ?? left._creationTime),
    )
    .slice(0, 5);
  const listLinks: SidebarLink[] = [
    { title: "Dashboard", href: "/", icon: Home },
    {
      title: "New list",
      href: "/lists/new",
      icon: Plus,
      show: hasPermission("create_lists"),
    },
    {
      title: "All lists",
      href: "/lists",
      icon: List,
      badge: values.length,
      show: hasPermission("view_lists"),
    },
    {
      title: "Active",
      href: "/lists?status=active",
      icon: Circle,
      badge: active,
      show: hasPermission("view_lists"),
    },
    {
      title: "Completed",
      href: "/lists?status=completed",
      icon: CheckCircle,
      badge: completed,
      show: hasPermission("view_lists"),
    },
  ].filter((link) => link.show !== false);
  const organizeLinks: SidebarLink[] = [
    {
      title: "Templates",
      href: "/templates",
      icon: LayoutTemplate,
      show: hasPermission("view_templates"),
    },
    {
      title: "My templates",
      href: "/templates?filter=mine",
      icon: Star,
      show: hasPermission("create_templates"),
    },
    {
      title: "Categories",
      href: "/categories",
      icon: Folder,
      show: hasPermission("view_lists"),
    },
    {
      title: "Tags",
      href: "/tags",
      icon: Tag,
      show: hasPermission("view_lists"),
    },
  ].filter((link) => link.show !== false);

  return (
    <aside
      className={cn(
        "flex h-full w-64 flex-col border-r bg-surface-muted/55",
        className,
      )}
      aria-label="Journey navigation"
    >
      <ScrollArea className="flex-1 px-3">
        <nav className="space-y-6 py-5" aria-label="Journey views">
          <NavigationGroup title="Lists">
            {listLinks.map((link) => (
              <SidebarNavigationLink
                {...link}
                key={link.href}
                current={isCurrentLink(
                  location.pathname,
                  location.search,
                  link.href,
                )}
              />
            ))}
          </NavigationGroup>

          <NavigationGroup title="Organize">
            {organizeLinks.map((link) => (
              <SidebarNavigationLink
                {...link}
                key={link.href}
                current={isCurrentLink(
                  location.pathname,
                  location.search,
                  link.href,
                )}
              />
            ))}
          </NavigationGroup>

          <NavigationGroup title="Recent">
            {recent.length ? (
              recent.map((list) => (
                <NavLink
                  key={list._id}
                  to={`/lists/${list._id}`}
                  className={({ isActive }) =>
                    cn(
                      "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted",
                      isActive &&
                        "bg-primary/10 text-primary ring-1 ring-inset ring-primary/15",
                    )
                  }
                >
                  <List className="size-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{list.name}</span>
                </NavLink>
              ))
            ) : (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                Your latest lists will appear here.
              </p>
            )}
          </NavigationGroup>

          <NavigationGroup title="Settings">
            <SidebarNavigationLink
              title="Settings"
              href="/settings"
              icon={Settings}
              current={isCurrentLink(
                location.pathname,
                location.search,
                "/settings",
              )}
            />
            {isAdmin ? (
              <SidebarNavigationLink
                title="Admin"
                href="/admin"
                icon={Shield}
                current={isCurrentLink(
                  location.pathname,
                  location.search,
                  "/admin",
                )}
              />
            ) : null}
          </NavigationGroup>
        </nav>
      </ScrollArea>
    </aside>
  );
}

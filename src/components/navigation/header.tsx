import { UserButton } from "@clerk/clerk-react";
import {
  Home,
  LayoutTemplate,
  List,
  LogIn,
  Menu,
  PanelLeft,
  PanelLeftClose,
  Plus,
  Route,
  Settings,
  Shield,
} from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";

import { useAuthReadiness } from "@/app/auth/auth-readiness";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { clerkAppearance } from "@/features/auth/clerk-appearance";
import {
  useRoleBasedAccess,
  type Permission,
} from "@/hooks/use-role-based-navigation";
import { cn } from "@/lib/utils";
import { useNavigationStore } from "@/store/navigation-store";

interface NavItem {
  title: string;
  href: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: Permission;
}

interface HeaderFrameProps {
  accountControl: React.ReactNode;
  desktopItems?: NavItem[];
  mobileItems: NavItem[];
  newListControl?: React.ReactNode;
  signedIn?: boolean;
}

const publicItems: NavItem[] = [
  {
    title: "Home",
    href: "/",
    description: "A calmer packing workspace",
    icon: Home,
  },
  {
    title: "Templates",
    href: "/templates",
    description: "Useful starting points",
    icon: LayoutTemplate,
  },
];

const signedInItems: NavItem[] = [
  {
    title: "Overview",
    href: "/",
    description: "Your packing workspace",
    icon: Home,
  },
  {
    title: "Lists",
    href: "/lists",
    description: "Your trip lists",
    icon: List,
    permission: "view_lists",
  },
  {
    title: "Templates",
    href: "/templates",
    description: "Useful starting points",
    icon: LayoutTemplate,
    permission: "view_templates",
  },
];

function HeaderFrame({
  accountControl,
  desktopItems,
  mobileItems,
  newListControl,
  signedIn = false,
}: HeaderFrameProps) {
  const {
    mobileMenuOpen,
    setMobileMenuOpen,
    sidebarOpen,
    toggleSidebar,
  } = useNavigationStore();

  return (
    <header className="app-header sticky top-0 z-50 w-full border-b bg-surface/95 backdrop-blur">
      <div className="app-frame flex h-16 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {signedIn ? (
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:inline-flex"
              onClick={toggleSidebar}
              aria-label={
                sidebarOpen ? "Close navigation rail" : "Open navigation rail"
              }
            >
              {sidebarOpen ? <PanelLeftClose /> : <PanelLeft />}
            </Button>
          ) : null}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Open navigation menu"
              >
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-card">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-xl font-semibold tracking-tight">
                  <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/15">
                    <Route className="size-5" aria-hidden="true" />
                  </span>
                  Route Ledger
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-5 space-y-1 px-2" aria-label="Primary navigation">
                {mobileItems.map(({ description, href, icon: Icon, title }) => (
                  <NavLink
                    key={href}
                    to={href}
                    end={href === "/"}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-foreground transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary ring-1 ring-inset ring-primary/15"
                          : "hover:bg-muted",
                      )
                    }
                  >
                    <Icon className="size-5" aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block font-semibold">{title}</span>
                      <span className="block text-sm text-muted-foreground">
                        {description}
                      </span>
                    </span>
                  </NavLink>
                ))}
                {signedIn ? (
                  <NavLink
                    to="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 font-semibold transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary ring-1 ring-inset ring-primary/15"
                          : "hover:bg-muted",
                      )
                    }
                  >
                    <Settings className="size-5" aria-hidden="true" />
                    Settings
                  </NavLink>
                ) : null}
              </nav>
            </SheetContent>
          </Sheet>
          <Link
            to="/"
            className="flex min-h-11 min-w-11 items-center gap-2 rounded-xl font-semibold tracking-tight text-foreground"
            aria-label="Route Ledger home"
          >
            <span className="hidden size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/15 sm:grid">
              <Route className="size-5" aria-hidden="true" />
            </span>
            <span className="whitespace-nowrap text-lg sm:text-xl">Route Ledger</span>
          </Link>
        </div>

        {desktopItems ? (
          <nav
            className="hidden items-center gap-1 lg:flex"
            aria-label="Primary navigation"
          >
            {desktopItems.map(({ href, title }) => (
              <NavLink
                key={href}
                to={href}
                end={href === "/"}
                className={({ isActive }) =>
                  cn(
                    "flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary ring-1 ring-inset ring-primary/15"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )
                }
              >
                {title}
              </NavLink>
            ))}
          </nav>
        ) : null}

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {newListControl}
          <ThemeToggle />
          {accountControl}
        </div>
      </div>
    </header>
  );
}

function ReadySignedInHeader() {
  const navigate = useNavigate();
  const { hasPermission, isAdmin } = useRoleBasedAccess();
  const items: NavItem[] = isAdmin
    ? [
        ...signedInItems,
        {
          title: "Admin",
          href: "/admin",
          description: "Manage people and access",
          icon: Shield,
        },
      ]
    : signedInItems;
  const visibleItems = items.filter(
    (item) => !item.permission || hasPermission(item.permission),
  );

  return (
    <HeaderFrame
      signedIn
      mobileItems={visibleItems}
      newListControl={
        hasPermission("create_lists") ? (
          <Button
            className="hidden sm:inline-flex"
            size="sm"
            onClick={() => navigate("/lists/new")}
          >
            <Plus aria-hidden="true" /> New list
          </Button>
        ) : null
      }
      accountControl={
        <div className="grid min-h-11 min-w-11 place-items-center [&_button]:min-h-11 [&_button]:min-w-11">
          <UserButton appearance={clerkAppearance} afterSignOutUrl="/" />
        </div>
      }
    />
  );
}

function PublicHeader() {
  return (
    <HeaderFrame
      desktopItems={publicItems}
      mobileItems={publicItems}
      accountControl={
        <Button
          asChild
          size="icon"
          className="px-0 sm:w-auto sm:px-3"
          title="Sign in"
        >
          <Link to="/sign-in">
            <LogIn aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">Sign in</span>
          </Link>
        </Button>
      }
    />
  );
}

export function Header() {
  const auth = useAuthReadiness();

  if (auth.status === "ready" && auth.isSignedIn) {
    return <ReadySignedInHeader />;
  }

  return <PublicHeader />;
}

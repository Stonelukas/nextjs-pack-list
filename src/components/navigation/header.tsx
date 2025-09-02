"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Menu,
  Package,
  Plus,
  List,
  Template,
  Settings,
  Home,
  ChevronRight,
  Sparkles,
  LogIn,
} from "lucide-react";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { isSignedIn, user } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    {
      title: "Dashboard",
      href: "/",
      icon: Home,
      description: "Overview of your packing lists",
    },
    {
      title: "Lists",
      href: "/lists",
      icon: List,
      description: "Manage your packing lists",
    },
    {
      title: "Templates",
      href: "/templates",
      icon: Template,
      description: "Browse and create templates",
    },
  ];

  const quickActions = [
    {
      title: "New List",
      href: "/lists/new",
      icon: Plus,
      variant: "default" as const,
    },
    {
      title: "Quick Start",
      href: "/templates",
      icon: Sparkles,
      variant: "outline" as const,
    },
  ];

  const handleNavigation = (href: string) => {
    router.push(href);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Trigger */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Pack List
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-6 space-y-2">
                {navItems.map((item) => (
                  <button
                    key={item.href}
                    onClick={() => handleNavigation(item.href)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                      isActive(item.href) &&
                        "bg-accent text-accent-foreground font-medium"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <div className="text-left">
                        <div>{item.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.description}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ))}

                {/* Quick Actions in Mobile Menu */}
                <div className="border-t pt-4 mt-4">
                  <div className="text-xs font-semibold text-muted-foreground mb-2">
                    Quick Actions
                  </div>
                  {quickActions.map((action) => (
                    <button
                      key={action.href}
                      onClick={() => handleNavigation(action.href)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <action.icon className="h-4 w-4" />
                      {action.title}
                    </button>
                  ))}
                </div>

                {/* Settings in Mobile Menu */}
                {isSignedIn && (
                  <div className="border-t pt-4 mt-4">
                    <button
                      onClick={() => handleNavigation("/settings")}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </button>
                  </div>
                )}
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Package className="h-6 w-6" />
            <span className="font-bold text-lg hidden sm:inline-block">
              Pack List
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-2">
          <NavigationMenu>
            <NavigationMenuList>
              {navItems.map((item) => (
                <NavigationMenuItem key={item.href}>
                  <Link href={item.href} legacyBehavior passHref>
                    <NavigationMenuLink
                      className={cn(
                        "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
                        isActive(item.href) && "bg-accent/50"
                      )}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.title}
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Actions - Desktop Only */}
          <div className="hidden md:flex items-center gap-2">
            {quickActions.map((action) => (
              <Button
                key={action.href}
                variant={action.variant}
                size="sm"
                onClick={() => router.push(action.href)}
              >
                <action.icon className="h-4 w-4 mr-1" />
                {action.title}
              </Button>
            ))}
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Account */}
          {isSignedIn ? (
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8",
                },
              }}
            />
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={() => router.push("/sign-in")}
            >
              <LogIn className="h-4 w-4 mr-1" />
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
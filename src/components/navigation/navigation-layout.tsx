import { useEffect } from "react";

import { useNavigationStore } from "@/store/navigation-store";
import { Breadcrumbs } from "./breadcrumbs";
import { ContextualNav } from "./contextual-nav";
import { Sidebar } from "./sidebar";
import { cn } from "@/lib/utils";

interface NavigationLayoutProps {
  children: React.ReactNode;
}

export function NavigationLayout({ children }: NavigationLayoutProps) {
  const { sidebarOpen, sidebarCollapsed } = useNavigationStore();

  useEffect(() => {
    const handleResize = () => {
      const { setMobileMenuOpen, setSidebarOpen } = useNavigationStore.getState();
      if (window.innerWidth >= 1024) setMobileMenuOpen(false);
      else setSidebarOpen(false);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      <div
        className={cn(
          "hidden shrink-0 transition-[width] duration-150 lg:block",
          !sidebarOpen && "lg:hidden",
          sidebarCollapsed ? "w-20" : "w-64",
        )}
      >
        {sidebarOpen ? <Sidebar /> : null}
      </div>
      <main id="main-content" className="min-w-0 flex-1 overflow-y-auto" tabIndex={-1}>
        <div className="app-frame pt-5 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-6">
          <Breadcrumbs />
          <ContextualNav />
          {children}
        </div>
      </main>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { useNavigationStore } from "@/store/navigation-store";
import { Sidebar } from "./sidebar";
import { Breadcrumbs } from "./breadcrumbs";
import { ContextualNav } from "./contextual-nav";
import { cn } from "@/lib/utils";

interface NavigationLayoutProps {
  children: React.ReactNode;
}

export function NavigationLayout({ children }: NavigationLayoutProps) {
  const { sidebarOpen, sidebarCollapsed } = useNavigationStore();

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const { setSidebarOpen, setMobileMenuOpen } = useNavigationStore.getState();
      const isDesktop = window.innerWidth >= 1024; // lg breakpoint
      
      if (isDesktop) {
        setMobileMenuOpen(false);
        // Don't auto-open sidebar on resize if user has closed it
        // This respects user preference
      } else {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Desktop Sidebar */}
      <div 
        className={cn(
          "hidden lg:block transition-all duration-300",
          !sidebarOpen && "lg:hidden",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        {sidebarOpen && <Sidebar />}
      </div>
      
      {/* Main Content */}
      <main 
        id="main-content" 
        className={cn(
          "flex-1 overflow-y-auto transition-all duration-300",
          sidebarOpen && !sidebarCollapsed && "lg:ml-0",
          sidebarOpen && sidebarCollapsed && "lg:ml-0"
        )}
      >
        <div className="container mx-auto px-4 py-6">
          <Breadcrumbs />
          <ContextualNav />
          {children}
        </div>
      </main>
    </div>
  );
}
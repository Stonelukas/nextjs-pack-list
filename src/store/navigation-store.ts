import { useEffect } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface NavigationState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  collapsedSections: Set<string>;
  mobileMenuOpen: boolean;
  toggleSidebar(): void;
  setSidebarOpen(open: boolean): void;
  toggleSidebarCollapsed(): void;
  setSidebarCollapsed(collapsed: boolean): void;
  toggleSection(sectionId: string): void;
  isSectionCollapsed(sectionId: string): boolean;
  setMobileMenuOpen(open: boolean): void;
  toggleMobileMenu(): void;
  resetNavigation(): void;
}

export const useNavigationStore = create<NavigationState>()(
  persist(
    (set, get) => ({
      sidebarOpen: true,
      sidebarCollapsed: false,
      collapsedSections: new Set<string>(),
      mobileMenuOpen: false,
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      toggleSidebarCollapsed: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      toggleSection: (sectionId) =>
        set((state) => {
          const collapsedSections = new Set(state.collapsedSections);
          if (collapsedSections.has(sectionId)) {
            collapsedSections.delete(sectionId);
          } else {
            collapsedSections.add(sectionId);
          }
          return { collapsedSections };
        }),
      isSectionCollapsed: (sectionId) =>
        get().collapsedSections.has(sectionId),
      setMobileMenuOpen: (mobileMenuOpen) => set({ mobileMenuOpen }),
      toggleMobileMenu: () =>
        set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
      resetNavigation: () =>
        set({
          sidebarOpen: true,
          sidebarCollapsed: false,
          collapsedSections: new Set<string>(),
          mobileMenuOpen: false,
        }),
    }),
    {
      name: "navigation-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        collapsedSections: Array.from(state.collapsedSections),
      }),
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.collapsedSections)) {
          state.collapsedSections = new Set(state.collapsedSections);
        }
      },
    },
  ),
);

export function useResponsiveNavigation() {
  const setSidebarOpen = useNavigationStore((state) => state.setSidebarOpen);
  const setMobileMenuOpen = useNavigationStore(
    (state) => state.setMobileMenuOpen,
  );

  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.innerWidth >= 1024;
      if (isDesktop) {
        setMobileMenuOpen(false);
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, [setMobileMenuOpen, setSidebarOpen]);
}

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface RecentPage {
  path: string;
  title: string;
  timestamp: string;
}

interface NavigationState {
  // Sidebar state
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  collapsedSections: Set<string>;
  
  // Mobile menu state
  mobileMenuOpen: boolean;
  
  // Active navigation
  activeSection: string | null;
  breadcrumbs: Array<{ label: string; href: string }>;
  
  // Navigation history
  navigationHistory: string[];
  maxHistorySize: number;
  recentPages: RecentPage[];
  maxRecentPages: number;
  
  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapsed: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  toggleSection: (sectionId: string) => void;
  isSectionCollapsed: (sectionId: string) => boolean;
  
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
  
  setActiveSection: (section: string | null) => void;
  setBreadcrumbs: (breadcrumbs: Array<{ label: string; href: string }>) => void;
  
  addToHistory: (path: string) => void;
  clearHistory: () => void;
  goBack: () => string | undefined;
  
  addRecentPage: (page: RecentPage) => void;
  clearRecentPages: () => void;
  
  resetNavigation: () => void;
}

export const useNavigationStore = create<NavigationState>()(
  persist(
    (set, get) => ({
      // Initial state
      sidebarOpen: true,
      sidebarCollapsed: false,
      collapsedSections: new Set<string>(),
      mobileMenuOpen: false,
      activeSection: null,
      breadcrumbs: [],
      navigationHistory: [],
      maxHistorySize: 20,
      recentPages: [],
      maxRecentPages: 10,
      
      // Sidebar actions
      toggleSidebar: () => set((state) => ({ 
        sidebarOpen: !state.sidebarOpen 
      })),
      
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      
      toggleSidebarCollapsed: () => set((state) => ({ 
        sidebarCollapsed: !state.sidebarCollapsed 
      })),
      
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      
      // Section collapse management
      toggleSection: (sectionId) => set((state) => {
        const newCollapsed = new Set(state.collapsedSections);
        if (newCollapsed.has(sectionId)) {
          newCollapsed.delete(sectionId);
        } else {
          newCollapsed.add(sectionId);
        }
        return { collapsedSections: newCollapsed };
      }),
      
      isSectionCollapsed: (sectionId) => {
        return get().collapsedSections.has(sectionId);
      },
      
      // Mobile menu actions
      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
      
      toggleMobileMenu: () => set((state) => ({ 
        mobileMenuOpen: !state.mobileMenuOpen 
      })),
      
      // Active section management
      setActiveSection: (section) => set({ activeSection: section }),
      
      setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),
      
      // Navigation history management
      addToHistory: (path) => set((state) => {
        const newHistory = [...state.navigationHistory];
        
        // Don't add duplicate consecutive entries
        if (newHistory[newHistory.length - 1] !== path) {
          newHistory.push(path);
          
          // Trim history if it exceeds max size
          if (newHistory.length > state.maxHistorySize) {
            newHistory.shift();
          }
        }
        
        return { navigationHistory: newHistory };
      }),
      
      clearHistory: () => set({ navigationHistory: [] }),
      
      goBack: () => {
        const state = get();
        if (state.navigationHistory.length > 1) {
          const newHistory = [...state.navigationHistory];
          newHistory.pop(); // Remove current
          const previousPath = newHistory[newHistory.length - 1];
          set({ navigationHistory: newHistory });
          return previousPath;
        }
        return undefined;
      },
      
      // Recent pages management
      addRecentPage: (page) => set((state) => {
        const newRecentPages = [...state.recentPages];
        
        // Remove existing entry for the same path
        const existingIndex = newRecentPages.findIndex(p => p.path === page.path);
        if (existingIndex !== -1) {
          newRecentPages.splice(existingIndex, 1);
        }
        
        // Add to beginning
        newRecentPages.unshift(page);
        
        // Trim if exceeds max
        if (newRecentPages.length > state.maxRecentPages) {
          newRecentPages.pop();
        }
        
        return { recentPages: newRecentPages };
      }),
      
      clearRecentPages: () => set({ recentPages: [] }),
      
      // Reset navigation state
      resetNavigation: () => set({
        sidebarOpen: true,
        sidebarCollapsed: false,
        collapsedSections: new Set<string>(),
        mobileMenuOpen: false,
        activeSection: null,
        breadcrumbs: [],
        navigationHistory: [],
      }),
    }),
    {
      name: 'navigation-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist certain parts of the state
        sidebarCollapsed: state.sidebarCollapsed,
        collapsedSections: Array.from(state.collapsedSections), // Convert Set to Array for storage
      }),
      onRehydrateStorage: () => (state) => {
        // Convert Array back to Set after rehydration
        if (state && Array.isArray(state.collapsedSections)) {
          state.collapsedSections = new Set(state.collapsedSections);
        }
      },
    }
  )
);

// Responsive hook to handle screen size changes
export const useResponsiveNavigation = () => {
  const { setSidebarOpen, setMobileMenuOpen } = useNavigationStore();
  
  if (typeof window !== 'undefined') {
    const handleResize = () => {
      const isDesktop = window.innerWidth >= 1024; // lg breakpoint
      
      if (isDesktop) {
        setMobileMenuOpen(false);
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    
    // Check on mount and window resize
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    
    return () => window.removeEventListener('resize', handleResize);
  }
};
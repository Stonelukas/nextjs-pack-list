/**
 * Navigation hooks index
 *
 * Re-exports all navigation-related hooks for easy importing
 */

// Central navigation hook (recommended for most use cases)
export {
  useNavigation,
  useFilteredNavigation,
  useContextualActions,
  useNavigationMetadata,
  useNavigationState
} from './use-navigation';

// Active route detection
export {
  useActiveRoute,
  useActiveRouteFromList,
  useHasActiveChild
} from './use-active-route';

// Breadcrumb generation
export {
  useBreadcrumbs,
  useBreadcrumbString,
  useParentBreadcrumb
} from './use-breadcrumbs';

// Navigation guards and protection
export {
  useNavigationGuard,
  useProtectedNavigation,
  useAuthRedirect
} from './use-navigation-guard';

// Navigation history and tracking
export {
  useNavigationHistory,
  useVisitedPages,
  useRecentPages
} from './use-navigation-history';

// Keyboard shortcuts and helpers
export {
  useNavigationShortcuts,
  useNavigationHelpers
} from './use-navigation-shortcuts';

// Types
export type { Breadcrumb } from './use-breadcrumbs';
export type { NavigationSection, NavigationContext } from './use-navigation';
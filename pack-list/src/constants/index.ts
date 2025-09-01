/**
 * Application constants for Pack List
 * Centralized location for commonly used values
 */

// Storage keys
export const STORAGE_KEYS = {
  PACK_LIST: 'pack-list-storage',
  USER_PREFERENCES: 'user-preferences',
  THEME: 'theme-preference',
} as const;

// Default values
export const DEFAULTS = {
  ITEM_QUANTITY: 1,
  PRIORITY: 'medium',
  THEME: 'system',
  AUTO_SAVE: true,
} as const;

// UI Configuration
export const UI_CONFIG = {
  MOBILE_BREAKPOINT: 768,
  TABLET_BREAKPOINT: 1024,
  DESKTOP_BREAKPOINT: 1280,
  
  // Animation durations (ms)
  ANIMATION_FAST: 150,
  ANIMATION_NORMAL: 300,
  ANIMATION_SLOW: 500,
  
  // Debounce delays (ms)
  SEARCH_DEBOUNCE: 300,
  AUTO_SAVE_DEBOUNCE: 1000,
  
  // Pagination
  ITEMS_PER_PAGE: 50,
  TEMPLATES_PER_PAGE: 20,
  
  // File size limits
  MAX_EXPORT_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_IMAGE_SIZE: 2 * 1024 * 1024,   // 2MB
} as const;

// Priority display configuration
export const PRIORITY_CONFIG = {
  low: {
    label: 'Low',
    color: 'gray',
    icon: '○',
    weight: 1,
  },
  medium: {
    label: 'Medium', 
    color: 'blue',
    icon: '◐',
    weight: 2,
  },
  high: {
    label: 'High',
    color: 'orange', 
    icon: '◑',
    weight: 3,
  },
  essential: {
    label: 'Essential',
    color: 'red',
    icon: '●',
    weight: 4,
  },
} as const;

// Template categories configuration
export const TEMPLATE_CATEGORIES = {
  travel: {
    label: 'Travel',
    icon: '✈️',
    description: 'Vacation and business travel lists',
  },
  outdoor: {
    label: 'Outdoor',
    icon: '🏕️', 
    description: 'Camping, hiking, and outdoor activities',
  },
  events: {
    label: 'Events',
    icon: '🎉',
    description: 'Parties, weddings, and special events',
  },
  seasonal: {
    label: 'Seasonal',
    icon: '🌟',
    description: 'Holiday and seasonal activities',
  },
  business: {
    label: 'Business',
    icon: '💼',
    description: 'Work trips and conferences',
  },
  sports: {
    label: 'Sports',
    icon: '⚽',
    description: 'Sports equipment and activities',
  },
  emergency: {
    label: 'Emergency',
    icon: '🚨',
    description: 'Emergency preparedness kits',
  },
} as const;

// Export formats
export const EXPORT_FORMATS = {
  JSON: 'json',
  CSV: 'csv',
  PDF: 'pdf',
  PRINT: 'print',
} as const;

// Validation rules
export const VALIDATION = {
  MIN_NAME_LENGTH: 1,
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_NOTES_LENGTH: 1000,
  MAX_QUANTITY: 9999,
  MIN_QUANTITY: 0,
  MAX_CATEGORIES_PER_LIST: 50,
  MAX_ITEMS_PER_CATEGORY: 200,
} as const;

// Feature flags (for progressive enhancement)
export const FEATURES = {
  DRAG_AND_DROP: true,
  OFFLINE_SYNC: false,
  COLLABORATION: false,
  ADVANCED_EXPORT: true,
  TEMPLATES: true,
  CATEGORIES: true,
  PRIORITIES: true,
  SEARCH: true,
  MOBILE_GESTURES: true,
} as const;
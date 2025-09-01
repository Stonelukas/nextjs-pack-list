/**
 * Utility types for the Pack List application
 * Common types used across multiple components
 */

/**
 * Base entity interface that all database entities extend
 */
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Omits base entity fields for creation DTOs
 */
export type CreateEntityInput<T extends BaseEntity> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Partial update input for entities
 */
export type UpdateEntityInput<T> = Partial<Omit<T, 'id' | 'createdAt'>> & {
  updatedAt?: Date;
};

/**
 * Theme options for the application
 */
export type ThemeOption = 'light' | 'dark' | 'system';

/**
 * Generic callback function type
 */
export type CallbackFn<T = void> = () => T;

/**
 * Generic event handler type
 */
export type EventHandler<T = unknown> = (event: T) => void;

/**
 * Optional function type for cleanup operations
 */
export type CleanupFn = () => void;

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

/**
 * Sort parameters
 */
export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * Filter parameters for list queries
 */
export interface FilterParams {
  search?: string;
  tags?: string[];
  priority?: string[];
  completed?: boolean;
}
/**
 * Core data types for Pack List application
 * 
 * This module exports all the primary types and interfaces used throughout
 * the Pack List application for managing users, lists, categories, items,
 * templates, and related functionality.
 */

import type { BaseEntity, ThemeOption } from './utility';

// Re-export utility types for convenience
export type {
  BaseEntity,
  CreateEntityInput,
  UpdateEntityInput,
  ThemeOption,
  CallbackFn,
  EventHandler,
  CleanupFn,
  ApiResponse,
  PaginationParams,
  SortParams,
  FilterParams,
} from './utility';

/**
 * Priority levels for packing items
 * Used to help users organize items by importance
 */
export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium', 
  HIGH = 'high',
  ESSENTIAL = 'essential'
}

/**
 * Template categories for organizing packing templates
 * Helps users find relevant templates quickly
 */
export enum TemplateCategory {
  TRAVEL = 'travel',
  OUTDOOR = 'outdoor',
  EVENTS = 'events',
  SEASONAL = 'seasonal',
  BUSINESS = 'business',
  SPORTS = 'sports',
  EMERGENCY = 'emergency'
}

/**
 * Represents a user in the system
 */
export interface User {
  id: string;
  name: string;
  email?: string;
  preferences?: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User application preferences and settings
 */
export interface UserPreferences {
  theme: ThemeOption;
  defaultPriority: Priority;
  autoSave: boolean;
}

/**
 * Packing list item with all its properties
 */
export interface Item {
  id: string;
  name: string;
  quantity: number;
  packed: boolean;
  priority: Priority;
  notes?: string;
  categoryId: string;
  // Additional optional fields for enhanced functionality
  description?: string;
  weight?: number;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Category for organizing items within a list
 * Provides grouping and visual organization for related items
 */
export interface Category {
  id: string;
  _id?: any; // Convex ID type - used for backend operations
  name: string;
  color?: string;
  icon?: string;
  order: number;
  items: Item[];
  collapsed?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Main packing list containing categories and metadata
 * Represents a complete packing checklist for an activity or trip
 */
export interface List {
  id: string;
  name: string;
  description?: string;
  categories: Category[];
  tags?: string[];
  isTemplate: boolean;
  templateId?: string;
  userId: string;
  sharedWith?: string[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

/**
 * Template difficulty levels for filtering and recommendations
 */
export type TemplateDifficulty = 'beginner' | 'intermediate' | 'advanced';

/**
 * Template seasons for contextual recommendations
 */
export type TemplateSeason = 'spring' | 'summer' | 'fall' | 'winter' | 'all';

/**
 * Reusable packing list template
 */
export interface Template {
  id: string;
  name: string;
  description: string;
  categories: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>[];
  tags: string[];
  isPublic: boolean;
  usageCount: number;
  createdBy: string;
  icon?: string;
  duration?: string; // e.g., "3 days", "1 week"
  difficulty?: TemplateDifficulty;
  season?: TemplateSeason;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Statistics for analyzing list progress and completion
 * Used for displaying progress indicators and insights
 */
export interface ListStatistics {
  totalItems: number;
  packedItems: number;
  completionPercentage: number;
  itemsByPriority: Record<Priority, number>;
  itemsByCategory: Record<string, { total: number; packed: number }>;
}
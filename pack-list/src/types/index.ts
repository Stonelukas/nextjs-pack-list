// Core data types for Pack List application

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  ESSENTIAL = 'essential'
}

export interface User {
  id: string;
  name: string;
  email?: string;
  preferences?: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  defaultPriority: Priority;
  autoSave: boolean;
}

export interface Item {
  id: string;
  name: string;
  quantity: number;
  packed: boolean;
  priority: Priority;
  notes?: string;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  order: number;
  items: Item[];
  collapsed?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

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
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  season?: 'spring' | 'summer' | 'fall' | 'winter' | 'all';
  createdAt: Date;
  updatedAt: Date;
}

export enum TemplateCategory {
  TRAVEL = 'travel',
  OUTDOOR = 'outdoor',
  EVENTS = 'events',
  SEASONAL = 'seasonal',
  BUSINESS = 'business',
  SPORTS = 'sports',
  EMERGENCY = 'emergency'
}

export interface ListStatistics {
  totalItems: number;
  packedItems: number;
  completionPercentage: number;
  itemsByPriority: Record<Priority, number>;
  itemsByCategory: Record<string, { total: number; packed: number }>;
}
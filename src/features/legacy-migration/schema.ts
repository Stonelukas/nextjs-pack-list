export const LEGACY_SOURCE_KEY = "zustand:pack-list-storage:v1" as const;

export type LegacySourceKey = typeof LEGACY_SOURCE_KEY;
export type LegacyPriority = "low" | "medium" | "high" | "essential";
export type LegacyTheme = "light" | "dark" | "system";
export type LegacyTemplateDifficulty = "beginner" | "intermediate" | "advanced";
export type LegacyTemplateSeason = "spring" | "summer" | "fall" | "winter" | "all";

export interface RejectedLegacyRecord {
  path: string;
  reason: string;
  raw: unknown;
}

export interface NormalizedLegacyItem {
  name: string;
  quantity: number;
  packed: boolean;
  priority: LegacyPriority;
  notes?: string;
  description?: string;
  weight?: number;
  tags: string[];
  order: number;
  createdAt?: number;
  updatedAt?: number;
}

export interface NormalizedLegacyCategory {
  name: string;
  color?: string;
  icon?: string;
  order: number;
  collapsed: boolean;
  createdAt?: number;
  updatedAt?: number;
  items: NormalizedLegacyItem[];
}

export interface NormalizedLegacyList {
  name: string;
  description?: string;
  tags: string[];
  completedAt?: number;
  createdAt?: number;
  updatedAt?: number;
  categories: NormalizedLegacyCategory[];
}

export interface NormalizedLegacyPreferences {
  theme?: LegacyTheme;
  defaultPriority?: LegacyPriority;
  autoSave?: boolean;
}

export interface NormalizedLegacyTemplate {
  name: string;
  description: string;
  tags: string[];
  isPublic: boolean;
  usageCount: number;
  icon?: string;
  duration?: string;
  difficulty?: LegacyTemplateDifficulty;
  season?: LegacyTemplateSeason;
  createdAt?: number;
  updatedAt?: number;
  categories: NormalizedLegacyCategory[];
}

export interface LegacyImportPreview {
  sourceKey: LegacySourceKey;
  rawSource: string;
  fingerprint: string;
  lists: NormalizedLegacyList[];
  templates: NormalizedLegacyTemplate[];
  preferences?: NormalizedLegacyPreferences;
  rejected: RejectedLegacyRecord[];
  manualExportRequired?: string;
}

export type RejectLegacyRecord = (
  path: string,
  reason: string,
  raw: unknown,
) => void;

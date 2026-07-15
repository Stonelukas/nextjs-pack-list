import {
  LEGACY_MANUAL_EXPORT_GUIDANCE,
  LEGACY_MAX_NAME_LENGTH,
  LEGACY_MAX_NESTED_ARRAY_LENGTH,
  LEGACY_MAX_OPTIONAL_TEXT_LENGTH,
  LEGACY_MAX_TAG_LENGTH,
  LEGACY_MAX_TAGS_PER_RECORD,
} from "../../../convex/lib/legacy_import";
import type {
  LegacyPriority,
  LegacyTemplateDifficulty,
  LegacyTemplateSeason,
  NormalizedLegacyCategory,
  NormalizedLegacyItem,
  NormalizedLegacyList,
  NormalizedLegacyTemplate,
  RejectLegacyRecord,
} from "./schema";

export { fingerprintLegacyData } from "../../../convex/lib/legacy_import";

const priorities = new Set<LegacyPriority>([
  "low",
  "medium",
  "high",
  "essential",
]);
const difficulties = new Set<LegacyTemplateDifficulty>([
  "beginner",
  "intermediate",
  "advanced",
]);
const seasons = new Set<LegacyTemplateSeason>([
  "spring",
  "summer",
  "fall",
  "winter",
  "all",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredName(
  value: unknown,
  path: string,
  raw: unknown,
  reject: RejectLegacyRecord,
): string | null {
  if (typeof value !== "string" || !value.trim()) {
    reject(path, "A non-empty name is required", raw);
    return null;
  }
  const normalized = value.trim();
  if (normalized.length > LEGACY_MAX_NAME_LENGTH) {
    reject(
      path,
      `Name must be ${LEGACY_MAX_NAME_LENGTH} characters or fewer`,
      raw,
    );
    return null;
  }
  return normalized;
}

function optionalString(
  value: unknown,
  path: string,
  reject: RejectLegacyRecord,
): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") {
    reject(path, "Expected text", value);
    return undefined;
  }
  const normalized = value.trim();
  if (normalized.length > LEGACY_MAX_OPTIONAL_TEXT_LENGTH) {
    reject(
      path,
      `Text must be ${LEGACY_MAX_OPTIONAL_TEXT_LENGTH} characters or fewer`,
      value,
    );
    return undefined;
  }
  return normalized || undefined;
}

function optionalBoolean(
  value: unknown,
  fallback: boolean,
  path: string,
  reject: RejectLegacyRecord,
): boolean {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== "boolean") {
    reject(path, "Expected true or false", value);
    return fallback;
  }
  return value;
}

function optionalDate(
  value: unknown,
  path: string,
  reject: RejectLegacyRecord,
): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const timestamp =
    value instanceof Date
      ? value.getTime()
      : typeof value === "number"
        ? value
        : typeof value === "string"
          ? Date.parse(value)
          : Number.NaN;
  if (!Number.isFinite(timestamp) || timestamp < 0) {
    reject(path, "Expected a valid date", value);
    return undefined;
  }
  return timestamp;
}

function normalizeTags(
  value: unknown,
  path: string,
  reject: RejectLegacyRecord,
): string[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    reject(path, "Expected an array of tags", value);
    return [];
  }
  const tags: string[] = [];
  value.forEach((tag, index) => {
    if (typeof tag !== "string") {
      reject(`${path}[${index}]`, "Expected a text tag", tag);
      return;
    }
    const normalized = tag.trim();
    if (!normalized || normalized.length > LEGACY_MAX_TAG_LENGTH) {
      reject(
        `${path}[${index}]`,
        `Tags must be non-empty and ${LEGACY_MAX_TAG_LENGTH} characters or fewer`,
        tag,
      );
      return;
    }
    if (tags.length >= LEGACY_MAX_TAGS_PER_RECORD) {
      reject(
        `${path}[${index}]`,
        `Only ${LEGACY_MAX_TAGS_PER_RECORD} tags can be imported per record`,
        tag,
      );
      return;
    }
    tags.push(normalized);
  });
  return tags;
}

function normalizeOrder(
  value: unknown,
  fallback: number,
  path: string,
  reject: RejectLegacyRecord,
): number {
  if (value === undefined || value === null) return fallback;
  if (!Number.isInteger(value) || (value as number) < 0) {
    reject(path, "Expected a non-negative integer order", value);
    return fallback;
  }
  return value as number;
}

function normalizePriority(
  value: unknown,
  path: string,
  reject: RejectLegacyRecord,
): LegacyPriority | null {
  if (value === undefined || value === null || value === "") return "medium";
  if (typeof value !== "string") {
    reject(path, "Expected a supported item priority", value);
    return null;
  }
  const normalized = value.trim().toLowerCase() as LegacyPriority;
  if (!priorities.has(normalized)) {
    reject(path, "Expected low, medium, high, or essential priority", value);
    return null;
  }
  return normalized;
}

function normalizeItem(
  raw: unknown,
  path: string,
  index: number,
  reject: RejectLegacyRecord,
  templateItem: boolean,
): NormalizedLegacyItem | null {
  if (!isRecord(raw)) {
    reject(path, "Expected an item object", raw);
    return null;
  }
  const name = requiredName(raw.name, path, raw, reject);
  const priority = normalizePriority(raw.priority, `${path}.priority`, reject);
  if (!name || !priority) return null;

  const quantity = raw.quantity ?? 1;
  if (!Number.isInteger(quantity) || (quantity as number) < 1) {
    reject(path, "Item quantity must be a positive integer", raw);
    return null;
  }
  if (
    raw.weight !== undefined &&
    (typeof raw.weight !== "number" ||
      !Number.isFinite(raw.weight) ||
      raw.weight < 0)
  ) {
    reject(path, "Item weight must be a non-negative number", raw);
    return null;
  }

  return {
    name,
    quantity: quantity as number,
    packed: templateItem
      ? false
      : optionalBoolean(raw.packed, false, `${path}.packed`, reject),
    priority,
    notes: optionalString(raw.notes, `${path}.notes`, reject),
    description: optionalString(
      raw.description,
      `${path}.description`,
      reject,
    ),
    weight: raw.weight as number | undefined,
    tags: normalizeTags(raw.tags, `${path}.tags`, reject),
    order: normalizeOrder(raw.order, index, `${path}.order`, reject),
    createdAt: optionalDate(raw.createdAt, `${path}.createdAt`, reject),
    updatedAt: optionalDate(raw.updatedAt, `${path}.updatedAt`, reject),
  };
}

function normalizeCategory(
  raw: unknown,
  path: string,
  index: number,
  reject: RejectLegacyRecord,
  templateItems: boolean,
): NormalizedLegacyCategory | null {
  if (!isRecord(raw)) {
    reject(path, "Expected a category object", raw);
    return null;
  }
  const name = requiredName(raw.name, path, raw, reject);
  if (!name || !Array.isArray(raw.items)) {
    if (!Array.isArray(raw.items)) {
      reject(path, "Category items must be an array", raw);
    }
    return null;
  }
  if (raw.items.length > LEGACY_MAX_NESTED_ARRAY_LENGTH) {
    reject(`${path}.items`, LEGACY_MANUAL_EXPORT_GUIDANCE, raw.items);
    return null;
  }

  const items = raw.items.flatMap((item, itemIndex) => {
    const normalized = normalizeItem(
      item,
      `${path}.items[${itemIndex}]`,
      itemIndex,
      reject,
      templateItems,
    );
    return normalized ? [normalized] : [];
  });

  return {
    name,
    color: optionalString(raw.color, `${path}.color`, reject),
    icon: optionalString(raw.icon, `${path}.icon`, reject),
    order: normalizeOrder(raw.order, index, `${path}.order`, reject),
    collapsed: optionalBoolean(
      raw.collapsed,
      false,
      `${path}.collapsed`,
      reject,
    ),
    createdAt: optionalDate(raw.createdAt, `${path}.createdAt`, reject),
    updatedAt: optionalDate(raw.updatedAt, `${path}.updatedAt`, reject),
    items,
  };
}

export function normalizeLegacyList(
  raw: unknown,
  path: string,
  reject: RejectLegacyRecord,
): NormalizedLegacyList | null {
  if (!isRecord(raw)) {
    reject(path, "Expected a list object", raw);
    return null;
  }
  const name = requiredName(raw.name, path, raw, reject);
  if (!name || !Array.isArray(raw.categories)) {
    if (!Array.isArray(raw.categories)) {
      reject(path, "List categories must be an array", raw);
    }
    return null;
  }
  if (raw.categories.length > LEGACY_MAX_NESTED_ARRAY_LENGTH) {
    reject(`${path}.categories`, LEGACY_MANUAL_EXPORT_GUIDANCE, raw.categories);
    return null;
  }

  return {
    name,
    description: optionalString(raw.description, `${path}.description`, reject),
    tags: normalizeTags(raw.tags, `${path}.tags`, reject),
    completedAt: optionalDate(raw.completedAt, `${path}.completedAt`, reject),
    createdAt: optionalDate(raw.createdAt, `${path}.createdAt`, reject),
    updatedAt: optionalDate(raw.updatedAt, `${path}.updatedAt`, reject),
    categories: raw.categories.flatMap((category, index) => {
      const normalized = normalizeCategory(
        category,
        `${path}.categories[${index}]`,
        index,
        reject,
        false,
      );
      return normalized ? [normalized] : [];
    }),
  };
}

function normalizeEnum<T extends string>(
  value: unknown,
  allowed: Set<T>,
  path: string,
  reject: RejectLegacyRecord,
): T | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") {
    reject(path, "Expected a supported text value", value);
    return undefined;
  }
  const normalized = value.trim().toLowerCase() as T;
  if (!allowed.has(normalized)) {
    reject(path, "Value is not supported", value);
    return undefined;
  }
  return normalized;
}

export function normalizeLegacyTemplate(
  raw: unknown,
  path: string,
  reject: RejectLegacyRecord,
): NormalizedLegacyTemplate | null {
  if (!isRecord(raw)) {
    reject(path, "Expected a template object", raw);
    return null;
  }
  const name = requiredName(raw.name, path, raw, reject);
  if (!name || !Array.isArray(raw.categories)) {
    if (!Array.isArray(raw.categories)) {
      reject(path, "Template categories must be an array", raw);
    }
    return null;
  }
  if (raw.categories.length > LEGACY_MAX_NESTED_ARRAY_LENGTH) {
    reject(`${path}.categories`, LEGACY_MANUAL_EXPORT_GUIDANCE, raw.categories);
    return null;
  }
  const usageCount = raw.usageCount ?? 0;
  if (!Number.isInteger(usageCount) || (usageCount as number) < 0) {
    reject(path, "Template usage count must be a non-negative integer", raw);
    return null;
  }

  return {
    name,
    description:
      optionalString(raw.description, `${path}.description`, reject) ?? "",
    tags: normalizeTags(raw.tags, `${path}.tags`, reject),
    isPublic: optionalBoolean(raw.isPublic, false, `${path}.isPublic`, reject),
    usageCount: usageCount as number,
    icon: optionalString(raw.icon, `${path}.icon`, reject),
    duration: optionalString(raw.duration, `${path}.duration`, reject),
    difficulty: normalizeEnum(
      raw.difficulty,
      difficulties,
      `${path}.difficulty`,
      reject,
    ),
    season: normalizeEnum(raw.season, seasons, `${path}.season`, reject),
    createdAt: optionalDate(raw.createdAt, `${path}.createdAt`, reject),
    updatedAt: optionalDate(raw.updatedAt, `${path}.updatedAt`, reject),
    categories: raw.categories.flatMap((category, index) => {
      const normalized = normalizeCategory(
        category,
        `${path}.categories[${index}]`,
        index,
        reject,
        true,
      );
      return normalized ? [normalized] : [];
    }),
  };
}

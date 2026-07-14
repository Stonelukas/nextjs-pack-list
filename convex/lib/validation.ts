import { v, type Infer } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

import { domainError } from "./errors";
import {
  LEGACY_MAX_NAME_LENGTH,
  LEGACY_MAX_OPTIONAL_TEXT_LENGTH,
  LEGACY_MAX_TAG_LENGTH,
  LEGACY_MAX_TAGS_PER_RECORD,
} from "./legacy_import";

export const MAX_NAME_LENGTH = LEGACY_MAX_NAME_LENGTH;
export const MAX_OPTIONAL_TEXT_LENGTH = LEGACY_MAX_OPTIONAL_TEXT_LENGTH;
export const MAX_TAGS_PER_RECORD = LEGACY_MAX_TAGS_PER_RECORD;
export const MAX_TAG_LENGTH = LEGACY_MAX_TAG_LENGTH;
export const TEMPLATE_SUMMARY_PAGE_LIMIT = 50;
export const MAX_PUBLIC_TEMPLATES_PER_USER = 20;
export const MAX_TEMPLATE_CATEGORIES = 50;
export const MAX_TEMPLATE_ITEMS_PER_CATEGORY = 200;
export const MAX_TEMPLATE_ITEMS = 1_000;

export const priorityValidator = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high"),
  v.literal("essential"),
);

export type ItemPriority = Infer<typeof priorityValidator>;

const priorities = new Set<ItemPriority>([
  "low",
  "medium",
  "high",
  "essential",
]);

function validationError(message: string): never {
  throw domainError("VALIDATION", message);
}

export function validateRequiredName(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) validationError(`${label} is required`);
  if (normalized.length > MAX_NAME_LENGTH) {
    validationError(`${label} must be ${MAX_NAME_LENGTH} characters or fewer`);
  }
  return normalized;
}

export function validateOptionalText(
  value: string | undefined,
  label: string,
): string | undefined {
  if (value !== undefined && value.length > MAX_OPTIONAL_TEXT_LENGTH) {
    validationError(
      `${label} must be ${MAX_OPTIONAL_TEXT_LENGTH} characters or fewer`,
    );
  }
  return value;
}

export function validatePriority(value: string, label: string): ItemPriority {
  if (!priorities.has(value as ItemPriority)) {
    validationError(`${label} must be low, medium, high, or essential`);
  }
  return value as ItemPriority;
}

export function validatePositiveInteger(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 1) {
    validationError(`${label} must be a positive integer`);
  }
  return value;
}

export function validateNonnegativeInteger(
  value: number,
  label: string,
): number {
  if (!Number.isInteger(value) || value < 0) {
    validationError(`${label} must be a non-negative integer`);
  }
  return value;
}

export function validateNonnegativeWeight(
  value: number | undefined,
  label: string,
): number | undefined {
  if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
    validationError(`${label} must be a finite non-negative number`);
  }
  return value;
}

export function validateTags(
  values: string[] | undefined,
  label: string,
): string[] | undefined {
  if (values === undefined) return undefined;
  if (values.length > MAX_TAGS_PER_RECORD) {
    validationError(`${label} may contain at most ${MAX_TAGS_PER_RECORD} tags`);
  }

  return values.map((value) => {
    const normalized = value.trim();
    if (!normalized || normalized.length > MAX_TAG_LENGTH) {
      validationError(
        `${label} tags must be non-empty and ${MAX_TAG_LENGTH} characters or fewer`,
      );
    }
    return normalized;
  });
}

export function validatePageSize(
  numItems: number,
  maximum: number,
  label: string,
): void {
  if (!Number.isInteger(numItems) || numItems < 1 || numItems > maximum) {
    validationError(`${label} page size must be between 1 and ${maximum}`);
  }
}

export function validateTemplateCounts(
  itemCounts: number[],
  label = "Template",
): { categoryCount: number; itemCount: number } {
  if (itemCounts.length > MAX_TEMPLATE_CATEGORIES) {
    validationError(
      `${label} may contain at most ${MAX_TEMPLATE_CATEGORIES} categories`,
    );
  }

  for (const itemCount of itemCounts) {
    if (itemCount > MAX_TEMPLATE_ITEMS_PER_CATEGORY) {
      validationError(
        `${label} categories may contain at most ${MAX_TEMPLATE_ITEMS_PER_CATEGORY} items`,
      );
    }
  }

  const itemCount = itemCounts.reduce((total, count) => total + count, 0);
  if (itemCount > MAX_TEMPLATE_ITEMS) {
    validationError(`${label} may contain at most ${MAX_TEMPLATE_ITEMS} items`);
  }

  return { categoryCount: itemCounts.length, itemCount };
}

export async function validatePublicTemplateQuota(
  ctx: MutationCtx,
  creatorId: Id<"users">,
  requestedPublicTemplates: number,
): Promise<void> {
  if (requestedPublicTemplates === 0) return;
  if (
    !Number.isInteger(requestedPublicTemplates) ||
    requestedPublicTemplates < 0 ||
    requestedPublicTemplates > MAX_PUBLIC_TEMPLATES_PER_USER
  ) {
    validationError(
      `At most ${MAX_PUBLIC_TEMPLATES_PER_USER} public templates may be published per user`,
    );
  }

  const existing = await ctx.db
    .query("templates")
    .withIndex("by_creator_public", (q) =>
      q.eq("createdBy", creatorId).eq("isPublic", true),
    )
    .take(MAX_PUBLIC_TEMPLATES_PER_USER + 1);
  if (
    existing.length + requestedPublicTemplates >
    MAX_PUBLIC_TEMPLATES_PER_USER
  ) {
    validationError(
      `At most ${MAX_PUBLIC_TEMPLATES_PER_USER} public templates may be published per user`,
    );
  }
}

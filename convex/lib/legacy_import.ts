export const LEGACY_MAX_NAME_LENGTH = 200;
export const LEGACY_MAX_OPTIONAL_TEXT_LENGTH = 5_000;
export const LEGACY_MAX_TAGS_PER_RECORD = 50;
export const LEGACY_MAX_TAG_LENGTH = 100;
export const LEGACY_MAX_NESTED_ARRAY_LENGTH = 8_192;

export const LEGACY_MAX_LISTS = 100;
export const LEGACY_MAX_TEMPLATES = 100;
export const LEGACY_MAX_CATEGORIES = 2_000;
export const LEGACY_MAX_ITEMS = 10_000;
export const LEGACY_MAX_DOCUMENT_WRITES = 2_000;
export const LEGACY_MAX_ARGUMENT_BYTES = 1_500_000;
export const LEGACY_MAX_ESTIMATED_WRITE_BYTES = 4_000_000;

export const LEGACY_MANUAL_EXPORT_GUIDANCE =
  "This legacy import is too large for the automatic migration. Download the recovery file and use manual export support instead.";

type LegacyCategoryShape = {
  items: unknown[];
};

type LegacyParentShape = {
  categories: LegacyCategoryShape[];
};

export type LegacyImportPayloadShape = {
  lists: LegacyParentShape[];
  templates: LegacyParentShape[];
  preferences?: {
    theme?: "light" | "dark" | "system";
    defaultPriority?: "low" | "medium" | "high" | "essential";
    autoSave?: boolean;
  };
};

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, child]) => child !== undefined)
    .sort(([left], [right]) => left.localeCompare(right));
  return `{${entries
    .map(([key, child]) => `${JSON.stringify(key)}:${stableStringify(child)}`)
    .join(",")}}`;
}

function fnv1a32(value: string, seed: number): string {
  let hash = seed >>> 0;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

export function fingerprintLegacyData(value: LegacyImportPayloadShape): string {
  const serialized = stableStringify(value);
  return `fnv1a128:${[
    0x811c9dc5,
    0x9e3779b9,
    0x85ebca6b,
    0xc2b2ae35,
  ]
    .map((seed) => fnv1a32(serialized, seed))
    .join("")}`;
}

function serializedBytes(value: unknown): number {
  return new TextEncoder().encode(stableStringify(value)).byteLength;
}

export function getLegacyImportLimitError(
  payload: LegacyImportPayloadShape,
): string | null {
  if (
    payload.lists.length > LEGACY_MAX_NESTED_ARRAY_LENGTH ||
    payload.templates.length > LEGACY_MAX_NESTED_ARRAY_LENGTH
  ) {
    return LEGACY_MANUAL_EXPORT_GUIDANCE;
  }

  const parents = [...payload.lists, ...payload.templates];
  if (
    parents.some(
      (parent) => parent.categories.length > LEGACY_MAX_NESTED_ARRAY_LENGTH,
    )
  ) {
    return LEGACY_MANUAL_EXPORT_GUIDANCE;
  }

  const categories = parents.flatMap((parent) => parent.categories);
  if (
    categories.some(
      (category) => category.items.length > LEGACY_MAX_NESTED_ARRAY_LENGTH,
    )
  ) {
    return LEGACY_MANUAL_EXPORT_GUIDANCE;
  }

  const itemCount = categories.reduce(
    (total, category) => total + category.items.length,
    0,
  );
  if (
    payload.lists.length > LEGACY_MAX_LISTS ||
    payload.templates.length > LEGACY_MAX_TEMPLATES ||
    categories.length > LEGACY_MAX_CATEGORIES ||
    itemCount > LEGACY_MAX_ITEMS
  ) {
    return LEGACY_MANUAL_EXPORT_GUIDANCE;
  }

  const documentWrites =
    payload.lists.length +
    payload.templates.length +
    categories.length +
    itemCount +
    (payload.preferences ? 1 : 0) +
    1;
  if (documentWrites > LEGACY_MAX_DOCUMENT_WRITES) {
    return LEGACY_MANUAL_EXPORT_GUIDANCE;
  }

  const argumentBytes = serializedBytes(payload);
  const estimatedWriteBytes = argumentBytes * 2 + documentWrites * 512;
  if (
    argumentBytes > LEGACY_MAX_ARGUMENT_BYTES ||
    estimatedWriteBytes > LEGACY_MAX_ESTIMATED_WRITE_BYTES
  ) {
    return LEGACY_MANUAL_EXPORT_GUIDANCE;
  }

  return null;
}

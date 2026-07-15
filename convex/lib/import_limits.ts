export const MAX_IMPORT_CATEGORIES = 50;
export const MAX_IMPORT_ITEMS_PER_CATEGORY = 200;
export const MAX_IMPORT_ITEMS = 1_000;
export const MAX_IMPORT_JSON_BYTES = 1_000_000;

export function getImportPayloadLimitError(payload: {
  categories: readonly { items: readonly unknown[] }[];
}): string | null {
  if (payload.categories.length > MAX_IMPORT_CATEGORIES) {
    return `Imports may contain at most ${MAX_IMPORT_CATEGORIES} categories`;
  }

  let itemCount = 0;
  for (const category of payload.categories) {
    if (category.items.length > MAX_IMPORT_ITEMS_PER_CATEGORY) {
      return `Import categories may contain at most ${MAX_IMPORT_ITEMS_PER_CATEGORY} items`;
    }
    itemCount += category.items.length;
    if (itemCount > MAX_IMPORT_ITEMS) {
      return `Imports may contain at most ${MAX_IMPORT_ITEMS} items`;
    }
  }

  return null;
}

export function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

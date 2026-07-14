import {
  getLegacyImportLimitError,
  LEGACY_MANUAL_EXPORT_GUIDANCE,
  LEGACY_MAX_NESTED_ARRAY_LENGTH,
} from "../../../convex/lib/legacy_import";
import {
  fingerprintLegacyData,
  normalizeLegacyList,
  normalizeLegacyTemplate,
} from "./normalize";
import {
  LEGACY_SOURCE_KEY,
  type LegacyImportPreview,
  type LegacyPriority,
  type LegacyTheme,
  type NormalizedLegacyPreferences,
  type RejectedLegacyRecord,
} from "./schema";

export const LEGACY_STORAGE_KEY = "pack-list-storage" as const;
export { LEGACY_SOURCE_KEY } from "./schema";

export interface LegacyRecoveryPayload {
  fileName: "pack-list-legacy-recovery.json" | "pack-list-legacy-recovery-raw.json";
  raw: string;
}

export type LegacySourceRead =
  | { state: "found"; raw: string }
  | { state: "missing" }
  | { state: "inaccessible" };

export function readLegacySource(storage: Storage): LegacySourceRead {
  try {
    const raw = storage.getItem(LEGACY_STORAGE_KEY);
    return raw === null ? { state: "missing" } : { state: "found", raw };
  } catch {
    return { state: "inaccessible" };
  }
}

export function readLegacySourceRaw(storage: Storage): string | null {
  const source = readLegacySource(storage);
  return source.state === "found" ? source.raw : null;
}

export function createLegacyRecovery(raw: string): LegacyRecoveryPayload {
  try {
    JSON.parse(raw);
    return { fileName: "pack-list-legacy-recovery.json", raw };
  } catch {
    return { fileName: "pack-list-legacy-recovery-raw.json", raw };
  }
}

export function readLegacyRecovery(storage: Storage): LegacyRecoveryPayload | null {
  const source = readLegacySource(storage);
  return source.state === "found" ? createLegacyRecovery(source.raw) : null;
}

const supportedThemes = new Set<LegacyTheme>(["light", "dark", "system"]);
const supportedPriorities = new Set<LegacyPriority>([
  "low",
  "medium",
  "high",
  "essential",
]);

function normalizeLegacyPreferences(
  state: Record<string, unknown>,
  reject: (path: string, reason: string, raw: unknown) => void,
): NormalizedLegacyPreferences | undefined {
  const user = state.user;
  if (user === undefined) return undefined;
  if (typeof user !== "object" || user === null || Array.isArray(user)) {
    reject("state.user", "Expected a user object", user);
    return undefined;
  }
  const preferences = (user as Record<string, unknown>).preferences;
  if (preferences === undefined) return undefined;
  if (
    typeof preferences !== "object" ||
    preferences === null ||
    Array.isArray(preferences)
  ) {
    reject("state.user.preferences", "Expected a preferences object", preferences);
    return undefined;
  }

  const record = preferences as Record<string, unknown>;
  const normalized: NormalizedLegacyPreferences = {};
  for (const [key, value] of Object.entries(record)) {
    const path = `state.user.preferences.${key}`;
    if (key === "theme") {
      if (typeof value === "string" && supportedThemes.has(value as LegacyTheme)) {
        normalized.theme = value as LegacyTheme;
      } else {
        reject(path, "Expected light, dark, or system", value);
      }
    } else if (key === "defaultPriority") {
      const priority = typeof value === "string" ? value.toLowerCase() : value;
      if (
        typeof priority === "string" &&
        supportedPriorities.has(priority as LegacyPriority)
      ) {
        normalized.defaultPriority = priority as LegacyPriority;
      } else {
        reject(path, "Expected a supported priority", value);
      }
    } else if (key === "autoSave") {
      if (typeof value === "boolean") normalized.autoSave = value;
      else reject(path, "Expected true or false", value);
    } else {
      reject(path, "Unsupported legacy preference", value);
    }
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

export function inspectLegacyStorage(storage: Storage): LegacyImportPreview | null {
  const source = readLegacySource(storage);
  if (source.state !== "found") return null;
  const raw = source.raw;

  const rejected: RejectedLegacyRecord[] = [];
  const reject = (path: string, reason: string, rejectedRaw: unknown) => {
    rejected.push({ path, reason, raw: rejectedRaw });
  };

  let envelope: unknown;
  try {
    envelope = JSON.parse(raw) as unknown;
  } catch {
    reject("$", "Legacy storage is not valid JSON", raw);
    return {
      sourceKey: LEGACY_SOURCE_KEY,
      rawSource: raw,
      fingerprint: fingerprintLegacyData({ lists: [], templates: [] }),
      lists: [],
      templates: [],
      rejected,
    };
  }

  if (
    typeof envelope !== "object" ||
    envelope === null ||
    Array.isArray(envelope)
  ) {
    reject("$", "Expected a Zustand storage envelope", envelope);
    return {
      sourceKey: LEGACY_SOURCE_KEY,
      rawSource: raw,
      fingerprint: fingerprintLegacyData({ lists: [], templates: [] }),
      lists: [],
      templates: [],
      rejected,
    };
  }

  const record = envelope as Record<string, unknown>;
  if (record.version !== undefined && record.version !== 0) {
    reject("version", "Unsupported Zustand storage version", record.version);
    return {
      sourceKey: LEGACY_SOURCE_KEY,
      rawSource: raw,
      fingerprint: fingerprintLegacyData({ lists: [], templates: [] }),
      lists: [],
      templates: [],
      rejected,
    };
  }
  if (
    typeof record.state !== "object" ||
    record.state === null ||
    Array.isArray(record.state)
  ) {
    reject("state", "Expected a Zustand state object", record.state);
    return {
      sourceKey: LEGACY_SOURCE_KEY,
      rawSource: raw,
      fingerprint: fingerprintLegacyData({ lists: [], templates: [] }),
      lists: [],
      templates: [],
      rejected,
    };
  }

  const state = record.state as Record<string, unknown>;
  const preferences = normalizeLegacyPreferences(state, reject);
  const listsTooLarge =
    Array.isArray(state.lists) &&
    state.lists.length > LEGACY_MAX_NESTED_ARRAY_LENGTH;
  if (listsTooLarge) {
    reject("state.lists", LEGACY_MANUAL_EXPORT_GUIDANCE, state.lists);
  }
  const lists = Array.isArray(state.lists) && !listsTooLarge
    ? state.lists.flatMap((list, index) => {
        const normalized = normalizeLegacyList(
          list,
          `state.lists[${index}]`,
          reject,
        );
        return normalized ? [normalized] : [];
      })
    : [];
  if (state.lists !== undefined && !Array.isArray(state.lists)) {
    reject("state.lists", "Expected a list array", state.lists);
  }

  const templatesTooLarge =
    Array.isArray(state.templates) &&
    state.templates.length > LEGACY_MAX_NESTED_ARRAY_LENGTH;
  if (templatesTooLarge) {
    reject("state.templates", LEGACY_MANUAL_EXPORT_GUIDANCE, state.templates);
  }
  const templates = Array.isArray(state.templates) && !templatesTooLarge
    ? state.templates.flatMap((template, index) => {
        const normalized = normalizeLegacyTemplate(
          template,
          `state.templates[${index}]`,
          reject,
        );
        return normalized ? [normalized] : [];
      })
    : [];
  if (state.templates !== undefined && !Array.isArray(state.templates)) {
    reject("state.templates", "Expected a template array", state.templates);
  }

  const payload = { lists, templates, preferences };
  const limitError =
    rejected.some((entry) => entry.reason === LEGACY_MANUAL_EXPORT_GUIDANCE)
      ? LEGACY_MANUAL_EXPORT_GUIDANCE
      : getLegacyImportLimitError(payload);
  if (limitError && !rejected.some((entry) => entry.reason === limitError)) {
    reject("$", limitError, envelope);
  }

  return {
    sourceKey: LEGACY_SOURCE_KEY,
    rawSource: raw,
    fingerprint: fingerprintLegacyData(payload),
    lists,
    templates,
    preferences,
    rejected,
    manualExportRequired: limitError ?? undefined,
  };
}

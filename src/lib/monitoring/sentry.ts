import * as Sentry from "@sentry/react";

import { isExpectedError, mapError } from "@/lib/errors";

const FILTERED = "[Filtered]";

function normalizedKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isSensitiveKey(key: string): boolean {
  const normalized = normalizedKey(key);
  return (
    normalized.includes("authorization") ||
    normalized.includes("token") ||
    normalized.includes("cookie") ||
    normalized.includes("email") ||
    normalized.includes("userid") ||
    normalized.includes("clerkid") ||
    normalized === "subject" ||
    normalized === "args" ||
    normalized === "arguments" ||
    normalized === "variables" ||
    normalized === "input" ||
    normalized === "payload" ||
    normalized.includes("mutationarg") ||
    normalized.includes("legacypayload") ||
    normalized.includes("legacydata") ||
    normalized === "breadcrumbs"
  );
}

function scrubString(
  value: string,
  seen: WeakSet<object>,
  parentKey: string,
): string {
  const scrubbed = value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, FILTERED)
    .replace(/\bBearer\s+[A-Z0-9._~+/-]+=*/gi, `Bearer ${FILTERED}`)
    .replace(
      /([?&](?:token|access_token|refresh_token|id_token|__clerk_ticket)=)[^&#\s]+/gi,
      `$1${FILTERED}`,
    );

  const trimmed = scrubbed.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    return scrubbed;
  }

  try {
    const parsed: unknown = JSON.parse(scrubbed);
    if (parsed && typeof parsed === "object") {
      return JSON.stringify(redact(parsed, seen, parentKey));
    }
  } catch {
    // Preserve non-JSON strings after applying token and email scrubbing.
  }

  return scrubbed;
}

function redact(
  value: unknown,
  seen: WeakSet<object>,
  parentKey = "",
): unknown {
  if (typeof value === "string") {
    return scrubString(value, seen, parentKey);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  if (seen.has(value)) {
    return FILTERED;
  }
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((entry) => redact(entry, seen, parentKey));
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => {
      const isUserId =
        normalizedKey(parentKey).includes("user") && normalizedKey(key) === "id";
      return [
        key,
        isSensitiveKey(key) || isUserId
          ? FILTERED
          : redact(entry, seen, key),
      ];
    }),
  );
}

export function sanitizeSentryEvent<T extends object>(event: T): T {
  return redact(event, new WeakSet()) as T;
}

export function sanitizeSentryBreadcrumb(
  breadcrumb: Sentry.Breadcrumb,
): Sentry.Breadcrumb {
  if (breadcrumb.category === "ui.click" || breadcrumb.category === "ui.input") {
    return {
      ...breadcrumb,
      message: "[Filtered UI interaction]",
      data: undefined,
    };
  }
  return sanitizeSentryEvent(breadcrumb);
}

export function initializeSentry(dsn?: string): void {
  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    beforeBreadcrumb(breadcrumb) {
      return sanitizeSentryBreadcrumb(breadcrumb);
    },
    beforeSend(event) {
      return sanitizeSentryEvent(event);
    },
  });
}

export function captureUnexpectedError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  if (isExpectedError(mapError(error))) {
    return;
  }

  Sentry.captureException(error, context ? { extra: context } : undefined);
}

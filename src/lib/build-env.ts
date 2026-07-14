const PUBLIC_ENV_KEYS = [
  "VITE_CLERK_PUBLISHABLE_KEY",
  "VITE_CONVEX_URL",
  "VITE_APP_URL",
  "VITE_SENTRY_DSN",
] as const;
const PUBLIC_ENV_METADATA_KEYS = ["VITE_CONVEX_SITE_URL"] as const;
const PUBLIC_ENV_METADATA_PREFIXES = ["VITE_VERCEL_"] as const;

export type PublicEnvKey = (typeof PUBLIC_ENV_KEYS)[number];
export type ValidatedPublicEnv = Record<PublicEnvKey, string>;

export interface PublicEnvIssue {
  key: PublicEnvKey;
  message: string;
}

export type PublicEnvParseResult =
  | { status: "valid"; env: ValidatedPublicEnv }
  | { status: "invalid"; issues: PublicEnvIssue[] };

function parseHttpUrl(value: string, label: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label} must be a valid URL`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`${label} must use HTTP or HTTPS`);
  }
  return url;
}

function isLocalhost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

export function parseVitePublicEnv(
  environment: Record<string, string | undefined>,
  { mode }: { mode: string },
): PublicEnvParseResult {
  const issues: PublicEnvIssue[] = [];
  const clerkPublishableKey = environment.VITE_CLERK_PUBLISHABLE_KEY?.trim() ?? "";
  const convexValue = environment.VITE_CONVEX_URL?.trim() ?? "";

  if (!clerkPublishableKey) {
    issues.push({
      key: "VITE_CLERK_PUBLISHABLE_KEY",
      message: "Missing required environment variable: VITE_CLERK_PUBLISHABLE_KEY",
    });
  } else if (!/^pk_(?:test|live)_[A-Za-z0-9_-]+=*$/.test(clerkPublishableKey)) {
    issues.push({
      key: "VITE_CLERK_PUBLISHABLE_KEY",
      message: "VITE_CLERK_PUBLISHABLE_KEY must be a Clerk publishable key",
    });
  }

  let convexUrl = "";
  if (!convexValue) {
    issues.push({
      key: "VITE_CONVEX_URL",
      message: "Missing required environment variable: VITE_CONVEX_URL",
    });
  } else {
    try {
      const parsed = parseHttpUrl(convexValue, "VITE_CONVEX_URL");
      if (
        parsed.protocol !== "https:" &&
        !(mode === "development" && isLocalhost(parsed.hostname))
      ) {
        issues.push({
          key: "VITE_CONVEX_URL",
          message: "Production builds require an HTTPS Convex URL",
        });
      } else {
        convexUrl = parsed.toString().replace(/\/$/, "");
      }
    } catch (error) {
      issues.push({
        key: "VITE_CONVEX_URL",
        message: error instanceof Error ? error.message : "VITE_CONVEX_URL is invalid",
      });
    }
  }

  const appUrl = environment.VITE_APP_URL?.trim() ?? "";
  const sentryDsn = environment.VITE_SENTRY_DSN?.trim() ?? "";
  for (const [key, value] of [
    ["VITE_APP_URL", appUrl],
    ["VITE_SENTRY_DSN", sentryDsn],
  ] as const) {
    if (!value) continue;
    try {
      parseHttpUrl(value, key);
    } catch (error) {
      issues.push({
        key,
        message: error instanceof Error ? error.message : `${key} is invalid`,
      });
    }
  }

  if (issues.length > 0) return { status: "invalid", issues };

  return {
    status: "valid",
    env: {
      VITE_CLERK_PUBLISHABLE_KEY: clerkPublishableKey,
      VITE_CONVEX_URL: convexUrl,
      VITE_APP_URL: appUrl,
      VITE_SENTRY_DSN: sentryDsn,
    },
  };
}

export function validateVitePublicEnv(
  environment: Record<string, string | undefined>,
  options: { mode: string },
): ValidatedPublicEnv {
  const allowlist = new Set<string>([
    ...PUBLIC_ENV_KEYS,
    ...PUBLIC_ENV_METADATA_KEYS,
  ]);
  for (const key of Object.keys(environment)) {
    const reservedPlatformMetadata = PUBLIC_ENV_METADATA_PREFIXES.some(
      (prefix) => key.startsWith(prefix),
    );
    if (
      key.startsWith("VITE_") &&
      !allowlist.has(key) &&
      !reservedPlatformMetadata
    ) {
      throw new Error(
        `${key} is not an allowlisted public variable. Keep secrets and deploy-owned configuration out of VITE_* values.`,
      );
    }
  }

  const convexSiteValue = environment.VITE_CONVEX_SITE_URL?.trim();
  if (convexSiteValue) {
    const convexSiteUrl = parseHttpUrl(
      convexSiteValue,
      "VITE_CONVEX_SITE_URL",
    );
    if (
      convexSiteUrl.protocol !== "https:" &&
      !(options.mode === "development" && isLocalhost(convexSiteUrl.hostname))
    ) {
      throw new Error("Production builds require an HTTPS Convex HTTP actions URL");
    }
  }

  const result = parseVitePublicEnv(environment, options);
  if (result.status === "invalid") {
    throw new Error(result.issues[0].message);
  }

  return result.env;
}

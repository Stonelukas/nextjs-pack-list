import { parseVitePublicEnv, type PublicEnvIssue } from "./build-env";

export interface AppEnv {
  clerkPublishableKey: string;
  convexUrl: string;
  sentryDsn?: string;
  appUrl: string;
}

export type RuntimeEnvResult =
  | { status: "configured"; env: AppEnv }
  | { status: "unconfigured"; issues: PublicEnvIssue[] };

export function parseRuntimeEnv(
  environment: Record<string, string | undefined>,
  origin: string,
  mode: string,
): RuntimeEnvResult {
  const result = parseVitePublicEnv(environment, { mode });
  if (result.status === "invalid") {
    return { status: "unconfigured", issues: result.issues };
  }

  return {
    status: "configured",
    env: {
      clerkPublishableKey: result.env.VITE_CLERK_PUBLISHABLE_KEY,
      convexUrl: result.env.VITE_CONVEX_URL,
      sentryDsn: result.env.VITE_SENTRY_DSN || undefined,
      appUrl: result.env.VITE_APP_URL || origin,
    },
  };
}

export const runtimeEnv = parseRuntimeEnv(
  import.meta.env,
  window.location.origin,
  import.meta.env.MODE,
);

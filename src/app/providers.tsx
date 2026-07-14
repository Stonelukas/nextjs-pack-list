import { ClerkProvider } from "@clerk/clerk-react";
import { useCallback, useMemo, useState } from "react";
import {
  RouterProvider,
  type RouterProviderProps,
} from "react-router-dom";

import {
  AuthReadinessProvider,
  UnavailableAuthReadinessProvider,
} from "@/app/auth/auth-readiness";
import { RootErrorBoundary } from "@/app/errors/root-error-boundary";
import { ConvexUserBootstrap } from "@/app/guards/convex-user-bootstrap";
import {
  isRuntimeConfigured,
  RuntimeConfigurationProvider,
} from "@/app/runtime/runtime-configuration";
import {
  clerkAppearance,
  clerkLocalization,
} from "@/features/auth/clerk-appearance";
import { PreferenceThemeSync } from "@/features/settings/preference-theme-sync";
import type { RuntimeEnvResult } from "@/lib/env";
import {
  ConvexProvider,
  createConvexClient,
} from "@/providers/convex-provider";
import { ThemeProvider } from "@/providers/theme-provider";

interface AppProvidersProps {
  runtimeConfiguration: RuntimeEnvResult;
  routerInstance: RouterProviderProps["router"];
}

function ConfiguredProviders({
  providerAttempt,
  retry,
  routerInstance,
  runtimeConfiguration,
}: {
  providerAttempt: number;
  retry(): void;
  routerInstance: RouterProviderProps["router"];
  runtimeConfiguration: Extract<RuntimeEnvResult, { status: "configured" }>;
}) {
  const convexClient = useMemo(
    () => createConvexClient(runtimeConfiguration.env.convexUrl),
    [runtimeConfiguration.env.convexUrl],
  );

  return (
    <ClerkProvider
      appearance={clerkAppearance}
      key={providerAttempt}
      localization={clerkLocalization}
      publishableKey={runtimeConfiguration.env.clerkPublishableKey}
    >
      <ConvexProvider client={convexClient}>
        <AuthReadinessProvider
          providerAttempt={providerAttempt}
          retry={retry}
        >
          <ConvexUserBootstrap>
            <PreferenceThemeSync />
            <RouterProvider router={routerInstance} />
          </ConvexUserBootstrap>
        </AuthReadinessProvider>
      </ConvexProvider>
    </ClerkProvider>
  );
}

export function AppProviders({
  runtimeConfiguration,
  routerInstance,
}: AppProvidersProps) {
  const [providerAttempt, setProviderAttempt] = useState(0);
  const retryProviders = useCallback(() => {
    setProviderAttempt((currentAttempt) => currentAttempt + 1);
  }, []);

  return (
    <RootErrorBoundary>
      <ThemeProvider>
        <RuntimeConfigurationProvider value={runtimeConfiguration}>
          {isRuntimeConfigured(runtimeConfiguration) ? (
            <ConfiguredProviders
              providerAttempt={providerAttempt}
              retry={retryProviders}
              routerInstance={routerInstance}
              runtimeConfiguration={runtimeConfiguration}
            />
          ) : (
            <UnavailableAuthReadinessProvider retry={retryProviders}>
              <RouterProvider router={routerInstance} />
            </UnavailableAuthReadinessProvider>
          )}
        </RuntimeConfigurationProvider>
      </ThemeProvider>
    </RootErrorBoundary>
  );
}

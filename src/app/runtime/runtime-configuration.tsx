import { createContext, useContext, type ReactNode } from "react";

import type { RuntimeEnvResult } from "@/lib/env";

const RuntimeConfigurationContext = createContext<RuntimeEnvResult | null>(null);

export function RuntimeConfigurationProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: RuntimeEnvResult;
}) {
  return (
    <RuntimeConfigurationContext.Provider value={value}>
      {children}
    </RuntimeConfigurationContext.Provider>
  );
}

export function useRuntimeConfiguration() {
  const value = useContext(RuntimeConfigurationContext);
  if (!value) throw new Error("RuntimeConfigurationProvider is missing");
  return value;
}

export function isRuntimeConfigured(
  value: RuntimeEnvResult,
): value is Extract<RuntimeEnvResult, { status: "configured" }> {
  return value.status === "configured";
}

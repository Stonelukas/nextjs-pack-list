import { AppProviders } from "@/app/providers";
import { router } from "@/app/router";
import { runtimeEnv, type RuntimeEnvResult } from "@/lib/env";

export function App({
  runtimeConfiguration = runtimeEnv,
}: {
  runtimeConfiguration?: RuntimeEnvResult;
}) {
  return (
    <AppProviders
      routerInstance={router}
      runtimeConfiguration={runtimeConfiguration}
    />
  );
}

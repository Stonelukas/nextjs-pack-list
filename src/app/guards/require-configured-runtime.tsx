import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  isRuntimeConfigured,
  useRuntimeConfiguration,
} from "@/app/runtime/runtime-configuration";

export function RequireConfiguredRuntime({ children }: { children: ReactNode }) {
  const runtimeConfiguration = useRuntimeConfiguration();

  if (isRuntimeConfigured(runtimeConfiguration)) return children;

  return (
    <Card
      aria-labelledby="service-unavailable-title"
      className="mx-auto w-full max-w-lg shadow-sm"
      role="alert"
    >
      <CardHeader>
        <CardTitle as="h2" id="service-unavailable-title">
          Service is unavailable
        </CardTitle>
        <CardDescription>
          Route Ledger cannot load connected data right now. Return home and try
          again after the application services are configured.
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button asChild variant="outline">
          <Link to="/">Return home</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

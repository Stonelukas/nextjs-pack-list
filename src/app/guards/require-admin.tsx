import type { ReactNode } from "react";
import { useQuery } from "convex/react";

import { api } from "../../../convex/_generated/api";
import { RouteLoading } from "@/app/loading/route-loading";

export interface RequireAdminProps {
  children: ReactNode;
}

export function RequireAdmin({ children }: RequireAdminProps) {
  const access = useQuery(api.users.getCurrentAccess);

  if (access === undefined) {
    return <RouteLoading label="Checking administrator access" />;
  }

  if (!access.authenticated || access.role !== "admin") {
    return (
      <section className="mx-auto max-w-xl px-6 py-16 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Restricted area
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Administrator access required
        </h1>
        <p className="mt-4 text-muted-foreground">
          Your account does not have permission to view this page.
        </p>
      </section>
    );
  }

  return children;
}

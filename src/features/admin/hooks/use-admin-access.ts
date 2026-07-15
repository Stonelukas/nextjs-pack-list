import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";

import { api } from "../../../../convex/_generated/api";

export type AdminAccess = FunctionReturnType<typeof api.users.getCurrentAccess>;

export function useAdminAccess() {
  const access = useQuery(api.users.getCurrentAccess);
  return {
    access,
    loading: access === undefined,
    authenticated: access?.authenticated ?? false,
    role: access?.role ?? null,
    isAdmin: access?.authenticated === true && access.role === "admin",
  };
}

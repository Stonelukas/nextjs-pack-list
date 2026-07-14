import { useMutation, useQuery } from "convex/react";
import type { FunctionArgs } from "convex/server";
import { useCallback } from "react";

import { api } from "../../../../convex/_generated/api";
import {
  useAsyncActionState,
  type AsyncActionOptions,
} from "@/features/shared/async-action-state";

export type UserPreferences = FunctionArgs<
  typeof api.users.updateCurrentUserPreferences
>["preferences"];

export function usePreferences() {
  const currentUser = useQuery(api.users.getCurrentUser);
  const updateCurrentUserPreferences = useMutation(
    api.users.updateCurrentUserPreferences,
  );
  const { pending, error, resetError, runAction } = useAsyncActionState();
  const updatePreferences = useCallback(
    (preferences: UserPreferences, options?: AsyncActionOptions) =>
      runAction(
        () => updateCurrentUserPreferences({ preferences }),
        options,
      ),
    [runAction, updateCurrentUserPreferences],
  );

  return {
    preferences:
      currentUser === undefined ? undefined : (currentUser?.preferences ?? null),
    loading: currentUser === undefined,
    pending,
    error,
    resetError,
    updatePreferences,
  };
}

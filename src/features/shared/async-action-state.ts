import { useCallback, useRef, useState } from "react";

import { mapError, type UserFacingError } from "@/lib/errors";

export interface AsyncActionState {
  pending: boolean;
  error: UserFacingError | null;
  resetError(): void;
}

export interface AsyncActionOptions {
  rethrow?: boolean;
}

export interface AsyncActionController extends AsyncActionState {
  runAction<T>(
    action: () => Promise<T>,
    options?: AsyncActionOptions,
  ): Promise<T | undefined>;
}

const offlineMutationError = {
  data: {
    code: "OFFLINE",
    message: "Reconnect before saving changes.",
  },
} as const;

export function useAsyncActionState(): AsyncActionController {
  const [pendingCount, setPendingCount] = useState(0);
  const [error, setError] = useState<UserFacingError | null>(null);
  const latestActionId = useRef(0);

  const resetError = useCallback(() => setError(null), []);

  const runAction = useCallback(
    async <T,>(
      action: () => Promise<T>,
      options: AsyncActionOptions = {},
    ): Promise<T | undefined> => {
      const actionId = latestActionId.current + 1;
      latestActionId.current = actionId;
      setError(null);

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setError(mapError(offlineMutationError));
        if (options.rethrow) {
          throw offlineMutationError;
        }
        return undefined;
      }

      setPendingCount((count) => count + 1);

      try {
        return await action();
      } catch (caughtError) {
        if (latestActionId.current === actionId) {
          setError(mapError(caughtError));
        }
        if (options.rethrow) {
          throw caughtError;
        }
        return undefined;
      } finally {
        setPendingCount((count) => Math.max(0, count - 1));
      }
    },
    [],
  );

  return {
    pending: pendingCount > 0,
    error,
    resetError,
    runAction,
  };
}

/* eslint-disable react-refresh/only-export-components */
import { useConvexAuth, useMutation } from "convex/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { api } from "../../../convex/_generated/api";
import { useAuthReadiness } from "@/app/auth/auth-readiness";
import { mapError, type UserFacingError } from "@/lib/errors";

export const ACCOUNT_BOOTSTRAP_TIMEOUT_MS = 15_000;
export type BootstrapStatus = "idle" | "loading" | "ready" | "error";

export interface ConvexUserBootstrapValue {
  status: BootstrapStatus;
  error: UserFacingError | null;
  retry(): void;
}

const ACCOUNT_BOOTSTRAP_TIMEOUT_ERROR = mapError(
  new Error("Account setup did not finish before the readiness timeout."),
);

const ConvexUserBootstrapContext = createContext<ConvexUserBootstrapValue>({
  status: "idle",
  error: null,
  retry: () => undefined,
});

export function useConvexUserBootstrap() {
  return useContext(ConvexUserBootstrapContext);
}

export function ConvexUserBootstrap({ children }: { children: ReactNode }) {
  const auth = useAuthReadiness();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const ensureCurrentUser = useMutation(api.users.ensureCurrentUser);
  const [result, setResult] = useState<{
    key: string;
    status: "ready" | "error";
    error: UserFacingError | null;
  } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const startedForUser = useRef<string | null>(null);
  const activeAttemptKey = useRef<string | null>(null);
  const timeout = useRef<number | null>(null);
  const attemptKey =
    auth.status === "ready" && auth.isSignedIn && auth.userId
      ? `${auth.userId}:${attempt}`
      : null;
  const canBootstrap = Boolean(attemptKey && !isLoading && isAuthenticated);
  const currentResult = result?.key === attemptKey ? result : null;
  const status: BootstrapStatus = !attemptKey
    ? "idle"
    : currentResult?.status === "error"
      ? "error"
      : !canBootstrap
        ? "loading"
        : currentResult?.status ?? "loading";
  const error = status === "error" ? currentResult?.error ?? null : null;

  const clearBootstrapTimeout = useCallback(() => {
    if (timeout.current === null) return;
    window.clearTimeout(timeout.current);
    timeout.current = null;
  }, []);

  const retry = useCallback(() => {
    clearBootstrapTimeout();
    startedForUser.current = null;
    activeAttemptKey.current = null;
    setAttempt((current) => current + 1);
  }, [clearBootstrapTimeout]);

  useEffect(() => {
    activeAttemptKey.current = attemptKey;

    return () => {
      if (activeAttemptKey.current === attemptKey) {
        activeAttemptKey.current = null;
      }
    };
  }, [attemptKey]);

  useEffect(() => {
    if (!attemptKey) {
      startedForUser.current = null;
      return;
    }

    if (!canBootstrap || currentResult) return;
    if (startedForUser.current === attemptKey) return;
    startedForUser.current = attemptKey;

    void ensureCurrentUser({})
      .then(() => {
        if (startedForUser.current === attemptKey) {
          setResult({ key: attemptKey, status: "ready", error: null });
        }
      })
      .catch((caughtError: unknown) => {
        if (startedForUser.current !== attemptKey) return;
        setResult({
          key: attemptKey,
          status: "error",
          error: mapError(caughtError),
        });
      });
  }, [attemptKey, canBootstrap, currentResult, ensureCurrentUser]);

  useEffect(() => {
    clearBootstrapTimeout();
    if (!attemptKey || status !== "loading") return;

    timeout.current = window.setTimeout(() => {
      timeout.current = null;
      if (activeAttemptKey.current !== attemptKey) return;
      startedForUser.current = null;
      setResult({
        key: attemptKey,
        status: "error",
        error: ACCOUNT_BOOTSTRAP_TIMEOUT_ERROR,
      });
    }, ACCOUNT_BOOTSTRAP_TIMEOUT_MS);

    return clearBootstrapTimeout;
  }, [attemptKey, clearBootstrapTimeout, status]);

  const value = useMemo<ConvexUserBootstrapValue>(
    () => ({ status, error, retry }),
    [error, retry, status],
  );

  return (
    <ConvexUserBootstrapContext.Provider value={value}>
      {children}
    </ConvexUserBootstrapContext.Provider>
  );
}

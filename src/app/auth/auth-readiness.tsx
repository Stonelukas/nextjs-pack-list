/* eslint-disable react-refresh/only-export-components */
import { useAuth } from "@clerk/clerk-react";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const AUTH_READINESS_TIMEOUT_MS = 10_000;
export type AuthReadinessStatus = "loading" | "ready" | "unavailable";

export interface AuthReadinessValue {
  status: AuthReadinessStatus;
  isSignedIn: boolean;
  userId: string | null;
  message: string | null;
  retry(): void;
}

interface AuthReadinessProviderProps {
  children: ReactNode;
  providerAttempt: number;
  retry(): void;
}

interface UnavailableAuthReadinessProviderProps {
  children: ReactNode;
  message?: string;
  retry(): void;
}

const AUTH_TIMEOUT_MESSAGE =
  "Authentication did not become ready. Check your connection and try again.";
const AUTH_CONFIGURATION_MESSAGE =
  "Authentication is unavailable because the application is not configured.";

const AuthReadinessContext = createContext<AuthReadinessValue | null>(null);

export function AuthReadinessProvider({
  children,
  providerAttempt,
  retry,
}: AuthReadinessProviderProps) {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const [unavailableAttempt, setUnavailableAttempt] = useState<number | null>(
    null,
  );

  useEffect(() => {
    if (isLoaded) return;

    const timeout = window.setTimeout(() => {
      setUnavailableAttempt(providerAttempt);
    }, AUTH_READINESS_TIMEOUT_MS);

    return () => window.clearTimeout(timeout);
  }, [isLoaded, providerAttempt]);

  const status: AuthReadinessStatus = isLoaded
    ? "ready"
    : unavailableAttempt === providerAttempt
      ? "unavailable"
      : "loading";
  const value = useMemo<AuthReadinessValue>(
    () => ({
      status,
      isSignedIn: status === "ready" && Boolean(isSignedIn),
      userId: status === "ready" && userId ? userId : null,
      message: status === "unavailable" ? AUTH_TIMEOUT_MESSAGE : null,
      retry,
    }),
    [isSignedIn, retry, status, userId],
  );

  return (
    <AuthReadinessContext.Provider value={value}>
      {children}
    </AuthReadinessContext.Provider>
  );
}

export function UnavailableAuthReadinessProvider({
  children,
  message = AUTH_CONFIGURATION_MESSAGE,
  retry,
}: UnavailableAuthReadinessProviderProps) {
  const value = useMemo<AuthReadinessValue>(
    () => ({
      status: "unavailable",
      isSignedIn: false,
      userId: null,
      message,
      retry,
    }),
    [message, retry],
  );

  return (
    <AuthReadinessContext.Provider value={value}>
      {children}
    </AuthReadinessContext.Provider>
  );
}

export function useAuthReadiness(): AuthReadinessValue {
  const value = useContext(AuthReadinessContext);
  if (!value) throw new Error("AuthReadinessProvider is missing");
  return value;
}

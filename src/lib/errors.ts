export type UserFacingErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "OFFLINE"
  | "UNEXPECTED";

export interface UserFacingError {
  code: UserFacingErrorCode;
  title: string;
  message: string;
  retryable: boolean;
}

const errorDefaults: Record<
  Exclude<UserFacingErrorCode, "UNEXPECTED">,
  Pick<UserFacingError, "title" | "retryable">
> = {
  UNAUTHENTICATED: { title: "Sign in required", retryable: false },
  FORBIDDEN: { title: "Access denied", retryable: false },
  NOT_FOUND: { title: "Not found", retryable: false },
  VALIDATION: { title: "Check your information", retryable: false },
  OFFLINE: { title: "You are offline", retryable: true },
};

function domainErrorData(error: unknown): { code: string; message?: string } | null {
  if (!error || typeof error !== "object" || !("data" in error)) {
    return null;
  }

  const data = error.data;
  if (!data || typeof data !== "object" || !("code" in data)) {
    return null;
  }

  const code = data.code;
  const message = "message" in data ? data.message : undefined;
  return {
    code: typeof code === "string" ? code : "",
    message: typeof message === "string" ? message : undefined,
  };
}

function isOfflineNetworkError(error: unknown): boolean {
  return (
    error instanceof TypeError &&
    typeof navigator !== "undefined" &&
    !navigator.onLine &&
    /failed to fetch|network\s*error|network request failed|load failed/i.test(
      error.message,
    )
  );
}

export function mapError(error: unknown): UserFacingError {
  const data = domainErrorData(error);
  if (data && data.code in errorDefaults) {
    const code = data.code as Exclude<UserFacingErrorCode, "UNEXPECTED">;
    return {
      code,
      ...errorDefaults[code],
      message: data.message ?? "Please try again.",
    };
  }

  if (isOfflineNetworkError(error)) {
    return {
      code: "OFFLINE",
      title: errorDefaults.OFFLINE.title,
      message: "Reconnect to continue with Convex-backed data.",
      retryable: true,
    };
  }

  return {
    code: "UNEXPECTED",
    title: "Something went wrong",
    message: "An unexpected error interrupted the page. Please try again.",
    retryable: true,
  };
}

export function isExpectedError(error: UserFacingError): boolean {
  return error.code !== "UNEXPECTED";
}

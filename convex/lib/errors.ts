import { ConvexError } from "convex/values";

export type DomainErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "OFFLINE";

export type DomainErrorData = {
  code: DomainErrorCode;
  message: string;
};

export function domainError(
  code: DomainErrorCode,
  message: string,
): ConvexError<DomainErrorData> {
  return new ConvexError({ code, message });
}

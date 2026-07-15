import type { UserFacingError } from "@/lib/errors";

export function ActionError({
  error,
  id,
  className = "text-sm text-destructive",
}: {
  error: UserFacingError;
  id?: string;
  className?: string;
}) {
  return (
    <div id={id} role="alert" className={className}>
      <p className="font-semibold">{error.title}</p>
      <p>{error.message}</p>
    </div>
  );
}

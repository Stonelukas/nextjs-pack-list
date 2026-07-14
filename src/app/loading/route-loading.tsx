export interface RouteLoadingProps {
  label?: string;
}

export function RouteLoading({ label = "Loading page" }: RouteLoadingProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className="grid min-h-48 place-items-center px-6 py-12 text-sm text-muted-foreground"
    >
      <span>Loading…</span>
    </div>
  );
}

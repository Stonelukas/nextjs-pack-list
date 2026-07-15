import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  label?: string;
  showPercentage?: boolean;
  showEmoji?: boolean;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
  className?: string;
}

export function ProgressBar({
  animated = true,
  className,
  label,
  showPercentage = true,
  size = "md",
  value,
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const sizeClasses = { sm: "h-2", md: "h-3", lg: "h-4" };

  return (
    <div className={cn("space-y-2", className)}>
      {label || showPercentage ? (
        <div className="flex items-center justify-between gap-3 text-sm">
          {label ? <span className="font-semibold">{label}</span> : <span />}
          {showPercentage ? <span className="font-mono text-xs font-semibold tabular-nums">{clampedValue}% packed</span> : null}
        </div>
      ) : null}
      <div
        data-slot="progress-track"
        role="progressbar"
        aria-label={label ?? "Packing progress"}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clampedValue}
        className={cn("relative w-full overflow-hidden rounded-sm border border-border bg-muted", sizeClasses[size])}
      >
        <div
          data-slot="progress-indicator"
          className={cn("h-full bg-primary", animated && "transition-[width] duration-150")}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  eyebrow?: string;
  description?: ReactNode;
  actions?: ReactNode;
  compact?: boolean;
  className?: string;
  spine?: "default" | "none";
}

export function PageHeader({
  actions,
  className,
  compact = false,
  description,
  eyebrow,
  spine = "none",
  title,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "route-header grid gap-5 border-b border-border pb-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end",
        compact ? "mb-6" : "mb-8 md:pb-8",
        className,
      )}
    >
      <div
        className={cn(
          "route-header__content relative pl-0",
          spine === "default" && "md:pl-7",
        )}
        data-route-spine-suppressed={spine === "none" ? "true" : undefined}
      >
        {spine === "default" ? (
          <span
            data-route-spine
            aria-hidden="true"
            className="route-spine absolute hidden md:block"
          />
        ) : null}
        {eyebrow ? (
          <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <h1
          className={cn(
            "font-sans font-semibold tracking-[-0.025em] text-balance",
            compact ? "text-2xl md:text-3xl" : "text-3xl md:text-4xl",
          )}
        >
          {title}
        </h1>
        {description ? (
          <div className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
            {description}
          </div>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2 md:justify-end">{actions}</div>
      ) : null}
    </header>
  );
}

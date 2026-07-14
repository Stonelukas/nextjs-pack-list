import { createElement, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: ReactNode;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  headingLevel?: 2 | 3;
  className?: string;
}

export function EmptyState({
  className,
  description,
  headingLevel = 2,
  icon: Icon,
  primaryAction,
  secondaryAction,
  title,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "mx-auto flex max-w-xl flex-col items-center border-y border-border px-5 py-12 text-center",
        className,
      )}
    >
      <span className="mb-5 grid h-12 w-12 place-items-center rounded-lg border border-border bg-surface-muted text-accent">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      {createElement(
        `h${headingLevel}`,
        { className: "text-2xl font-semibold tracking-tight" },
        title,
      )}
      <div className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </div>
      {primaryAction || secondaryAction ? (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {primaryAction}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  );
}

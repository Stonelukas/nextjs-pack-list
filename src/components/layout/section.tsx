import { useId, type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface SectionProps {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function Section({
  action,
  children,
  className,
  contentClassName,
  description,
  title,
}: SectionProps) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className={cn("space-y-5", className)}>
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id={headingId} className="text-2xl font-semibold tracking-tight">
            {title}
          </h2>
          {description ? (
            <div className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              {description}
            </div>
          ) : null}
        </div>
        {action ? <div className="flex flex-wrap gap-2">{action}</div> : null}
      </div>
      <div className={contentClassName}>{children}</div>
    </section>
  );
}

import { CheckCircle2, CircleDashed, Target } from "lucide-react";
import { useMemo } from "react";

import { ProgressBar } from "@/components/progress/progress-bar";
import type { ListDocument } from "@/features/lists/types";
import { cn } from "@/lib/utils";

interface ListProgressProps {
  list: ListDocument;
  className?: string;
}

const priorities = ["essential", "high", "medium", "low"] as const;

export function ListProgress({ className, list }: ListProgressProps) {
  const items = useMemo(() => list.categories.flatMap((category) => category.items), [list.categories]);
  const packed = items.filter((item) => item.packed).length;
  const progress = items.length ? Math.round((packed / items.length) * 100) : 0;

  return (
    <section className={cn("grid gap-5 rounded-lg border border-border bg-card p-5 lg:grid-cols-[minmax(0,1fr)_22rem]", className)} aria-labelledby="overall-progress-title">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.1em] text-muted-foreground">Key progress state</p>
            <h2 id="overall-progress-title" className="mt-1 text-xl font-semibold">Overall progress</h2>
          </div>
          <span className={cn("inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-semibold", progress === 100 ? "border-success/40 text-success" : "border-border text-muted-foreground")}>
            {progress === 100 ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <CircleDashed className="h-4 w-4" aria-hidden="true" />}
            {progress === 100 ? "Cleared" : "In progress"}
          </span>
        </div>
        <ProgressBar value={progress} label="Packed against target" size="lg" className="mt-5" />
        <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Target className="h-4 w-4" aria-hidden="true" />
          {progress === 0 ? "Ready to start packing." : progress === 100 ? "All items are packed and the manifest is clear." : `${items.length - packed} items remain before departure.`}
        </p>
      </div>
      <div className="border-t border-border pt-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-5">
        <h3 className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Priority order</h3>
        <div className="mt-3 space-y-2">
          {priorities.map((priority) => {
            const priorityItems = items.filter((item) => item.priority === priority);
            if (!priorityItems.length) return null;
            const priorityPacked = priorityItems.filter((item) => item.packed).length;
            return (
              <div key={priority} className="grid grid-cols-[1fr_auto] items-center border-b border-border py-2 text-sm last:border-b-0">
                <span className="capitalize">{priority}</span>
                <span className="font-mono text-xs tabular-nums text-muted-foreground">{priorityPacked} / {priorityItems.length}</span>
              </div>
            );
          })}
          {!items.length ? <p className="text-sm text-muted-foreground">No priority data yet.</p> : null}
        </div>
      </div>
    </section>
  );
}

import { useId, useState, type ReactNode } from "react";
import { ChartNoAxesColumn, Table2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LegendItem {
  label: string;
  color: string;
  dash?: boolean;
}

interface ChartPanelProps {
  title: string;
  description: string;
  children: ReactNode;
  table: ReactNode;
  legend?: LegendItem[];
  className?: string;
}

export function ChartPanel({
  children,
  className,
  description,
  legend = [],
  table,
  title,
}: ChartPanelProps) {
  const [view, setView] = useState<"chart" | "table">("chart");
  const titleId = useId();
  const descriptionId = useId();

  return (
    <figure
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className={cn("rounded-lg border border-border bg-card p-5", className)}
    >
      <figcaption className="mb-5 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 id={titleId} className="text-lg font-semibold tracking-tight">
            {title}
          </h3>
          <p id={descriptionId} className="mt-1 text-sm text-muted-foreground">
            {description}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setView((current) => (current === "chart" ? "table" : "chart"))}
        >
          {view === "chart" ? (
            <Table2 className="mr-2 h-4 w-4" aria-hidden="true" />
          ) : (
            <ChartNoAxesColumn className="mr-2 h-4 w-4" aria-hidden="true" />
          )}
          {view === "chart" ? `Show ${title} table` : `Show ${title} chart`}
        </Button>
      </figcaption>
      {legend.length > 1 ? (
        <ul aria-label={`${title} legend`} className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
          {legend.map((item) => (
            <li key={item.label} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={cn("h-2.5 w-5 rounded-sm", item.dash && "h-0 border-t-2 border-dashed")}
                style={item.dash ? { borderColor: item.color } : { backgroundColor: item.color }}
              />
              {item.label}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="overflow-x-auto print:hidden">{view === "chart" ? children : table}</div>
      <div data-print-chart-table className="hidden overflow-visible print:block">
        {table}
      </div>
    </figure>
  );
}

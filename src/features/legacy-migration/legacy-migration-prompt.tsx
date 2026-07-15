import { FileArchive } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useLegacyMigration } from "./use-legacy-migration";

export function LegacyMigrationPrompt() {
  const migration = useLegacyMigration();

  if (
    !migration.hasImportableData ||
    migration.statusLoading ||
    migration.result !== null
  ) {
    return null;
  }

  return (
    <aside
      className="mx-auto mt-4 flex w-[min(100%-2rem,80rem)] flex-col gap-3 rounded-lg border border-warning/50 bg-warning/10 p-4 sm:flex-row sm:items-center sm:justify-between"
      role="status"
      aria-label="Legacy packing data found"
    >
      <div className="flex gap-3">
        <FileArchive className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden="true" />
        <div>
          <p className="font-semibold">Legacy packing data found</p>
          <p className="text-sm text-muted-foreground">
            Review the one-time import before this browser data is left behind.
          </p>
        </div>
      </div>
      <Button asChild size="sm">
        <Link to="/settings?section=migration">Review legacy import</Link>
      </Button>
    </aside>
  );
}

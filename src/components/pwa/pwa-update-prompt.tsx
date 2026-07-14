import { RefreshCw, Route } from "lucide-react";
import { useRegisterSW } from "virtual:pwa-register/react";

import { Button } from "@/components/ui/button";

export function PwaUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({ immediate: true });

  if (!needRefresh) return null;

  return (
    <section
      role="region"
      aria-label="Application update available"
      aria-live="polite"
      className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-[var(--shadow-dialog)]"
    >
      <div className="flex items-start gap-3 border-l-4 border-l-primary p-4">
        <span className="mt-0.5 rounded-md bg-accent p-2 text-accent-foreground">
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Route update / Ready
            </p>
            <h2 className="font-display text-xl font-bold tracking-tight">
              A new Route Ledger is ready
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Update when you are ready. Your current page will reload after the new version activates.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void updateServiceWorker(true)}>
              <Route className="h-4 w-4" aria-hidden="true" />
              Update now
            </Button>
            <Button variant="outline" onClick={() => setNeedRefresh(false)}>
              Later
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

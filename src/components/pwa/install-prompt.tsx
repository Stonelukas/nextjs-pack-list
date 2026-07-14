import { useEffect, useState } from "react";
import { Download, Route } from "lucide-react";

import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

function isInstalled() {
  if (typeof window === "undefined") return false;

  const standaloneNavigator = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    standaloneNavigator.standalone === true
  );
}

export function InstallPrompt() {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isInstalled()) return;

    const handleBeforeInstall = (event: Event) => {
      const promptEvent = event as BeforeInstallPromptEvent;
      promptEvent.preventDefault();
      setInstallEvent(promptEvent);
    };
    const handleInstalled = () => setInstallEvent(null);

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (!installEvent) return null;

  const install = async () => {
    const promptEvent = installEvent;
    setInstallEvent(null);
    await promptEvent.prompt();
    await promptEvent.userChoice;
  };

  return (
    <section
      role="region"
      aria-label="Install Route Ledger"
      aria-live="polite"
      className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-[var(--shadow-dialog)]"
    >
      <div className="flex items-start gap-3 border-l-4 border-l-success p-4">
        <span className="mt-0.5 rounded-md bg-secondary p-2 text-success">
          <Download className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Device access / Optional
            </p>
            <h2 className="font-display text-xl font-bold tracking-tight">
              Keep Route Ledger close
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Install the app for quicker access and a cached reading shell. Saving still requires a connection.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void install()}>
              <Route className="h-4 w-4" aria-hidden="true" />
              Install app
            </Button>
            <Button variant="outline" onClick={() => setInstallEvent(null)}>
              Not now
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

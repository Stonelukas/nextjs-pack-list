import { CloudOff } from "lucide-react";

import { useOnlineStatus } from "@/hooks/use-online-status";
import { cn } from "@/lib/utils";

interface OfflineBannerProps {
  className?: string;
}

export function OfflineBanner({ className }: OfflineBannerProps) {
  const { online } = useOnlineStatus();

  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "offline-banner flex min-h-11 items-center justify-center gap-2 border-b px-4 py-2 text-sm font-semibold",
        className,
      )}
    >
      <CloudOff className="h-4 w-4" aria-hidden="true" />
      <span>You are offline. Viewing cached pages may work, but changes require a connection.</span>
    </div>
  );
}

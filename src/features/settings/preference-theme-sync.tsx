import { useEffect, useRef, type RefObject } from "react";

import { useConvexUserBootstrap } from "@/app/guards/convex-user-bootstrap";
import { usePreferences } from "@/features/settings/hooks/use-preferences";
import { useTheme } from "@/providers/theme-provider";

interface ReadyPreferenceThemeSyncProps {
  lastPreferenceThemeRef: RefObject<"light" | "dark" | "system" | undefined>;
}

function ReadyPreferenceThemeSync({
  lastPreferenceThemeRef,
}: ReadyPreferenceThemeSyncProps) {
  const { preferences } = usePreferences();
  const { setTheme, theme } = useTheme();

  useEffect(() => {
    const preferenceTheme = preferences?.theme;
    if (!preferenceTheme || lastPreferenceThemeRef.current === preferenceTheme) return;
    lastPreferenceThemeRef.current = preferenceTheme;
    if (preferenceTheme !== theme) setTheme(preferenceTheme);
  }, [lastPreferenceThemeRef, preferences?.theme, setTheme, theme]);

  return null;
}

export function PreferenceThemeSync() {
  const bootstrap = useConvexUserBootstrap();
  const lastPreferenceThemeRef = useRef<"light" | "dark" | "system" | undefined>(
    undefined,
  );

  if (bootstrap.status !== "ready") return null;

  return <ReadyPreferenceThemeSync lastPreferenceThemeRef={lastPreferenceThemeRef} />;
}

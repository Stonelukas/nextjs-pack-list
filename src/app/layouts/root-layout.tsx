import { useEffect } from "react";
import { Outlet, useLocation, useNavigation } from "react-router-dom";

import { useAuthReadiness } from "@/app/auth/auth-readiness";
import { useConvexUserBootstrap } from "@/app/guards/convex-user-bootstrap";
import { RouteLoading } from "@/app/loading/route-loading";
import { SkipNav } from "@/components/accessibility/skip-nav";
import { OfflineBanner } from "@/components/feedback/offline-banner";
import { MobileNav } from "@/components/mobile/mobile-nav";
import { Monitoring } from "@/components/monitoring/monitoring";
import { Header } from "@/components/navigation/header";
import { NavigationLayout } from "@/components/navigation/navigation-layout";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { PwaUpdatePrompt } from "@/components/pwa/pwa-update-prompt";
import { Toaster } from "@/components/ui/sonner";
import { LegacyMigrationPrompt } from "@/features/legacy-migration/legacy-migration-prompt";

function routeTitle(pathname: string) {
  if (pathname === "/") return "Overview";
  if (pathname.startsWith("/sign-in")) return "Sign in";
  if (pathname.startsWith("/sign-up")) return "Create account";
  if (pathname === "/lists") return "Packing lists";
  if (pathname === "/lists/new") return "Create list";
  if (/^\/lists\/[^/]+\/edit$/.test(pathname)) return "Edit list";
  if (/^\/lists\/[^/]+$/.test(pathname)) return "List details";
  if (pathname === "/templates") return "Template library";
  if (pathname === "/categories") return "Categories";
  if (pathname === "/tags") return "Tags";
  if (pathname === "/settings") return "Settings";
  if (pathname.startsWith("/admin")) return "Administration";
  return "Page not found";
}

export function RootLayout() {
  const navigation = useNavigation();
  const location = useLocation();
  const auth = useAuthReadiness();
  const bootstrap = useConvexUserBootstrap();
  const isNavigating = navigation.state !== "idle";
  const showAuthenticatedShell =
    auth.status === "ready" &&
    auth.isSignedIn &&
    bootstrap.status === "ready";
  const announcement = isNavigating ? "" : routeTitle(location.pathname);
  const routeContent = isNavigating ? <RouteLoading /> : <Outlet />;
  const routeOwnsMain = location.pathname === "/" && !isNavigating;

  useEffect(() => {
    if (isNavigating) return;
    const title = routeTitle(location.pathname);
    document.title = `${title} | Route Ledger`;
    const frame = window.requestAnimationFrame(() => {
      const heading = document.querySelector<HTMLElement>("main h1");
      const target = heading ?? document.querySelector<HTMLElement>("main#main-content");
      if (!target) return;
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isNavigating, location.pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SkipNav />
      <p className="sr-only" role="status" aria-live="polite" aria-label={announcement}>
        {announcement}
      </p>
      <OfflineBanner />
      <Header />
      {showAuthenticatedShell ? (
        <>
          <LegacyMigrationPrompt />
          <NavigationLayout>{routeContent}</NavigationLayout>
          <MobileNav />
        </>
      ) : routeOwnsMain ? (
        routeContent
      ) : (
        <main id="main-content" tabIndex={-1}>
          {routeContent}
        </main>
      )}
      <div className="pointer-events-none fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+5rem)] z-50 flex flex-col items-end gap-3 sm:bottom-4">
        <InstallPrompt />
        <PwaUpdatePrompt />
      </div>
      <Toaster richColors closeButton />
      <Monitoring />
    </div>
  );
}

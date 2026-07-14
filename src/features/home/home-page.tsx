import { useAuthReadiness } from "@/app/auth/auth-readiness";
import { useConvexUserBootstrap } from "@/app/guards/convex-user-bootstrap";
import { ListOverview } from "@/components/lists/list-overview";
import { PublicHomePage } from "@/features/home/public-home-page";

export function HomePage() {
  const auth = useAuthReadiness();
  const bootstrap = useConvexUserBootstrap();

  if (
    auth.status === "ready" &&
    auth.isSignedIn &&
    bootstrap.status === "ready"
  ) {
    return (
      <div className="overview-frame py-6 md:py-10">
        <ListOverview />
      </div>
    );
  }

  const accountStatus =
    auth.status === "ready" &&
    auth.isSignedIn &&
    bootstrap.status !== "ready"
      ? bootstrap.status
      : undefined;

  return (
    <PublicHomePage
      accountStatus={accountStatus}
      authStatus={auth.status}
      onRetryAccount={bootstrap.retry}
      onRetryAuth={auth.retry}
    />
  );
}

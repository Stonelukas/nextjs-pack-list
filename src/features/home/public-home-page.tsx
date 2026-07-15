import {
  ArrowRight,
  Check,
  Circle,
  CircleCheckBig,
  Layers3,
  ListChecks,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface PublicHomePageProps {
  authStatus: "loading" | "ready" | "unavailable";
  accountStatus?: "idle" | "loading" | "error";
  onRetryAuth?(): void;
  onRetryAccount?(): void;
}

const checklistItems = [
  { label: "Passport and tickets", packed: true },
  { label: "Everyday layers", packed: true },
  { label: "Phone charger", packed: false },
  { label: "Toiletries", packed: true },
];

const features = [
  {
    title: "Keep every trip clear",
    description:
      "Group what you need, add quantities and notes, and keep the whole list easy to scan.",
    icon: ListChecks,
  },
  {
    title: "Start with a useful template",
    description:
      "Begin with a practical list, then shape it around the way you travel.",
    icon: Layers3,
  },
  {
    title: "See what is ready",
    description:
      "Check items off as they reach the bag, so the final look takes seconds instead of guesswork.",
    icon: CircleCheckBig,
  },
];

function ReadinessNotice({
  accountStatus,
  authStatus,
  onRetryAccount,
  onRetryAuth,
}: PublicHomePageProps) {
  if (authStatus === "loading") {
    return (
      <div
        className="mt-6 flex max-w-xl items-start gap-3 rounded-lg border border-border bg-surface-muted px-4 py-3 text-sm text-muted-foreground"
        role="status"
      >
        <Circle className="mt-1 size-3 shrink-0 fill-primary text-primary" aria-hidden="true" />
        <div>
          <p className="font-semibold text-foreground">Connecting to authentication</p>
          <p>You can look around while Route Ledger checks your session.</p>
        </div>
      </div>
    );
  }

  if (authStatus === "unavailable") {
    return (
      <div
        className="mt-6 max-w-xl rounded-lg border border-warning/40 bg-warning/10 px-4 py-4 text-sm"
        role="alert"
      >
        <p className="font-semibold text-foreground">
          Authentication is unavailable right now.
        </p>
        <p className="mt-1 text-muted-foreground">
          The packing guide is still here. Retry the connection when you are ready to continue.
        </p>
        <Button
          className="mt-3"
          disabled={!onRetryAuth}
          onClick={onRetryAuth}
          type="button"
          variant="outline"
        >
          Retry authentication
        </Button>
      </div>
    );
  }

  if (accountStatus === "idle" || accountStatus === "loading") {
    return (
      <div
        className="mt-6 flex max-w-xl items-start gap-3 rounded-lg border border-border bg-surface-muted px-4 py-3 text-sm text-muted-foreground"
        role="status"
      >
        <Circle className="mt-1 size-3 shrink-0 fill-primary text-primary" aria-hidden="true" />
        <div>
          <p className="font-semibold text-foreground">Preparing your account</p>
          <p>Your packing lists will appear here as soon as setup finishes.</p>
        </div>
      </div>
    );
  }

  if (accountStatus === "error") {
    return (
      <div
        className="mt-6 max-w-xl rounded-lg border border-danger/40 bg-danger/10 px-4 py-4 text-sm"
        role="alert"
      >
        <p className="font-semibold text-foreground">
          Account setup could not finish.
        </p>
        <p className="mt-1 text-muted-foreground">
          Your lists have not loaded yet. Retry setup to continue to your workspace.
        </p>
        <Button
          className="mt-3"
          disabled={!onRetryAccount}
          onClick={onRetryAccount}
          type="button"
          variant="outline"
        >
          Retry account setup
        </Button>
      </div>
    );
  }

  return null;
}

export function PublicHomePage(props: PublicHomePageProps) {
  return (
    <main
      className="friendly-landing overflow-hidden"
      id="main-content"
      tabIndex={-1}
    >
      <section className="friendly-hero app-frame py-12 sm:py-16 lg:py-20">
        <div className="overview-frame grid items-center gap-12 lg:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)] lg:gap-16">
          <div>
            <p className="friendly-eyebrow text-sm font-semibold text-primary">
              Pack smarter. Travel lighter.
            </p>
            <h1 className="mt-4 max-w-3xl font-sans text-5xl font-semibold leading-[0.98] tracking-[-0.035em] text-balance sm:text-6xl lg:text-7xl">
              Everything you need, ready when you are.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
              Build clear packing lists, start from useful templates, and see exactly what is ready.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg">
                <Link to="/sign-up">
                  Create a list
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/sign-in">Sign in</Link>
              </Button>
            </div>
            <ReadinessNotice {...props} />
          </div>

          <div className="relative mx-auto w-full max-w-md lg:justify-self-end">
            <div
              aria-hidden="true"
              className="absolute inset-0 translate-x-3 translate-y-3 rounded-2xl border border-primary/20 bg-primary/10"
            />
            <Card
              aria-label="Example packing checklist"
              className="relative gap-0 overflow-hidden rounded-2xl border-border bg-card py-0 shadow-lg"
            >
              <CardHeader className="gap-3 border-b border-border bg-surface-muted px-6 py-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-primary">Weekend carry-on</p>
                    <CardTitle as="h2" className="mt-1 text-2xl tracking-tight">
                      Ready by the door
                    </CardTitle>
                  </div>
                  <span className="rounded-full bg-success/15 px-3 py-1 text-sm font-semibold text-success">
                    3 of 4 packed
                  </span>
                </div>
              </CardHeader>
              <CardContent className="px-0">
                <ul className="divide-y divide-border">
                  {checklistItems.map((item) => (
                    <li
                      className="flex items-center gap-4 px-6 py-4"
                      key={item.label}
                    >
                      <span
                        className={
                          item.packed
                            ? "grid size-7 shrink-0 place-items-center rounded-md bg-success text-success-foreground"
                            : "grid size-7 shrink-0 place-items-center rounded-md border border-border bg-surface"
                        }
                      >
                        {item.packed ? (
                          <Check aria-hidden="true" className="size-4" strokeWidth={3} />
                        ) : (
                          <Circle aria-hidden="true" className="size-3 text-muted-foreground" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1 font-semibold text-foreground">
                        {item.label}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {item.packed ? "Packed" : "To pack"}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="landing-features"
        className="border-y border-border bg-surface-muted"
      >
        <div className="app-frame py-14 sm:py-16">
          <div className="overview-frame">
            <div className="max-w-2xl">
              <h2
                className="font-sans text-3xl font-semibold tracking-tight sm:text-4xl"
                id="landing-features"
              >
                A calmer way to get out the door.
              </h2>
              <p className="mt-3 text-lg leading-7 text-muted-foreground">
                Keep the practical details together without turning trip preparation into another project.
              </p>
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {features.map(({ description, icon: Icon, title }) => (
                <Card className="h-full rounded-xl bg-card shadow-sm" key={title}>
                  <CardHeader>
                    <span className="grid size-11 place-items-center rounded-lg bg-primary/10 text-primary">
                      <Icon aria-hidden="true" className="size-5" />
                    </span>
                    <CardTitle as="h3" className="mt-3 text-xl leading-tight">
                      {title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-base leading-7 text-muted-foreground">
                    {description}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="friendly-cta app-frame py-14 sm:py-20">
        <div className="overview-frame rounded-2xl border border-border bg-card px-6 py-10 shadow-sm sm:px-10 sm:py-12">
          <div className="flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <h2 className="font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
                Make the last check the easy part.
              </h2>
              <p className="mt-3 text-lg leading-7 text-muted-foreground">
                Start a list for the next trip and keep every must-have in one clear place.
              </p>
            </div>
            <Button asChild size="lg">
              <Link to="/sign-up">
                Start your packing list
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

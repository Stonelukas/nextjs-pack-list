import {
  cloneElement,
  isValidElement,
  useSyncExternalStore,
  type MouseEventHandler,
  type ReactElement,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  getTestRuntime,
  signedInAuth,
  type MockAuthState,
} from "@/test/mocks/runtime";

interface ClerkProviderProps {
  children: ReactNode;
  publishableKey?: string;
}

interface ClerkSurfaceProps {
  fallbackRedirectUrl?: string;
  path?: string;
  routing?: string;
  signInUrl?: string;
  signUpUrl?: string;
  appearance?: unknown;
}

interface ClerkButtonProps {
  children: ReactElement<{ onClick?: MouseEventHandler }>;
  mode?: "modal" | "redirect";
}

function useRuntimeAuth(): MockAuthState {
  const runtime = getTestRuntime();
  useSyncExternalStore(runtime.subscribe, runtime.getVersion, runtime.getVersion);
  return runtime.getState().auth;
}

function safeRedirect(locationSearch: string, fallback: string) {
  const requested = new URLSearchParams(locationSearch).get("redirect_url");
  return requested && requested.startsWith("/") && !requested.startsWith("//")
    ? requested
    : fallback;
}

function authenticate() {
  getTestRuntime().setAuth(signedInAuth());
}

export function ClerkProvider({ children }: ClerkProviderProps) {
  getTestRuntime();
  return children;
}

export function useAuth() {
  const auth = useRuntimeAuth();
  return {
    isLoaded: auth.isLoaded,
    isSignedIn: auth.isSignedIn,
    userId: auth.user?.id ?? null,
    sessionId: auth.isSignedIn ? "session_test" : null,
    getToken: async () => null,
    signOut: async () => {
      getTestRuntime().setAuth({ isLoaded: true, isSignedIn: false, user: null });
    },
  };
}

export function useUser() {
  const auth = useRuntimeAuth();
  return {
    isLoaded: auth.isLoaded,
    isSignedIn: auth.isSignedIn,
    user: auth.user,
  };
}

function ModalAuthButton({ children, kind }: ClerkButtonProps & { kind: "in" | "up" }) {
  const navigate = useNavigate();
  const label = kind === "in" ? "Sign in to Route Ledger" : "Create a Route Ledger account";
  const action = kind === "in" ? "Continue as test user" : "Create test account";

  const handleClick: MouseEventHandler = (event) => {
    event.preventDefault();
    const trigger = event.currentTarget as HTMLElement;
    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-label", label);
    dialog.dataset.clerkTestDialog = kind;
    dialog.className = "fixed inset-4 z-[100] m-auto grid max-h-80 max-w-md place-content-center gap-4 rounded-lg border bg-card p-6 shadow-lg";

    const heading = document.createElement("h2");
    heading.textContent = label;
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = action;
    button.className = "rounded bg-primary px-4 py-2 text-primary-foreground";
    const close = document.createElement("button");
    close.type = "button";
    close.textContent = "Close";
    close.className = "rounded border px-4 py-2";
    const remove = () => {
      dialog.remove();
      trigger.focus();
    };
    button.addEventListener("click", () => {
      authenticate();
      dialog.remove();
      navigate("/lists");
    });
    close.addEventListener("click", remove);
    dialog.addEventListener("keydown", (keyboardEvent) => {
      if (keyboardEvent.key === "Escape") remove();
    });
    dialog.append(heading, button, close);
    document.body.appendChild(dialog);
    button.focus();
  };

  if (!isValidElement(children)) return children;
  const originalClick = children.props.onClick as MouseEventHandler | undefined;
  return cloneElement(children, {
    onClick: (event: React.MouseEvent) => {
      originalClick?.(event);
      if (!event.defaultPrevented) handleClick(event);
    },
  });
}

export function SignInButton(props: ClerkButtonProps) {
  return <ModalAuthButton {...props} kind="in" />;
}

export function SignUpButton(props: ClerkButtonProps) {
  return <ModalAuthButton {...props} kind="up" />;
}

function AuthSurface({
  fallbackRedirectUrl = "/lists",
  kind,
}: ClerkSurfaceProps & { kind: "in" | "up" }) {
  const location = useLocation();
  const navigate = useNavigate();
  const title = kind === "in" ? "Sign in" : "Create account";
  const description =
    kind === "in"
      ? "Use the deterministic test identity to continue."
      : "Create the deterministic test identity to continue.";
  const action = kind === "in" ? "Continue as test user" : "Create test account";

  return (
    <section className="w-full max-w-md rounded-lg border bg-card p-6" aria-label={title}>
      <h1 className="text-3xl font-semibold">{title}</h1>
      <p className="mt-2 text-muted-foreground">{description}</p>
      <button
        type="button"
        className="mt-6 min-h-11 rounded bg-primary px-4 py-2 text-primary-foreground"
        onClick={() => {
          authenticate();
          navigate(safeRedirect(location.search, fallbackRedirectUrl), {
            replace: true,
          });
        }}
      >
        {action}
      </button>
    </section>
  );
}

export function SignIn(props: ClerkSurfaceProps) {
  return <AuthSurface {...props} kind="in" />;
}

export function SignUp(props: ClerkSurfaceProps) {
  return <AuthSurface {...props} kind="up" />;
}

export function UserButton({ afterSignOutUrl = "/" }: { afterSignOutUrl?: string }) {
  const navigate = useNavigate();
  const auth = useRuntimeAuth();
  return (
    <button
      type="button"
      aria-label={`${auth.user?.fullName ?? "Test user"} account`}
      className="grid h-10 w-10 place-items-center rounded-full border"
      onClick={() => {
        getTestRuntime().setAuth({ isLoaded: true, isSignedIn: false, user: null });
        navigate(afterSignOutUrl);
      }}
    >
      RT
    </button>
  );
}

export function UserProfile({ routing }: { routing?: string }) {
  const auth = useRuntimeAuth();
  return (
    <section aria-label="Clerk profile settings">
      <p className="font-semibold">{auth.user?.fullName ?? "Test user"}</p>
      <p>{auth.user?.primaryEmailAddress.emailAddress ?? "tester@example.com"}</p>
      {routing ? <p className="sr-only">Profile routing: {routing}</p> : null}
    </section>
  );
}

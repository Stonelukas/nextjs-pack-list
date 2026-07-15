import { SignIn } from "@clerk/clerk-react";

import { clerkAppearance } from "./clerk-appearance";

export function SignInPage() {
  return (
    <SignIn
      appearance={clerkAppearance}
      fallbackRedirectUrl="/lists"
      path="/sign-in"
      routing="path"
      signUpUrl="/sign-up"
    />
  );
}

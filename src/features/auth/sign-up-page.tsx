import { SignUp } from "@clerk/clerk-react";

import { clerkAppearance } from "./clerk-appearance";

export function SignUpPage() {
  return (
    <SignUp
      appearance={clerkAppearance}
      fallbackRedirectUrl="/lists"
      path="/sign-up"
      routing="path"
      signInUrl="/sign-in"
    />
  );
}

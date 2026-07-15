/* global process */

const clerkJwtIssuerDomain = process.env.CLERK_JWT_ISSUER_DOMAIN?.trim();

if (!clerkJwtIssuerDomain) {
  throw new Error(
    "Missing required environment variable: CLERK_JWT_ISSUER_DOMAIN",
  );
}

let clerkJwtIssuerUrl;

try {
  clerkJwtIssuerUrl = new globalThis.URL(clerkJwtIssuerDomain);
} catch {
  throw new Error("CLERK_JWT_ISSUER_DOMAIN must be a valid HTTPS URL");
}

if (clerkJwtIssuerUrl.protocol !== "https:") {
  throw new Error("CLERK_JWT_ISSUER_DOMAIN must be a valid HTTPS URL");
}

export default {
  providers: [
    {
      domain: clerkJwtIssuerDomain,
      applicationID: "convex",
    },
  ],
};

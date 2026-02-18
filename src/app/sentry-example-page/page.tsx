import type { Metadata } from "next";
import SentryExampleContent from "./sentry-example-content";

export const metadata: Metadata = {
  title: "sentry-example-page",
  description: "Test Sentry for your Next.js app!",
};

export default function Page() {
  return <SentryExampleContent />;
}

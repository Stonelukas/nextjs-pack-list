import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "@/app/App";
import { runtimeEnv } from "@/lib/env";
import { initializeSentry } from "@/lib/monitoring/sentry";
import "@/styles/globals.css";

initializeSentry(
  runtimeEnv.status === "configured" ? runtimeEnv.env.sentryDsn : undefined,
);

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Unable to mount Route Ledger: #root was not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <App runtimeConfiguration={runtimeEnv} />
  </StrictMode>,
);

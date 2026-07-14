import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { useEffect } from "react";

import { reportWebVitals } from "@/lib/monitoring/web-vitals";

let webVitalsStarted = false;

export function Monitoring() {
  useEffect(() => {
    if (!webVitalsStarted) {
      webVitalsStarted = true;
      reportWebVitals();
    }
  }, []);

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}

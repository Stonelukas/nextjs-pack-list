import { track } from "@vercel/analytics";
import {
  onCLS,
  onFCP,
  onINP,
  onLCP,
  onTTFB,
  type Metric,
} from "web-vitals";

function reportMetric(metric: Metric) {
  track("web-vital", {
    id: metric.id,
    name: metric.name,
    rating: metric.rating,
    value: metric.value,
  });
}

export function reportWebVitals(): void {
  onCLS(reportMetric);
  onFCP(reportMetric);
  onINP(reportMetric);
  onLCP(reportMetric);
  onTTFB(reportMetric);
}

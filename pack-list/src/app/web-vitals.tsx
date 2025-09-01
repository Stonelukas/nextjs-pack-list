'use client'

import { useReportWebVitals } from 'next/web-vitals'

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(metric)
    }

    // Send to analytics endpoint in production
    if (process.env.NODE_ENV === 'production') {
      const body = JSON.stringify({
        id: metric.id,
        name: metric.name,
        label: metric.label,
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        navigationType: metric.navigationType,
        timestamp: new Date().toISOString(),
      })

      // You can send this to your analytics endpoint
      // Example: send to Vercel Analytics, Google Analytics, or custom endpoint
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', metric.name, {
          value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
          event_label: metric.id,
          non_interaction: true,
        })
      }
    }
  })

  return null
}
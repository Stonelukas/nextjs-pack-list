'use client'

import { useReportWebVitals } from 'next/web-vitals'
import { useAppPerformanceMonitor } from '@/hooks/usePerformanceMonitor'
import { reportWebVitalsWithBudget } from '@/lib/performance'
import { track } from '@vercel/analytics'

export function WebVitalsReporter() {
  const { generatePerformanceReport } = useAppPerformanceMonitor();

  useReportWebVitals((metric) => {
    // Use enhanced Web Vitals reporting with performance budgets
    reportWebVitalsWithBudget(metric);

    // Send to analytics endpoint in production
    if (process.env.NODE_ENV === 'production') {
      // Send to Vercel Analytics for Web Vitals dashboard
      track('web_vital', {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        id: metric.id
      });

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

      // Also send to Google Analytics if available
      if (typeof window !== 'undefined' && (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag) {
        (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', metric.name, {
          value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
          event_label: metric.id,
          non_interaction: true,
        })
      }

      // Generate comprehensive performance report for critical metrics
      if (['LCP', 'FID', 'CLS'].includes(metric.name)) {
        generatePerformanceReport().then(report => {
          if (report) {
            // In a real app, send this report to your analytics service
            console.log('Performance Report Generated:', report);
          }
        });
      }
    }
  })

  return null
}
'use client'

import { track } from '@vercel/analytics'
import { useCallback } from 'react'

/**
 * Custom analytics hook for tracking user interactions
 * Integrates with Vercel Analytics for comprehensive event tracking
 */
export function useAnalytics() {
  // Track list creation
  const trackListCreated = useCallback((listType: 'custom' | 'template', templateName?: string) => {
    track('list_created', {
      type: listType,
      template: templateName || 'custom',
      timestamp: new Date().toISOString()
    })
  }, [])

  // Track item actions
  const trackItemAction = useCallback((action: 'added' | 'packed' | 'unpacked' | 'deleted', priority?: string) => {
    track('item_action', {
      action,
      priority: priority || 'unknown',
      timestamp: new Date().toISOString()
    })
  }, [])

  // Track export actions
  const trackExport = useCallback((format: 'json' | 'csv' | 'pdf' | 'print', itemCount: number) => {
    track('list_exported', {
      format,
      item_count: itemCount,
      timestamp: new Date().toISOString()
    })
  }, [])

  // Track template usage
  const trackTemplateUsed = useCallback((templateName: string, categoryCount: number, itemCount: number) => {
    track('template_used', {
      template_name: templateName,
      category_count: categoryCount,
      item_count: itemCount,
      timestamp: new Date().toISOString()
    })
  }, [])

  // Track feature usage
  const trackFeatureUsed = useCallback((feature: string, details?: Record<string, unknown>) => {
    track('feature_used', {
      feature,
      ...details,
      timestamp: new Date().toISOString()
    })
  }, [])

  // Track user engagement
  const trackEngagement = useCallback((event: 'session_start' | 'session_end' | 'page_view', page?: string) => {
    track('user_engagement', {
      event,
      page: page || 'unknown',
      timestamp: new Date().toISOString()
    })
  }, [])

  // Track performance issues
  const trackPerformanceIssue = useCallback((metric: string, value: number, threshold: number) => {
    track('performance_issue', {
      metric,
      value,
      threshold,
      severity: value > threshold * 1.5 ? 'high' : 'medium',
      timestamp: new Date().toISOString()
    })
  }, [])

  return {
    trackListCreated,
    trackItemAction,
    trackExport,
    trackTemplateUsed,
    trackFeatureUsed,
    trackEngagement,
    trackPerformanceIssue
  }
}

/**
 * Analytics provider component for global analytics setup
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

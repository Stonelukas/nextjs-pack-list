/**
 * Performance monitoring hook for React components
 * Provides comprehensive performance tracking and optimization utilities
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  measurePerformance,
  reportWebVitalsWithBudget,
  getMemoryUsage,
  FrameRateMonitor,
  monitorLongTasks,
  analyzeResourceLoading,
  analyzeBundleSize
} from '@/lib/performance';

interface PerformanceMetrics {
  renderTime?: number;
  memoryUsage?: {
    used: number;
    total: number;
    percentage: number;
  } | null;
  fps?: number;
  componentMounts: number;
  componentUpdates: number;
}

interface UsePerformanceMonitorOptions {
  enableFrameRateMonitoring?: boolean;
  enableMemoryMonitoring?: boolean;
  enableRenderTimeTracking?: boolean;
  enableLongTaskDetection?: boolean;
  componentName?: string;
  logThreshold?: number;
}

/**
 * Custom hook for comprehensive performance monitoring
 */
export function usePerformanceMonitor(options: UsePerformanceMonitorOptions = {}) {
  const {
    enableFrameRateMonitoring = false,
    enableMemoryMonitoring = false,
    enableRenderTimeTracking = true,
    enableLongTaskDetection = false,
    componentName = 'UnknownComponent',
    logThreshold = 16, // 16ms = 60fps threshold
  } = options;

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    componentMounts: 0,
    componentUpdates: 0,
  });

  const frameRateMonitorRef = useRef<FrameRateMonitor | null>(null);
  const mountTimeRef = useRef<number>(0);
  const updateCountRef = useRef<number>(0);
  const renderCountRef = useRef<number>(0);

  // Track component mount time
  useEffect(() => {
    mountTimeRef.current = performance.now();
    
    setMetrics(prev => ({
      ...prev,
      componentMounts: prev.componentMounts + 1,
    }));

    return () => {
      if (frameRateMonitorRef.current) {
        frameRateMonitorRef.current.stop();
      }
    };
  }, []);

  // Track component updates
  useEffect(() => {
    updateCountRef.current++;
    setMetrics(prev => ({
      ...prev,
      componentUpdates: prev.componentUpdates + 1,
    }));
  });

  // Initialize performance monitoring
  useEffect(() => {
    let longTaskObserver: PerformanceObserver | undefined;

    // Frame rate monitoring
    if (enableFrameRateMonitoring && typeof window !== 'undefined') {
      frameRateMonitorRef.current = new FrameRateMonitor((fps) => {
        setMetrics(prev => ({ ...prev, fps }));
      });
      frameRateMonitorRef.current.start();
    }

    // Long task detection
    if (enableLongTaskDetection) {
      longTaskObserver = monitorLongTasks(logThreshold);
    }

    // Cleanup
    return () => {
      if (frameRateMonitorRef.current) {
        frameRateMonitorRef.current.stop();
      }
      if (longTaskObserver) {
        longTaskObserver.disconnect();
      }
    };
  }, [enableFrameRateMonitoring, enableLongTaskDetection, logThreshold]);

  // Memory monitoring
  const updateMemoryUsage = useCallback(() => {
    if (enableMemoryMonitoring) {
      const memoryUsage = getMemoryUsage();
      setMetrics(prev => ({ ...prev, memoryUsage }));
    }
  }, [enableMemoryMonitoring]);

  // Periodic memory updates
  useEffect(() => {
    if (enableMemoryMonitoring) {
      const interval = setInterval(updateMemoryUsage, 5000); // Update every 5 seconds
      return () => clearInterval(interval);
    }
  }, [enableMemoryMonitoring, updateMemoryUsage]);

  // Measure render performance
  const measureRender = useCallback(<T>(fn: () => T): T => {
    if (!enableRenderTimeTracking) return fn();

    renderCountRef.current++;
    const renderName = `${componentName}-render-${renderCountRef.current}`;
    
    return measurePerformance(renderName, () => {
      const startTime = performance.now();
      const result = fn();
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      if (renderTime > logThreshold) {
        console.warn(`🐌 Slow render in ${componentName}: ${renderTime.toFixed(2)}ms`);
      }

      setMetrics(prev => ({ ...prev, renderTime }));
      return result;
    });
  }, [enableRenderTimeTracking, componentName, logThreshold]);

  // Performance profiling utilities
  const startProfile = useCallback((profileName: string) => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.mark(`${profileName}-start`);
    }
  }, []);

  const endProfile = useCallback((profileName: string) => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.mark(`${profileName}-end`);
      performance.measure(`${profileName}-duration`, `${profileName}-start`, `${profileName}-end`);
      
      const measure = performance.getEntriesByName(`${profileName}-duration`)[0];
      if (measure && process.env.NODE_ENV === 'development') {
        console.log(`⏱️ ${profileName}: ${measure.duration.toFixed(2)}ms`);
      }

      // Cleanup
      performance.clearMarks(`${profileName}-start`);
      performance.clearMarks(`${profileName}-end`);
      performance.clearMeasures(`${profileName}-duration`);

      return measure?.duration || 0;
    }
    return 0;
  }, []);

  // Report Web Vitals
  const reportWebVital = useCallback((metric: {
    name: string;
    value: number;
    delta: number;
    id: string;
  }) => {
    reportWebVitalsWithBudget(metric);
  }, []);

  // Get comprehensive performance snapshot
  const getPerformanceSnapshot = useCallback(async () => {
    const snapshot = {
      ...metrics,
      timestamp: Date.now(),
      componentName,
      memoryUsage: enableMemoryMonitoring ? getMemoryUsage() : null,
      bundleAnalysis: await analyzeBundleSize(),
      resourceAnalysis: analyzeResourceLoading(),
    };

    if (process.env.NODE_ENV === 'development') {
      console.group(`📊 Performance Snapshot - ${componentName}`);
      console.log('Metrics:', snapshot);
      console.groupEnd();
    }

    return snapshot;
  }, [metrics, componentName, enableMemoryMonitoring]);

  // Performance optimization suggestions
  const getOptimizationSuggestions = useCallback(() => {
    const suggestions: string[] = [];

    if (metrics.renderTime && metrics.renderTime > 16) {
      suggestions.push('Consider optimizing render performance - current render time exceeds 16ms');
    }

    if (metrics.componentUpdates > 50) {
      suggestions.push('High number of component updates detected - consider memoization');
    }

    if (metrics.memoryUsage && metrics.memoryUsage.percentage > 80) {
      suggestions.push('High memory usage detected - check for memory leaks');
    }

    if (metrics.fps && metrics.fps < 30) {
      suggestions.push('Low FPS detected - check for performance bottlenecks');
    }

    return suggestions;
  }, [metrics]);

  // Performance utilities object
  const performanceUtils = {
    measureRender,
    startProfile,
    endProfile,
    reportWebVital,
    getPerformanceSnapshot,
    getOptimizationSuggestions,
    updateMemoryUsage,
  };

  return {
    metrics,
    ...performanceUtils,
  };
}

/**
 * HOC for automatic performance monitoring
 */
export function withPerformanceMonitoring<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: UsePerformanceMonitorOptions
) {
  const PerformanceMonitoredComponent = (props: P) => {
    const { measureRender } = usePerformanceMonitor({
      ...options,
      componentName: WrappedComponent.displayName || WrappedComponent.name || 'Component',
    });

    return measureRender(() => React.createElement(WrappedComponent, props));
  };

  PerformanceMonitoredComponent.displayName = 
    `withPerformanceMonitoring(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return PerformanceMonitoredComponent;
}

/**
 * Performance monitoring provider for app-wide metrics
 */
export function useAppPerformanceMonitor() {
  const [isMonitoringActive, setIsMonitoringActive] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      setIsMonitoringActive(true);

      // Start comprehensive monitoring
      const longTaskObserver = monitorLongTasks(50);
      
      // Analyze bundle on app load
      setTimeout(() => {
        analyzeBundleSize();
        analyzeResourceLoading();
      }, 1000);

      return () => {
        if (longTaskObserver) {
          longTaskObserver.disconnect();
        }
      };
    }
  }, []);

  const generatePerformanceReport = useCallback(async () => {
    if (typeof window === 'undefined') return null;

    const report = {
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      connection: (navigator as Navigator & {
        connection?: {
          effectiveType: string;
          downlink: number;
          rtt: number;
        }
      }).connection ? {
        effectiveType: (navigator as Navigator & {
          connection: {
            effectiveType: string;
            downlink: number;
            rtt: number;
          }
        }).connection.effectiveType,
        downlink: (navigator as Navigator & {
          connection: {
            effectiveType: string;
            downlink: number;
            rtt: number;
          }
        }).connection.downlink,
        rtt: (navigator as Navigator & {
          connection: {
            effectiveType: string;
            downlink: number;
            rtt: number;
          }
        }).connection.rtt,
      } : null,
      memoryUsage: getMemoryUsage(),
      bundleAnalysis: await analyzeBundleSize(),
      resourceAnalysis: analyzeResourceLoading(),
    };

    if (process.env.NODE_ENV === 'development') {
      console.group('📋 Performance Report');
      console.log(report);
      console.groupEnd();
    }

    return report;
  }, []);

  return {
    isMonitoringActive,
    generatePerformanceReport,
  };
}
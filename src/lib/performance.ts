/**
 * Performance monitoring and optimization utilities
 * Provides tools for measuring, debouncing, throttling, and memoization
 */

/**
 * Measures the performance of a function execution using Performance API
 * @param name - Name for the performance measurement
 * @param fn - Function to measure
 * @returns The result of the function execution
 */
export const measurePerformance = <T>(name: string, fn: () => T): T => {
  if (typeof window === 'undefined') return fn();
  
  const startMark = `${name}-start`;
  const endMark = `${name}-end`;
  const measureName = `${name}-duration`;
  
  performance.mark(startMark);
  const result = fn();
  performance.mark(endMark);
  
  performance.measure(measureName, startMark, endMark);
  
  const measure = performance.getEntriesByName(measureName)[0];
  if (measure && process.env.NODE_ENV === 'development') {
    console.log(`⚡ ${name}: ${measure.duration.toFixed(2)}ms`);
  }
  
  // Clean up marks and measures
  performance.clearMarks(startMark);
  performance.clearMarks(endMark);
  performance.clearMeasures(measureName);
  
  return result;
};

/**
 * Debounces a function to prevent excessive calls
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

export const throttle = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): T => {
  let inThrottle = false;
  let lastResult: ReturnType<T>;
  
  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      lastResult = fn(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
    return lastResult;
  }) as T;
};

export const memoize = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  getKey?: (...args: Parameters<T>) => string
): T => {
  const cache = new Map();
  
  return ((...args: Parameters<T>) => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    // Limit cache size to prevent memory leaks
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    return result;
  }) as T;
};

// Report Web Vitals
export const reportWebVitals = (metric: Record<string, unknown>) => {
  if (process.env.NODE_ENV === 'production') {
    // Send to analytics service
    console.log(metric);
  }
};

// Intersection Observer for lazy loading
export const createLazyLoader = (
  callback: (entry: IntersectionObserverEntry) => void,
  options?: IntersectionObserverInit
) => {
  if (typeof window === 'undefined') return null;
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        callback(entry);
        observer.unobserve(entry.target);
      }
    });
  }, options);
  
  return observer;
};

/**
 * Advanced performance monitoring utilities
 */

/**
 * Performance budget monitor for Core Web Vitals
 */
export interface WebVital {
  name: string;
  value: number;
  threshold: {
    good: number;
    needs_improvement: number;
    poor: number;
  };
}

const CORE_WEB_VITALS_THRESHOLDS = {
  LCP: { good: 2500, needs_improvement: 4000, poor: Infinity },
  FID: { good: 100, needs_improvement: 300, poor: Infinity },
  CLS: { good: 0.1, needs_improvement: 0.25, poor: Infinity },
  FCP: { good: 1800, needs_improvement: 3000, poor: Infinity },
  TTFB: { good: 800, needs_improvement: 1800, poor: Infinity },
};

/**
 * Enhanced Web Vitals reporting with performance budgets
 */
export const reportWebVitalsWithBudget = (metric: {
  name: string;
  value: number;
  delta: number;
  id: string;
}) => {
  const threshold = CORE_WEB_VITALS_THRESHOLDS[metric.name as keyof typeof CORE_WEB_VITALS_THRESHOLDS];
  
  if (threshold) {
    let rating: 'good' | 'needs-improvement' | 'poor';
    
    if (metric.value <= threshold.good) {
      rating = 'good';
    } else if (metric.value <= threshold.needs_improvement) {
      rating = 'needs-improvement';
    } else {
      rating = 'poor';
    }

    const vitalsData = {
      ...metric,
      rating,
      threshold,
      timestamp: Date.now(),
    };

    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 ${metric.name}: ${metric.value}ms (${rating})`);
    }

    // In production, send to analytics
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to analytics service (Google Analytics, etc.)
      console.log('Web Vital:', vitalsData);
    }
  }
};

/**
 * Memory usage monitor
 */
export const getMemoryUsage = (): {
  used: number;
  total: number;
  percentage: number;
} | null => {
  if (typeof window === 'undefined' || !('memory' in performance)) {
    return null;
  }

  const memory = (performance as Performance & {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    }
  }).memory;

  if (!memory) {
    return null;
  }

  const used = memory.usedJSHeapSize;
  const total = memory.totalJSHeapSize;
  const percentage = Math.round((used / total) * 100);

  return { used, total, percentage };
};

/**
 * Frame rate monitor using requestAnimationFrame
 */
export class FrameRateMonitor {
  private frameCount = 0;
  private lastTime = 0;
  private isRunning = false;
  private onUpdate?: (fps: number) => void;

  constructor(onUpdate?: (fps: number) => void) {
    this.onUpdate = onUpdate;
  }

  private tick = (currentTime: number) => {
    if (!this.isRunning) return;

    this.frameCount++;

    if (currentTime >= this.lastTime + 1000) {
      const fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
      
      if (this.onUpdate) {
        this.onUpdate(fps);
      }

      if (process.env.NODE_ENV === 'development' && fps < 30) {
        console.warn(`🐌 Low FPS detected: ${fps}`);
      }

      this.frameCount = 0;
      this.lastTime = currentTime;
    }

    requestAnimationFrame(this.tick);
  };

  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.frameCount = 0;
      this.lastTime = performance.now();
      requestAnimationFrame(this.tick);
    }
  }

  stop() {
    this.isRunning = false;
  }
}

/**
 * Bundle analyzer utilities
 */
export const analyzeBundleSize = async () => {
  if (typeof window === 'undefined') return;

  try {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paintEntries = performance.getEntriesByType('paint');
    
    const metrics = {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      firstPaint: paintEntries.find(entry => entry.name === 'first-paint')?.startTime || 0,
      firstContentfulPaint: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
      transferSize: navigation.transferSize,
      encodedBodySize: navigation.encodedBodySize,
      decodedBodySize: navigation.decodedBodySize,
    };

    if (process.env.NODE_ENV === 'development') {
      console.group('📦 Bundle Analysis');
      console.log('Transfer Size:', Math.round(metrics.transferSize / 1024), 'KB');
      console.log('Decoded Size:', Math.round(metrics.decodedBodySize / 1024), 'KB');
      console.log('Compression Ratio:', Math.round((1 - metrics.transferSize / metrics.decodedBodySize) * 100), '%');
      console.log('First Contentful Paint:', Math.round(metrics.firstContentfulPaint), 'ms');
      console.groupEnd();
    }

    return metrics;
  } catch (error) {
    console.warn('Bundle analysis failed:', error);
  }
};

/**
 * Long task detection for identifying performance bottlenecks
 */
export const monitorLongTasks = (threshold = 50) => {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return;
  }

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > threshold) {
          console.warn(`🐌 Long task detected: ${Math.round(entry.duration)}ms`, {
            startTime: entry.startTime,
            duration: entry.duration,
          });
        }
      }
    });

    observer.observe({ entryTypes: ['longtask'] });
    return observer;
  } catch (error) {
    console.warn('Long task monitoring not supported:', error);
  }
};

/**
 * Resource loading performance monitor
 */
export const analyzeResourceLoading = () => {
  if (typeof window === 'undefined') return;

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const analysis = {
    scripts: [] as Array<{ name: string; duration: number; size: number }>,
    stylesheets: [] as Array<{ name: string; duration: number; size: number }>,
    images: [] as Array<{ name: string; duration: number; size: number }>,
    fonts: [] as Array<{ name: string; duration: number; size: number }>,
    other: [] as Array<{ name: string; duration: number; size: number }>,
  };

  resources.forEach((resource) => {
    const duration = resource.responseEnd - resource.requestStart;
    const size = resource.transferSize || 0;
    const resourceInfo = {
      name: resource.name.split('/').pop() || resource.name,
      duration,
      size,
    };

    if (resource.name.includes('.js')) {
      analysis.scripts.push(resourceInfo);
    } else if (resource.name.includes('.css')) {
      analysis.stylesheets.push(resourceInfo);
    } else if (resource.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
      analysis.images.push(resourceInfo);
    } else if (resource.name.match(/\.(woff|woff2|ttf|eot)$/)) {
      analysis.fonts.push(resourceInfo);
    } else {
      analysis.other.push(resourceInfo);
    }
  });

  // Sort by duration (slowest first)
  Object.values(analysis).forEach(arr => 
    arr.sort((a, b) => b.duration - a.duration)
  );

  if (process.env.NODE_ENV === 'development') {
    console.group('📊 Resource Loading Analysis');
    console.log('Slowest Scripts:', analysis.scripts.slice(0, 3));
    console.log('Slowest Images:', analysis.images.slice(0, 3));
    console.log('Total Resources:', resources.length);
    console.groupEnd();
  }

  return analysis;
};

/**
 * Preload critical resources with performance monitoring
 */
export const preloadCriticalResources = (resources: Array<{
  href: string;
  as: string;
  type?: string;
  crossOrigin?: string;
}>) => {
  if (typeof window === 'undefined') return;

  const startTime = performance.now();
  const promises = resources.map(resource => {
    return new Promise<void>((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.as;
      
      if (resource.type) link.type = resource.type;
      if (resource.crossOrigin) link.crossOrigin = resource.crossOrigin;

      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to preload ${resource.href}`));

      document.head.appendChild(link);
    });
  });

  return Promise.allSettled(promises).then(results => {
    const endTime = performance.now();
    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    if (process.env.NODE_ENV === 'development') {
      console.log(`⚡ Preloaded ${succeeded}/${resources.length} resources in ${Math.round(endTime - startTime)}ms`);
      if (failed > 0) {
        console.warn(`❌ Failed to preload ${failed} resources`);
      }
    }

    return { succeeded, failed, duration: endTime - startTime };
  });
};
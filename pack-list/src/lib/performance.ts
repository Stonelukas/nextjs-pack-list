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
  let lastResult: any;
  
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
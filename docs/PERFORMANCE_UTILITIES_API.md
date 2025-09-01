# Performance Utilities API Reference

**Target**: `pack-list/src/lib/performance.ts`  
**Type**: API Documentation  
**Style**: Detailed  
**Generated**: September 01, 2025

## Overview

The Performance Utilities module provides a comprehensive set of tools for monitoring, optimizing, and managing performance in the Pack List application. This module includes functions for performance measurement, function optimization (debouncing, throttling, memoization), lazy loading, and Web Vitals monitoring.

## Core Functions

### measurePerformance<T>(name: string, fn: () => T): T

**Description**: Measures the execution time of a function using the Performance API and logs the results in development mode.

**Parameters**:
- `name` (string): Identifier for the performance measurement
- `fn` (() => T): Function to measure and execute

**Returns**: The result of the executed function

**Features**:
- Server-side rendering safe (returns early if `window` is undefined)
- Automatic cleanup of performance marks and measures
- Development-only logging with formatted output
- Generic type support for any return type

**Example**:
```typescript
import { measurePerformance } from '@/lib/performance';

// Measure expensive calculation
const result = measurePerformance('heavy-calculation', () => {
  return expensiveDataProcessing(largeDataset);
});

// Measure React component render
const optimizedRender = measurePerformance('component-render', () => {
  return <ComplexComponent data={data} />;
});
```

**Performance Impact**: Minimal overhead in production, ~0.1ms overhead in development

---

### debounce<T>(fn: T, delay: number): (...args: Parameters<T>) => void

**Description**: Creates a debounced version of a function that delays execution until after the specified delay has passed since the last invocation.

**Parameters**:
- `fn` (T): Function to debounce
- `delay` (number): Delay in milliseconds

**Returns**: Debounced function that accepts the same parameters as the original

**Use Cases**:
- Search input handling
- API call optimization
- Resize event handling
- Form validation

**Example**:
```typescript
import { debounce } from '@/lib/performance';

// Debounce search function
const debouncedSearch = debounce((query: string) => {
  searchAPI(query);
}, 300);

// Usage in React component
const SearchComponent = () => {
  const handleSearch = debounce((e: React.ChangeEvent<HTMLInputElement>) => {
    performSearch(e.target.value);
  }, 500);

  return <input onChange={handleSearch} placeholder="Search..." />;
};
```

**Memory Management**: Automatically clears previous timeouts to prevent memory leaks

---

### throttle<T>(fn: T, limit: number): T

**Description**: Creates a throttled version of a function that executes at most once per specified time limit.

**Parameters**:
- `fn` (T): Function to throttle
- `limit` (number): Time limit in milliseconds

**Returns**: Throttled function with the same signature as the original

**Use Cases**:
- Scroll event handling
- Mouse move tracking
- Button click protection
- Animation frame limiting

**Example**:
```typescript
import { throttle } from '@/lib/performance';

// Throttle scroll handler
const throttledScroll = throttle(() => {
  updateScrollPosition();
}, 16); // ~60fps

// Usage with event listener
window.addEventListener('scroll', throttledScroll);

// Throttle expensive calculations
const throttledCalculation = throttle((data: number[]) => {
  return performComplexAnalysis(data);
}, 1000);
```

**Behavior**: Returns the last computed result during throttle period

---

### memoize<T>(fn: T, getKey?: (...args: Parameters<T>) => string): T

**Description**: Creates a memoized version of a function that caches results based on input parameters.

**Parameters**:
- `fn` (T): Function to memoize
- `getKey` (optional): Custom key generation function for cache keys

**Returns**: Memoized function with automatic caching

**Features**:
- Automatic cache size limiting (max 100 entries)
- LRU-style cache eviction
- Custom key generation support
- Memory leak prevention

**Example**:
```typescript
import { memoize } from '@/lib/performance';

// Memoize expensive calculation
const memoizedCalculation = memoize((a: number, b: number) => {
  return expensiveComputation(a, b);
});

// Custom key generation
const memoizedWithCustomKey = memoize(
  (user: User) => formatUserData(user),
  (user: User) => `user-${user.id}-${user.updatedAt}`
);

// Usage in React component
const ExpensiveComponent = ({ data }: { data: ComplexData }) => {
  const processedData = useMemo(() => 
    memoizedCalculation(data.value1, data.value2), 
    [data.value1, data.value2]
  );
  
  return <div>{processedData}</div>;
};
```

**Cache Management**: Automatically limits cache size and evicts oldest entries

---

## Advanced Features

### createLazyLoader(callback, options?): IntersectionObserver | null

**Description**: Creates an Intersection Observer for implementing lazy loading functionality.

**Parameters**:
- `callback` ((entry: IntersectionObserverEntry) => void): Function called when element intersects
- `options` (IntersectionObserverInit, optional): Observer configuration options

**Returns**: IntersectionObserver instance or null if not in browser environment

**Example**:
```typescript
import { createLazyLoader } from '@/lib/performance';

// Lazy load images
const imageLoader = createLazyLoader((entry) => {
  const img = entry.target as HTMLImageElement;
  img.src = img.dataset.src!;
  img.classList.remove('lazy');
}, {
  rootMargin: '50px 0px',
  threshold: 0.1
});

// Usage
const LazyImage = ({ src, alt }: { src: string; alt: string }) => {
  const imgRef = useRef<HTMLImageElement>(null);
  
  useEffect(() => {
    if (imgRef.current && imageLoader) {
      imageLoader.observe(imgRef.current);
    }
  }, []);
  
  return <img ref={imgRef} data-src={src} alt={alt} className="lazy" />;
};
```

### reportWebVitals(metric: Record<string, unknown>): void

**Description**: Reports Web Vitals metrics for performance monitoring in production.

**Parameters**:
- `metric` (Record<string, unknown>): Web Vitals metric data

**Integration**: Designed to work with Next.js Web Vitals reporting

**Example**:
```typescript
// In _app.tsx or layout.tsx
import { reportWebVitals } from '@/lib/performance';

export function reportWebVitals(metric: NextWebVitalsMetric) {
  reportWebVitals({
    name: metric.name,
    value: metric.value,
    id: metric.id,
    label: metric.label,
  });
}
```

## Performance Monitoring Types

### WebVital Interface
```typescript
interface WebVital {
  name: string;
  value: number;
  threshold: {
    good: number;
    needs_improvement: number;
    poor: number;
  };
}
```

## Usage Patterns

### React Component Optimization
```typescript
import { measurePerformance, debounce, memoize } from '@/lib/performance';

const OptimizedComponent = ({ data, onSearch }: Props) => {
  // Memoize expensive calculations
  const processedData = useMemo(() => 
    measurePerformance('data-processing', () => 
      memoizedDataProcessor(data)
    ), 
    [data]
  );
  
  // Debounce user input
  const debouncedSearch = useMemo(() => 
    debounce(onSearch, 300), 
    [onSearch]
  );
  
  return (
    <div>
      <input onChange={(e) => debouncedSearch(e.target.value)} />
      <DataDisplay data={processedData} />
    </div>
  );
};
```

### Performance Monitoring Setup
```typescript
import { measurePerformance, reportWebVitals } from '@/lib/performance';

// Monitor critical user journeys
const monitoredUserAction = measurePerformance('user-action', () => {
  // Critical user action
  return performUserAction();
});

// Set up Web Vitals reporting
export function reportWebVitals(metric: NextWebVitalsMetric) {
  reportWebVitals(metric);
}
```

## Best Practices

1. **Use measurePerformance** for identifying bottlenecks during development
2. **Apply debounce** to user input handlers (300-500ms typical)
3. **Use throttle** for high-frequency events like scroll (16ms for 60fps)
4. **Implement memoization** for expensive pure functions
5. **Set up lazy loading** for images and heavy components
6. **Monitor Web Vitals** in production for performance insights

## Performance Impact

- **measurePerformance**: ~0.1ms overhead in development, negligible in production
- **debounce/throttle**: Minimal memory overhead, significant performance gains
- **memoize**: Memory usage scales with cache size, CPU savings for repeated calls
- **createLazyLoader**: Reduces initial page load time, improves perceived performance

## Related Components

- **useOptimizedStore**: Uses these utilities for store optimization
- **Performance Monitoring Hook**: Integrates with measurePerformance
- **Lazy Loading Components**: Uses createLazyLoader for image optimization

---

*This API reference provides comprehensive documentation for the performance utilities module, enabling developers to effectively optimize Pack List application performance.*

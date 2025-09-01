/**
 * Development tooling utilities for enhanced developer experience
 * Provides debugging, testing, and development workflow improvements
 */


/**
 * Development environment detection and utilities
 */
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const isTest = process.env.NODE_ENV === 'test';

/**
 * Enhanced console logging with categorization and styling
 */
export const devLog = {
  info: (message: string, data?: unknown) => {
    if (isDevelopment) {
      console.log(`💙 INFO: ${message}`, data || '');
    }
  },
  success: (message: string, data?: unknown) => {
    if (isDevelopment) {
      console.log(`💚 SUCCESS: ${message}`, data || '');
    }
  },
  warning: (message: string, data?: unknown) => {
    if (isDevelopment) {
      console.warn(`💛 WARNING: ${message}`, data || '');
    }
  },
  error: (message: string, error?: Error | unknown) => {
    if (isDevelopment) {
      console.error(`❤️ ERROR: ${message}`, error || '');
    }
  },
  debug: (message: string, data?: unknown) => {
    if (isDevelopment && process.env.DEBUG) {
      console.log(`🔍 DEBUG: ${message}`, data || '');
    }
  },
  performance: (message: string, duration: number) => {
    if (isDevelopment) {
      const color = duration > 100 ? '🔴' : duration > 50 ? '🟡' : '🟢';
      console.log(`${color} PERF: ${message} - ${duration.toFixed(2)}ms`);
    }
  }
};

/**
 * Component development tools
 */
export class ComponentDevTools {
  private static instances = new Map<string, ComponentDevTools>();
  
  constructor(private componentName: string) {
    ComponentDevTools.instances.set(componentName, this);
  }

  static getAll() {
    return Array.from(ComponentDevTools.instances.values());
  }

  static get(componentName: string) {
    return ComponentDevTools.instances.get(componentName);
  }

  logRender(props?: unknown, state?: unknown) {
    if (isDevelopment) {
      console.group(`🔄 ${this.componentName} Render`);
      if (props) console.log('Props:', props);
      if (state) console.log('State:', state);
      console.groupEnd();
    }
  }

  logMount(initialProps?: unknown) {
    if (isDevelopment) {
      devLog.success(`${this.componentName} mounted`, initialProps);
    }
  }

  logUnmount() {
    if (isDevelopment) {
      devLog.info(`${this.componentName} unmounted`);
    }
  }

  logUpdate(prevProps?: Record<string, unknown>, newProps?: Record<string, unknown>, reason?: string) {
    if (isDevelopment) {
      console.group(`🔄 ${this.componentName} Update`);
      if (reason) console.log('Reason:', reason);
      if (prevProps && newProps) {
        console.log('Props changed:', this.getChangedProps(prevProps, newProps));
      }
      console.groupEnd();
    }
  }

  private getChangedProps(prev: Record<string, unknown>, next: Record<string, unknown>): Record<string, { from: unknown; to: unknown }> {
    const changes: Record<string, { from: unknown; to: unknown }> = {};
    
    for (const key in next) {
      if (prev[key] !== next[key]) {
        changes[key] = { from: prev[key], to: next[key] };
      }
    }
    
    return changes;
  }
}

/**
 * State debugging utilities
 */
export const stateLogger = {
  logStateChange: <T>(stateName: string, oldValue: T, newValue: T, action?: string) => {
    if (isDevelopment) {
      console.group(`🔄 State Change: ${stateName}`);
      if (action) console.log('Action:', action);
      console.log('Old Value:', oldValue);
      console.log('New Value:', newValue);
      console.log('Diff:', JSON.stringify(newValue) !== JSON.stringify(oldValue));
      console.groupEnd();
    }
  },

  logStoreSnapshot: (storeName: string, state: unknown) => {
    if (isDevelopment) {
      console.group(`📸 Store Snapshot: ${storeName}`);
      console.log(JSON.parse(JSON.stringify(state)));
      console.groupEnd();
    }
  }
};

/**
 * API debugging utilities
 */
export const apiLogger = {
  logRequest: (method: string, url: string, data?: unknown) => {
    if (isDevelopment) {
      console.group(`🌐 API Request: ${method.toUpperCase()} ${url}`);
      if (data) console.log('Request Data:', data);
      console.groupEnd();
    }
  },

  logResponse: (method: string, url: string, status: number, data?: unknown, duration?: number) => {
    if (isDevelopment) {
      const statusColor = status < 300 ? '🟢' : status < 400 ? '🟡' : '🔴';
      console.group(`${statusColor} API Response: ${method.toUpperCase()} ${url} - ${status}`);
      if (duration) console.log(`Duration: ${duration}ms`);
      if (data) console.log('Response Data:', data);
      console.groupEnd();
    }
  },

  logError: (method: string, url: string, error: Error) => {
    if (isDevelopment) {
      console.group(`🔴 API Error: ${method.toUpperCase()} ${url}`);
      console.error(error);
      console.groupEnd();
    }
  }
};

/**
 * Feature flags for development
 */
export class FeatureFlags {
  private static flags: Map<string, boolean> = new Map();

  static set(flagName: string, enabled: boolean) {
    this.flags.set(flagName, enabled);
    if (isDevelopment) {
      devLog.info(`Feature flag "${flagName}" set to ${enabled}`);
    }
  }

  static get(flagName: string, defaultValue = false): boolean {
    return this.flags.get(flagName) ?? defaultValue;
  }

  static toggle(flagName: string): boolean {
    const currentValue = this.get(flagName);
    const newValue = !currentValue;
    this.set(flagName, newValue);
    return newValue;
  }

  static getAll(): Record<string, boolean> {
    return Object.fromEntries(this.flags);
  }

  static clear() {
    this.flags.clear();
    if (isDevelopment) {
      devLog.info('All feature flags cleared');
    }
  }
}

/**
 * Development testing utilities
 */
export const testUtils = {
  generateTestData: <T>(factory: () => T, count = 1): T[] => {
    return Array.from({ length: count }, factory);
  },

  mockLocalStorage: () => {
    const storage: Record<string, string> = {};
    return {
      getItem: (key: string) => storage[key] || null,
      setItem: (key: string, value: string) => {
        storage[key] = value;
      },
      removeItem: (key: string) => {
        delete storage[key];
      },
      clear: () => {
        Object.keys(storage).forEach(key => delete storage[key]);
      },
      length: Object.keys(storage).length,
      key: (index: number) => Object.keys(storage)[index] || null,
    };
  },

  simulateNetworkDelay: (min = 100, max = 500): Promise<void> => {
    const delay = Math.random() * (max - min) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  },

  simulateError: (probability = 0.1): boolean => {
    return Math.random() < probability;
  }
};

/**
 * Performance testing utilities
 */
export const performanceTestUtils = {
  measureFunction: <T>(name: string, fn: () => T): { result: T; duration: number } => {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    const duration = end - start;

    devLog.performance(`${name} execution`, duration);
    
    return { result, duration };
  },

  measureAsyncFunction: async <T>(name: string, fn: () => Promise<T>): Promise<{ result: T; duration: number }> => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    const duration = end - start;

    devLog.performance(`${name} async execution`, duration);
    
    return { result, duration };
  },

  benchmarkFunction: <T>(name: string, fn: () => T, iterations = 1000): {
    average: number;
    min: number;
    max: number;
    total: number;
  } => {
    const durations: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      fn();
      const end = performance.now();
      durations.push(end - start);
    }

    const total = durations.reduce((sum, d) => sum + d, 0);
    const average = total / iterations;
    const min = Math.min(...durations);
    const max = Math.max(...durations);

    const results = { average, min, max, total };
    
    if (isDevelopment) {
      console.group(`📊 Benchmark: ${name} (${iterations} iterations)`);
      console.log('Average:', average.toFixed(4), 'ms');
      console.log('Min:', min.toFixed(4), 'ms');
      console.log('Max:', max.toFixed(4), 'ms');
      console.log('Total:', total.toFixed(4), 'ms');
      console.groupEnd();
    }

    return results;
  }
};

/**
 * Code quality utilities
 */
export const codeQualityUtils = {
  checkTypeScript: () => {
    // This would integrate with TypeScript compiler API in a real implementation
    if (isDevelopment) {
      devLog.info('TypeScript type checking (placeholder)');
    }
  },

  checkESLint: () => {
    // This would integrate with ESLint API in a real implementation
    if (isDevelopment) {
      devLog.info('ESLint checking (placeholder)');
    }
  },

  generateComponentReport: (componentName: string) => {
    const devTools = ComponentDevTools.get(componentName);
    if (devTools) {
      console.group(`📋 Component Report: ${componentName}`);
      console.log('Component found in dev tools registry');
      console.groupEnd();
    } else {
      devLog.warning(`Component "${componentName}" not found in dev tools registry`);
    }
  }
};

/**
 * Environment information utilities
 */
export const environmentInfo = {
  getBrowserInfo: () => {
    if (typeof window === 'undefined') return null;

    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      screen: {
        width: window.screen.width,
        height: window.screen.height,
        colorDepth: window.screen.colorDepth,
      }
    };
  },

  getPerformanceInfo: () => {
    if (typeof window === 'undefined') return null;

    return {
      memory: (performance as Performance & {
        memory?: {
          usedJSHeapSize: number;
          totalJSHeapSize: number;
          jsHeapSizeLimit: number;
        }
      }).memory ? {
        usedJSHeapSize: (performance as Performance & {
          memory: {
            usedJSHeapSize: number;
            totalJSHeapSize: number;
            jsHeapSizeLimit: number;
          }
        }).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as Performance & {
          memory: {
            usedJSHeapSize: number;
            totalJSHeapSize: number;
            jsHeapSizeLimit: number;
          }
        }).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as Performance & {
          memory: {
            usedJSHeapSize: number;
            totalJSHeapSize: number;
            jsHeapSizeLimit: number;
          }
        }).memory.jsHeapSizeLimit,
      } : null,
      timing: performance.timing,
      navigation: performance.navigation,
    };
  },

  printEnvironmentReport: () => {
    if (isDevelopment) {
      console.group('🌍 Environment Report');
      console.log('Browser Info:', environmentInfo.getBrowserInfo());
      console.log('Performance Info:', environmentInfo.getPerformanceInfo());
      console.log('Feature Flags:', FeatureFlags.getAll());
      console.log('Component Registry:', ComponentDevTools.getAll().length, 'components');
      console.groupEnd();
    }
  }
};

/**
 * Development shortcuts and utilities
 */
export const devShortcuts = {
  clearStorage: () => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
      devLog.success('Local and session storage cleared');
    }
  },

  dumpState: (storeName: string, state: unknown) => {
    if (isDevelopment) {
      const stateString = JSON.stringify(state, null, 2);
      console.log(`📝 ${storeName} State Dump:\n${stateString}`);
      
      // Also copy to clipboard if possible
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(stateString).then(() => {
          devLog.success('State copied to clipboard');
        });
      }
    }
  },

  reloadCSS: () => {
    if (typeof document !== 'undefined') {
      const links = document.querySelectorAll('link[rel="stylesheet"]');
      links.forEach((link: HTMLLinkElement) => {
        const href = link.href;
        link.href = href + (href.includes('?') ? '&' : '?') + 'reload=' + Date.now();
      });
      devLog.success('CSS reloaded');
    }
  }
};

/**
 * Global development tools initialization
 */
export const initializeDevTools = () => {
  if (isDevelopment && typeof window !== 'undefined') {
    // Expose dev tools to global window object for console access
    (window as Window & { __DEV_TOOLS__?: unknown }).__DEV_TOOLS__ = {
      devLog,
      stateLogger,
      apiLogger,
      FeatureFlags,
      testUtils,
      performanceTestUtils,
      codeQualityUtils,
      environmentInfo,
      devShortcuts,
      ComponentDevTools,
    };

    devLog.success('Development tools initialized. Access via window.__DEV_TOOLS__');
    
    // Print initial environment report
    setTimeout(() => {
      environmentInfo.printEnvironmentReport();
    }, 1000);
  }
};
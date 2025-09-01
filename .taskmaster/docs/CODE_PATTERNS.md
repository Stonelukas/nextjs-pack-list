# task-master-init - Code Patterns & Snippets

Reusable code patterns and snippets for common development tasks in task-master-init.

## Table of Contents
1. [Project Conventions](#project-conventions)
2. [Common Patterns](#common-patterns)
3. [Error Handling](#error-handling)
4. [Testing Patterns](#testing-patterns)
5. [Performance Patterns](#performance-patterns)
6. [Security Patterns](#security-patterns)

---

## Project Conventions

### Naming Conventions
```typescript
// Files: snake_case, kebab-case, or PascalCase
// Variables: camelCase or snake_case
// Constants: UPPER_SNAKE_CASE
// Classes/Types: PascalCase
// Functions: camelCase or snake_case
```

### File Organization
```
feature/
├── index.ts        # Public API
├── types.ts        # Type definitions
├── implementation.ts # Core logic
├── tests.ts        # Unit tests
└── README.md            # Documentation
```

---

## Common Patterns

### Pattern Template
```typescript
/**
 * Pattern Name: Brief description
 * Use Case: When to use this pattern
 * Benefits: Why use this pattern
 */

// Implementation
class PatternExample {
    // Code here
}

// Usage Example
const example = new PatternExample();

// Anti-pattern (what NOT to do)
// Bad example with explanation
```

### Singleton Pattern (if applicable)
```typescript
class Singleton {
    private static instance: Singleton;
    
    private constructor() {}
    
    public static getInstance(): Singleton {
        if (!Singleton.instance) {
            Singleton.instance = new Singleton();
        }
        return Singleton.instance;
    }
}
```

### Factory Pattern (if applicable)
```typescript
interface Product {
    operation(): string;
}

class ConcreteFactory {
    public createProduct(type: string): Product {
        switch(type) {
            case 'A': return new ProductA();
            case 'B': return new ProductB();
            default: throw new Error('Unknown type');
        }
    }
}
```

### Builder Pattern (if applicable)
```typescript
class Builder {
    private product: Product = new Product();
    
    public addPartA(): this {
        // Add part A
        return this;
    }
    
    public addPartB(): this {
        // Add part B
        return this;
    }
    
    public build(): Product {
        return this.product;
    }
}

// Usage
const product = new Builder()
    .addPartA()
    .addPartB()
    .build();
```

---

## Error Handling

### Custom Error Types
```typescript
class CustomError extends Error {
    constructor(message: string, public code: string) {
        super(message);
        this.name = 'CustomError';
    }
}

// Usage
throw new CustomError('Something went wrong', 'ERR_001');
```

### Error Handling Pattern
```typescript
async function safeOperation<T>(
    operation: () => Promise<T>,
    fallback?: T
): Promise<T | undefined> {
    try {
        return await operation();
    } catch (error) {
        console.error('Operation failed:', error);
        return fallback;
    }
}
```

### Result Type Pattern
```typescript
type Result<T, E = Error> = 
    | { success: true; value: T }
    | { success: false; error: E };

function divide(a: number, b: number): Result<number> {
    if (b === 0) {
        return { success: false, error: new Error('Division by zero') };
    }
    return { success: true, value: a / b };
}
```

---

## Testing Patterns

### Unit Test Template
```typescript
describe('FeatureName', () => {
    // Setup
    beforeEach(() => {
        // Initialize test environment
    });
    
    // Teardown
    afterEach(() => {
        // Clean up
    });
    
    describe('methodName', () => {
        it('should do something when condition', () => {
            // Arrange
            const input = 'test';
            
            // Act
            const result = methodName(input);
            
            // Assert
            expect(result).toBe('expected');
        });
        
        it('should handle edge case', () => {
            // Test edge cases
        });
        
        it('should throw error when invalid', () => {
            // Test error conditions
        });
    });
});
```

### Integration Test Template
```typescript
describe('Integration: Feature', () => {
    let service: Service;
    
    beforeAll(async () => {
        // Setup integration environment
        service = await createService();
    });
    
    afterAll(async () => {
        // Cleanup
        await service.cleanup();
    });
    
    it('should integrate with external service', async () => {
        // Test actual integration
    });
});
```

### Mock Pattern
```typescript
// Mock implementation
class MockService implements IService {
    public methodCalls: any[] = [];
    
    async method(param: string): Promise<string> {
        this.methodCalls.push({ method: 'method', param });
        return 'mocked response';
    }
}

// Usage in tests
const mockService = new MockService();
const component = new Component(mockService);
```

---

## Performance Patterns

### Memoization
```typescript
function memoize<T extends (...args: any[]) => any>(fn: T): T {
    const cache = new Map();
    
    return ((...args: Parameters<T>) => {
        const key = JSON.stringify(args);
        
        if (cache.has(key)) {
            return cache.get(key);
        }
        
        const result = fn(...args);
        cache.set(key, result);
        return result;
    }) as T;
}
```

### Debouncing
```typescript
function debounce<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}
```

### Throttling
```typescript
function throttle<T extends (...args: any[]) => any>(
    fn: T,
    limit: number
): T {
    let inThrottle = false;
    
    return ((...args: Parameters<T>) => {
        if (!inThrottle) {
            fn(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }) as T;
}
```

---

## Security Patterns

### Input Validation
```typescript
function validateInput(input: unknown): string {
    if (typeof input !== 'string') {
        throw new Error('Input must be a string');
    }
    
    // Sanitize
    const sanitized = input.trim();
    
    // Validate length
    if (sanitized.length < 1 || sanitized.length > 255) {
        throw new Error('Input length must be between 1 and 255');
    }
    
    // Validate pattern (example)
    if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) {
        throw new Error('Input contains invalid characters');
    }
    
    return sanitized;
}
```

### Secure Random
```typescript
function generateSecureToken(length: number = 32): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        token += charset[randomIndex];
    }
    
    return token;
}
```

---

## Async Patterns

### Promise Chain Pattern
```typescript
function processSequentially<T>(
    items: T[],
    processor: (item: T) => Promise<void>
): Promise<void> {
    return items.reduce(
        (promise, item) => promise.then(() => processor(item)),
        Promise.resolve()
    );
}
```

### Parallel Processing
```typescript
async function processInParallel<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    batchSize: number = 5
): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = await Promise.all(
            batch.map(processor)
        );
        results.push(...batchResults);
    }
    
    return results;
}
```

### Retry Pattern
```typescript
async function retry<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    delay: number = 1000
): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;
            
            if (attempt < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, delay * attempt));
            }
        }
    }
    
    throw lastError!;
}
```

---

## Helper Functions

### Deep Clone
```typescript
function deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    
    if (obj instanceof Date) {
        return new Date(obj.getTime()) as any;
    }
    
    if (obj instanceof Array) {
        return obj.map(item => deepClone(item)) as any;
    }
    
    if (obj instanceof Object) {
        const cloned = {} as T;
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = deepClone(obj[key]);
            }
        }
        return cloned;
    }
    
    return obj;
}
```

### Deep Merge
```typescript
function deepMerge<T extends object>(target: T, ...sources: Partial<T>[]): T {
    if (!sources.length) return target;
    
    const source = sources.shift();
    if (!source) return target;
    
    for (const key in source) {
        const sourceValue = source[key];
        const targetValue = target[key];
        
        if (isObject(sourceValue) && isObject(targetValue)) {
            target[key] = deepMerge(targetValue, sourceValue);
        } else {
            target[key] = sourceValue as any;
        }
    }
    
    return deepMerge(target, ...sources);
}

function isObject(item: any): item is object {
    return item && typeof item === 'object' && !Array.isArray(item);
}
```

---

## Project-Specific Patterns

<!-- Add patterns specific to this project -->

---

*Last Updated: September 01, 2025*
*Add new patterns as they are discovered or created*
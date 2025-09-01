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
// Files: kebab-case for components, camelCase for utilities
// pack-list-component.tsx, usePackListStore.ts

// Variables and Functions: camelCase
const currentListId = 'list-123';
const handleCreateList = () => {};

// Constants: UPPER_SNAKE_CASE
const STORAGE_KEYS = {
  PACK_LIST: 'pack-list-storage',
  USER_PREFERENCES: 'user-preferences'
} as const;

// Types and Interfaces: PascalCase
interface PackListStore { }
type Priority = 'low' | 'medium' | 'high' | 'essential';

// Enums: PascalCase with UPPER_SNAKE_CASE values
enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  ESSENTIAL = 'essential'
}
```

### File Organization
```
pack-list/src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Homepage
│   └── lists/             # List pages
├── components/            # React components
│   ├── ui/               # Base UI components (Shadcn)
│   ├── lists/            # List-specific components
│   ├── templates/        # Template components
│   └── mobile/           # Mobile-specific components
├── store/                # State management
│   └── usePackListStore.ts
├── types/                # TypeScript definitions
│   └── index.ts
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
└── constants/            # Application constants

.taskmaster/
├── docs/                 # Documentation
├── tasks/                # Task database
├── config.json          # AI configuration
└── reports/              # Analysis reports
```

---

## Common Patterns

### Zustand Store Pattern
```typescript
/**
 * Pattern Name: Zustand Store with Immer and Persistence
 * Use Case: Global state management with immutable updates and local storage
 * Benefits: Type-safe, performant, automatic persistence, immutable updates
 */

// Implementation
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface StoreState {
  data: DataType[];
  currentId: string | null;

  // Actions
  createItem: (item: CreateInput) => string;
  updateItem: (id: string, updates: Partial<DataType>) => void;
  deleteItem: (id: string) => void;
}

export const useStore = create<StoreState>()(
  persist(
    immer((set, get) => ({
      data: [],
      currentId: null,

      createItem: (item) => {
        const id = generateId();
        set(state => {
          state.data.push({ ...item, id, createdAt: new Date() });
        });
        return id;
      },

      updateItem: (id, updates) => set(state => {
        const item = state.data.find(item => item.id === id);
        if (item) {
          Object.assign(item, updates, { updatedAt: new Date() });
        }
      }),

      deleteItem: (id) => set(state => {
        state.data = state.data.filter(item => item.id !== id);
      }),
    })),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Usage Example
const MyComponent = () => {
  const { data, createItem, updateItem } = useStore();

  const handleCreate = () => {
    const id = createItem({ name: 'New Item' });
    console.log('Created item:', id);
  };

  return <div>{/* Component JSX */}</div>;
};

// Anti-pattern (what NOT to do)
// ❌ Don't mutate state directly
// state.data.push(newItem); // This breaks immutability
// ✅ Use Immer's draft state instead
// set(state => { state.data.push(newItem); });
```

### React Component with Hooks Pattern
```typescript
/**
 * Pattern Name: Functional Component with Custom Hooks
 * Use Case: Reusable component logic with proper separation of concerns
 * Benefits: Testable, reusable, follows React best practices
 */

// Custom Hook
export const useListManagement = (listId: string) => {
  const { lists, updateList, addCategory, addItem } = usePackListStore();
  const [loading, setLoading] = useState(false);

  const list = useMemo(() =>
    lists.find(l => l.id === listId),
    [lists, listId]
  );

  const handleAddCategory = useCallback(async (name: string) => {
    setLoading(true);
    try {
      const categoryId = addCategory(listId, {
        name,
        color: generateColor(),
        order: list?.categories.length || 0,
        items: [],
      });
      return categoryId;
    } finally {
      setLoading(false);
    }
  }, [listId, addCategory, list?.categories.length]);

  return {
    list,
    loading,
    handleAddCategory,
  };
};

// Component Implementation
interface ListDetailProps {
  listId: string;
}

export const ListDetail: React.FC<ListDetailProps> = ({ listId }) => {
  const { list, loading, handleAddCategory } = useListManagement(listId);

  if (!list) {
    return <div>List not found</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{list.name}</h1>
      {list.categories.map(category => (
        <CategoryComponent key={category.id} category={category} />
      ))}
      <Button
        onClick={() => handleAddCategory('New Category')}
        disabled={loading}
      >
        Add Category
      </Button>
    </div>
  );
};

// Anti-pattern (what NOT to do)
// ❌ Don't put all logic in component
// ❌ Don't forget memoization for expensive calculations
// ❌ Don't use inline functions in JSX for event handlers
```

### Error Boundary Pattern
```typescript
/**
 * Pattern Name: React Error Boundary with Fallback UI
 * Use Case: Graceful error handling in React components
 * Benefits: Prevents app crashes, provides user-friendly error messages
 */

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to error reporting service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage Example
<ErrorBoundary>
  <PackListApp />
</ErrorBoundary>
```

### Performance Monitoring Hook Pattern
```typescript
/**
 * Pattern Name: Performance Monitoring Hook
 * Use Case: Track component render times and performance metrics
 * Benefits: Identify performance bottlenecks, optimize user experience
 */

interface PerformanceMetrics {
  renderTime: number;
  componentName: string;
  timestamp: Date;
}

export const usePerformanceMonitor = (componentName: string) => {
  const metricsRef = useRef<PerformanceMetrics[]>([]);

  const measureRender = useCallback(<T>(fn: () => T): T => {
    const start = performance.now();
    const result = fn();
    const end = performance.now();

    metricsRef.current.push({
      renderTime: end - start,
      componentName,
      timestamp: new Date(),
    });

    // Log slow renders
    if (end - start > 16) { // 60fps threshold
      console.warn(`Slow render in ${componentName}: ${end - start}ms`);
    }

    return result;
  }, [componentName]);

  const getMetrics = useCallback(() => metricsRef.current, []);

  return { measureRender, getMetrics };
};

// Usage Example
const ExpensiveComponent = () => {
  const { measureRender } = usePerformanceMonitor('ExpensiveComponent');

  const expensiveCalculation = useMemo(() =>
    measureRender(() => {
      // Expensive computation
      return heavyCalculation();
    }),
    [measureRender]
  );

  return <div>{expensiveCalculation}</div>;
};
```

### Command Pattern for CLI Operations
```typescript
/**
 * Pattern Name: Command Pattern for Task Master CLI
 * Use Case: Encapsulate CLI operations as objects for undo/redo, logging
 * Benefits: Extensible, testable, supports complex workflows
 */

interface Command {
  execute(): Promise<void>;
  undo?(): Promise<void>;
  description: string;
}

class CreateTaskCommand implements Command {
  description = 'Create new task';

  constructor(
    private taskData: CreateTaskInput,
    private taskService: TaskService
  ) {}

  async execute(): Promise<void> {
    const task = await this.taskService.createTask(this.taskData);
    console.log(`Created task: ${task.title} (${task.id})`);
  }

  async undo(): Promise<void> {
    // Implementation for undo
  }
}

class UpdateTaskStatusCommand implements Command {
  description: string;

  constructor(
    private taskId: string,
    private newStatus: TaskStatus,
    private taskService: TaskService
  ) {
    this.description = `Update task ${taskId} status to ${newStatus}`;
  }

  async execute(): Promise<void> {
    await this.taskService.updateTaskStatus(this.taskId, this.newStatus);
    console.log(`Updated task ${this.taskId} status to ${this.newStatus}`);
  }
}

// Command Invoker
class TaskMasterCLI {
  private history: Command[] = [];

  async executeCommand(command: Command): Promise<void> {
    try {
      await command.execute();
      this.history.push(command);
    } catch (error) {
      console.error(`Failed to execute: ${command.description}`, error);
      throw error;
    }
  }

  async undoLastCommand(): Promise<void> {
    const lastCommand = this.history.pop();
    if (lastCommand?.undo) {
      await lastCommand.undo();
    }
  }
}

// Usage Example
const cli = new TaskMasterCLI();
const createCommand = new CreateTaskCommand(
  { title: 'New Task', description: 'Task description' },
  taskService
);

await cli.executeCommand(createCommand);
```

### Template Method Pattern for AI Providers
```typescript
/**
 * Pattern Name: Template Method for AI Provider Integration
 * Use Case: Standardize AI provider interactions while allowing customization
 * Benefits: Consistent interface, easy to add new providers
 */

abstract class AIProvider {
  abstract providerName: string;
  abstract apiKey: string;

  // Template method
  async generateResponse(prompt: string, options: AIOptions): Promise<string> {
    this.validateInput(prompt, options);
    const formattedPrompt = this.formatPrompt(prompt, options);
    const response = await this.callAPI(formattedPrompt, options);
    return this.processResponse(response);
  }

  protected validateInput(prompt: string, options: AIOptions): void {
    if (!prompt.trim()) {
      throw new Error('Prompt cannot be empty');
    }
    if (!this.apiKey) {
      throw new Error(`API key required for ${this.providerName}`);
    }
  }

  protected abstract formatPrompt(prompt: string, options: AIOptions): string;
  protected abstract callAPI(prompt: string, options: AIOptions): Promise<any>;
  protected abstract processResponse(response: any): string;
}

class AnthropicProvider extends AIProvider {
  providerName = 'Anthropic';
  apiKey = process.env.ANTHROPIC_API_KEY!;

  protected formatPrompt(prompt: string, options: AIOptions): string {
    return `Human: ${prompt}\n\nAssistant:`;
  }

  protected async callAPI(prompt: string, options: AIOptions): Promise<any> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options.modelId || 'claude-3-sonnet-20240229',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options.maxTokens || 4000,
      }),
    });

    return response.json();
  }

  protected processResponse(response: any): string {
    return response.content[0].text;
  }
}

// Usage Example
const provider = new AnthropicProvider();
const response = await provider.generateResponse(
  'Analyze this task complexity',
  { modelId: 'claude-3-sonnet-20240229', maxTokens: 1000 }
);
```
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
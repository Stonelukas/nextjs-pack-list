# task-master-init - API Reference

**IMPORTANT**: This document must be updated with every new feature implementation to maintain accurate project knowledge.

## Update Checklist for New APIs
- [ ] Add new interfaces/contracts
- [ ] Document parameters and return types  
- [ ] Include usage examples
- [ ] Note breaking changes
- [ ] Update version information

---

## Table of Contents
1. [Public APIs](#public-apis)
2. [Internal APIs](#internal-apis)
3. [Data Structures](#data-structures)
4. [Configuration](#configuration)
5. [Constants & Enums](#constants--enums)
6. [Error Codes](#error-codes)

---

## Public APIs

### Task Master AI System

#### Core Task Management API
```typescript
/**
 * Main Task Master store interface for managing tasks, projects, and workflows
 */
interface TaskMasterAPI {
  // Task Operations
  createTask(task: CreateTaskInput): Promise<Task>;
  updateTask(id: string, updates: Partial<Task>): Promise<Task>;
  deleteTask(id: string): Promise<void>;
  getTask(id: string): Promise<Task>;
  listTasks(filter?: TaskFilter): Promise<Task[]>;

  // Status Management
  setTaskStatus(id: string, status: TaskStatus): Promise<Task>;
  getTasksByStatus(status: TaskStatus): Promise<Task[]>;

  // Dependency Management
  addDependency(taskId: string, dependsOnId: string): Promise<void>;
  removeDependency(taskId: string, dependsOnId: string): Promise<void>;
  validateDependencies(): Promise<ValidationResult>;

  // Analysis & Intelligence
  analyzeComplexity(taskId?: string): Promise<ComplexityReport>;
  expandTask(id: string, options?: ExpansionOptions): Promise<Task[]>;
  getNextTask(criteria?: NextTaskCriteria): Promise<Task | null>;
}
```

#### Task Data Types
```typescript
interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  complexity: number;
  dependencies: string[];
  subtasks?: Task[];
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

type TaskStatus = 'pending' | 'in-progress' | 'done' | 'review' | 'deferred' | 'cancelled';
type TaskPriority = 'low' | 'medium' | 'high';

interface CreateTaskInput {
  title: string;
  description: string;
  priority?: TaskPriority;
  dependencies?: string[];
  tags?: string[];
}
```

### Pack List Application APIs

#### Pack List Store API
```typescript
/**
 * Zustand store for Pack List application state management
 */
interface PackListStore {
  // State
  user: User | null;
  lists: List[];
  currentListId: string | null;
  templates: Template[];

  // User Management
  setUser(user: User): void;
  updateUserPreferences(preferences: Partial<UserPreferences>): void;

  // List Operations
  createList(list: Omit<List, 'id' | 'createdAt' | 'updatedAt'>): string;
  updateList(id: string, updates: Partial<List>): void;
  deleteList(id: string): void;
  duplicateList(id: string): string;
  setCurrentList(id: string | null): void;

  // Category Operations
  addCategory(listId: string, category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): string;
  updateCategory(listId: string, categoryId: string, updates: Partial<Category>): void;
  deleteCategory(listId: string, categoryId: string): void;
  reorderCategories(listId: string, categoryIds: string[]): void;

  // Item Operations
  addItem(listId: string, categoryId: string, item: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>): string;
  updateItem(listId: string, categoryId: string, itemId: string, updates: Partial<Item>): void;
  deleteItem(listId: string, categoryId: string, itemId: string): void;
  toggleItemPacked(listId: string, categoryId: string, itemId: string): void;
  moveItem(listId: string, itemId: string, fromCategoryId: string, toCategoryId: string): void;

  // Template Operations
  saveAsTemplate(listId: string, name: string, description: string, isPublic?: boolean): string;
  applyTemplate(templateId: string, listName: string): string;
  deleteTemplate(templateId: string): void;
  updateTemplate(templateId: string, updates: Partial<Template>): void;

  // Utility Operations
  getListProgress(listId: string): ListProgress;
  clearAllData(): void;
  importData(data: ImportData): void;
  exportData(): ExportData;
}
```

---

## Internal APIs

### Pack List Core Types
```typescript
/**
 * Core data models for Pack List application
 */
interface User {
  id: string;
  name: string;
  email?: string;
  preferences?: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  defaultPriority: Priority;
  autoSave: boolean;
}

interface List {
  id: string;
  name: string;
  description?: string;
  categories: Category[];
  tags?: string[];
  isTemplate: boolean;
  templateId?: string;
  userId: string;
  sharedWith?: string[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

interface Category {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  order: number;
  items: Item[];
  collapsed?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Item {
  id: string;
  name: string;
  quantity: number;
  packed: boolean;
  priority: Priority;
  notes?: string;
  categoryId: string;
  description?: string;
  weight?: number;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  ESSENTIAL = 'essential'
}
```

### Template System
```typescript
interface Template {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  difficulty: TemplateDifficulty;
  season: TemplateSeason;
  duration: string;
  categories: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>[];
  tags: string[];
  isPublic: boolean;
  createdBy: string;
  usageCount: number;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

enum TemplateCategory {
  TRAVEL = 'travel',
  OUTDOOR = 'outdoor',
  EVENTS = 'events',
  SEASONAL = 'seasonal',
  BUSINESS = 'business',
  SPORTS = 'sports',
  EMERGENCY = 'emergency'
}

type TemplateDifficulty = 'beginner' | 'intermediate' | 'advanced';
type TemplateSeason = 'spring' | 'summer' | 'fall' | 'winter' | 'all';
```

### Utility Types
```typescript
interface ListProgress {
  totalItems: number;
  packedItems: number;
  completionPercentage: number;
  itemsByPriority: Record<Priority, { total: number; packed: number }>;
  itemsByCategory: Record<string, { total: number; packed: number; name: string }>;
}

interface ImportData {
  lists?: List[];
  templates?: Template[];
  user?: User;
}

interface ExportData {
  lists: List[];
  templates: Template[];
  user: User | null;
}

// Utility types for type safety
type BaseEntity = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};

type CreateEntityInput<T extends BaseEntity> = Omit<T, keyof BaseEntity>;
type UpdateEntityInput<T extends BaseEntity> = Partial<Omit<T, keyof BaseEntity>>;
```

---

## Data Structures

### Task Master Data Models
```typescript
/**
 * Task Master configuration and data structures
 */
interface TaskMasterConfig {
  models: {
    main: ModelConfig;
    research: ModelConfig;
    fallback: ModelConfig;
  };
  global: GlobalConfig;
}

interface ModelConfig {
  provider: 'anthropic' | 'openai' | 'perplexity' | 'google' | 'mistral' | 'openrouter' | 'xai';
  modelId: string;
  maxTokens: number;
  temperature: number;
}

interface GlobalConfig {
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  debug: boolean;
  defaultNumTasks: number;
  defaultSubtasks: number;
  defaultPriority: 'low' | 'medium' | 'high';
  projectName: string;
  responseLanguage: string;
  userId: string;
  ollamaBaseURL?: string;
  bedrockBaseURL?: string;
  azureOpenaiBaseURL?: string;
}

interface ComplexityReport {
  taskId: string;
  complexity: number;
  recommendations: string[];
  suggestedSubtasks: CreateTaskInput[];
  estimatedHours: number;
  riskFactors: string[];
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  taskId: string;
  type: 'circular_dependency' | 'missing_dependency' | 'invalid_status';
  message: string;
}
```

### Pack List Component Props
```typescript
/**
 * Component prop interfaces for Pack List application
 */
interface ListDetailProps {
  listId: string;
}

interface CategoryProps {
  category: Category;
  listId: string;
  onUpdate: (updates: Partial<Category>) => void;
  onDelete: () => void;
  onAddItem: (item: CreateEntityInput<Item>) => void;
}

interface ItemProps {
  item: Item;
  onUpdate: (updates: Partial<Item>) => void;
  onDelete: () => void;
  onTogglePacked: () => void;
}

interface TemplateCardProps {
  template: Template;
  onApply: (templateId: string, listName: string) => void;
  onDelete?: (templateId: string) => void;
  showActions?: boolean;
}

interface ProgressProps {
  progress: ListProgress;
  showDetails?: boolean;
  className?: string;
}
```

### Hook Return Types
```typescript
/**
 * Custom hook return types
 */
interface UseKeyboardShortcutsReturn {
  shortcuts: ShortcutConfig[];
  registerShortcut: (config: ShortcutConfig) => void;
  unregisterShortcut: (key: string) => void;
}

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  description: string;
}

interface UsePerformanceMonitorReturn {
  measureRender: <T>(fn: () => T) => T;
  measureAsync: <T>(fn: () => Promise<T>) => Promise<T>;
  getMetrics: () => PerformanceMetrics;
  clearMetrics: () => void;
}

interface PerformanceMetrics {
  renderTime: number;
  asyncOperationTime: number;
  memoryUsage: number;
  componentName: string;
  timestamp: Date;
}
```

---

## Configuration

### Task Master Configuration
```typescript
/**
 * Task Master AI system configuration
 * Located at: .taskmaster/config.json
 */
interface TaskMasterConfig {
  models: {
    main: {
      provider: 'anthropic';
      modelId: 'claude-3-7-sonnet-20250219';
      maxTokens: 120000;
      temperature: 0.2;
    };
    research: {
      provider: 'perplexity';
      modelId: 'sonar-pro';
      maxTokens: 8700;
      temperature: 0.1;
    };
    fallback: {
      provider: 'anthropic';
      modelId: 'claude-3-7-sonnet-20250219';
      maxTokens: 120000;
      temperature: 0.2;
    };
  };
  global: {
    logLevel: 'info';
    debug: false;
    defaultNumTasks: 10;
    defaultSubtasks: 5;
    defaultPriority: 'medium';
    projectName: 'Taskmaster';
    responseLanguage: 'English';
    userId: string;
  };
}
```

### Pack List Configuration
```typescript
/**
 * Next.js configuration for Pack List application
 * Located at: pack-list/next.config.ts
 */
interface NextConfig {
  reactStrictMode: boolean;
  images: {
    domains: string[];
  };
  eslint: {
    ignoreDuringBuilds: boolean;
  };
  typescript: {
    ignoreBuildErrors: boolean;
  };
}

/**
 * Shadcn/ui configuration
 * Located at: pack-list/components.json
 */
interface ComponentsConfig {
  $schema: string;
  style: 'new-york';
  rsc: boolean;
  tsx: boolean;
  tailwind: {
    config: string;
    css: string;
    baseColor: 'neutral';
    cssVariables: boolean;
    prefix: string;
  };
  iconLibrary: 'lucide';
  aliases: {
    components: '@/components';
    utils: '@/lib/utils';
    ui: '@/components/ui';
    lib: '@/lib';
    hooks: '@/hooks';
  };
}
```

### Environment Variables
```bash
# Task Master AI API Keys
ANTHROPIC_API_KEY=your_anthropic_key_here
PERPLEXITY_API_KEY=your_perplexity_key_here
OPENAI_API_KEY=your_openai_key_here
GOOGLE_API_KEY=your_google_key_here
MISTRAL_API_KEY=your_mistral_key_here
OPENROUTER_API_KEY=your_openrouter_key_here
XAI_API_KEY=your_xai_key_here

# Pack List Application (Optional)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_GA_ID=your_google_analytics_id
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn

# Development
NODE_ENV=development|production
ANALYZE=true  # For bundle analysis
```

### Storage Configuration
```typescript
/**
 * Local storage keys and configuration
 */
export const STORAGE_KEYS = {
  PACK_LIST: 'pack-list-storage',
  USER_PREFERENCES: 'user-preferences',
  THEME: 'theme-preference',
} as const;

export const DEFAULTS = {
  ITEM_QUANTITY: 1,
  PRIORITY: 'medium',
  THEME: 'system',
  AUTO_SAVE: true,
} as const;
```

---

## Constants & Enums

### Pack List Application Constants
```typescript
/**
 * Application constants for Pack List
 * Located at: pack-list/src/constants/index.ts
 */
export const STORAGE_KEYS = {
  PACK_LIST: 'pack-list-storage',
  USER_PREFERENCES: 'user-preferences',
  THEME: 'theme-preference',
} as const;

export const DEFAULTS = {
  ITEM_QUANTITY: 1,
  PRIORITY: 'medium',
  THEME: 'system',
  AUTO_SAVE: true,
} as const;

export const APP_METADATA = {
  NAME: 'Pack List',
  DESCRIPTION: 'Smart Packing List Tracker',
  VERSION: '0.1.0',
  AUTHOR: 'Task Master AI',
} as const;
```

### Priority and Status Enums
```typescript
/**
 * Priority levels for packing items
 */
export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  ESSENTIAL = 'essential'
}

/**
 * Task status enumeration for Task Master
 */
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in-progress',
  DONE = 'done',
  REVIEW = 'review',
  DEFERRED = 'deferred',
  CANCELLED = 'cancelled'
}

/**
 * Template categories for organizing packing templates
 */
export enum TemplateCategory {
  TRAVEL = 'travel',
  OUTDOOR = 'outdoor',
  EVENTS = 'events',
  SEASONAL = 'seasonal',
  BUSINESS = 'business',
  SPORTS = 'sports',
  EMERGENCY = 'emergency'
}
```

### Keyboard Shortcuts
```typescript
/**
 * Global keyboard shortcuts configuration
 * Located at: pack-list/src/hooks/use-keyboard-shortcuts.tsx
 */
export const GLOBAL_SHORTCUTS = [
  {
    key: 'n',
    ctrl: true,
    action: 'create-new-list',
    description: 'Create new list',
  },
  {
    key: 'k',
    ctrl: true,
    action: 'focus-search',
    description: 'Focus search',
  },
  {
    key: '/',
    action: 'focus-search-alt',
    description: 'Focus search (alternative)',
  },
] as const;

export const LIST_SHORTCUTS = [
  {
    key: 'a',
    action: 'add-item',
    description: 'Add new item',
  },
  {
    key: 'c',
    action: 'add-category',
    description: 'Add new category',
  },
  {
    key: 'e',
    ctrl: true,
    action: 'export-list',
    description: 'Export list',
  },
  {
    key: 'p',
    ctrl: true,
    action: 'print-list',
    description: 'Print list',
  },
] as const;
```

### Performance Constants
```typescript
/**
 * Performance monitoring constants
 */
export const PERFORMANCE_THRESHOLDS = {
  RENDER_TIME_WARNING: 16, // 16ms for 60fps
  RENDER_TIME_ERROR: 33, // 33ms for 30fps
  MEMORY_WARNING: 50 * 1024 * 1024, // 50MB
  MEMORY_ERROR: 100 * 1024 * 1024, // 100MB
} as const;

export const CACHE_SETTINGS = {
  DEFAULT_TTL: 3600, // 1 hour in seconds
  MAX_CACHE_SIZE: 100, // Maximum number of cached items
  CLEANUP_INTERVAL: 300, // 5 minutes in seconds
} as const;
```

---

## Error Codes

### Error Code Reference
| Code | Name | Description | HTTP Status |
|------|------|-------------|-------------|
| E001 | INVALID_INPUT | Invalid input parameters | 400 |
| E002 | NOT_FOUND | Resource not found | 404 |
| E003 | UNAUTHORIZED | Authentication required | 401 |
| E004 | FORBIDDEN | Access denied | 403 |
| E005 | CONFLICT | Resource conflict | 409 |
| E500 | SERVER_ERROR | Internal server error | 500 |

### Error Response Format
```json
{
    "error": {
        "code": "E001",
        "message": "Human-readable error message",
        "details": {
            "field": "Additional context"
        },
        "timestamp": "2024-01-01T00:00:00Z"
    }
}
```

---

## Versioning

### API Version History
| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | September 01, 2025 | Initial release |

### Breaking Changes
<!-- Document any breaking changes between versions -->

### Deprecation Notices
<!-- List deprecated APIs and their replacements -->

---

## Usage Examples

### Task Master AI System Usage
```typescript
// Initialize Task Master in a project
import { exec } from 'child_process';

// Basic task management
const initProject = async () => {
  // Initialize Task Master
  await exec('task-master init');

  // Parse PRD to generate tasks
  await exec('task-master parse-prd .taskmaster/docs/prd.txt');

  // Analyze complexity
  await exec('task-master analyze-complexity --research');

  // Get next task
  await exec('task-master next');
};

// Using MCP integration with Claude Code
const mcpConfig = {
  "mcpServers": {
    "task-master-ai": {
      "command": "npx",
      "args": ["-y", "--package=task-master-ai", "task-master-ai"],
      "env": {
        "ANTHROPIC_API_KEY": process.env.ANTHROPIC_API_KEY,
        "PERPLEXITY_API_KEY": process.env.PERPLEXITY_API_KEY
      }
    }
  }
};
```

### Pack List Store Usage
```typescript
// Using the Pack List Zustand store
import { usePackListStore } from '@/store/usePackListStore';

const PackListComponent = () => {
  const {
    lists,
    currentListId,
    createList,
    addCategory,
    addItem,
    toggleItemPacked,
    getListProgress
  } = usePackListStore();

  // Create a new packing list
  const handleCreateList = () => {
    const listId = createList({
      name: 'Weekend Trip',
      description: 'Packing for a weekend getaway',
      categories: [],
      tags: ['travel', 'weekend'],
      isTemplate: false,
      userId: 'user-123',
    });

    // Add a category
    const categoryId = addCategory(listId, {
      name: 'Clothing',
      color: '#3B82F6',
      icon: 'shirt',
      order: 0,
      items: [],
    });

    // Add items to the category
    addItem(listId, categoryId, {
      name: 'T-shirts',
      quantity: 3,
      packed: false,
      priority: Priority.MEDIUM,
      categoryId,
    });
  };

  // Toggle item packed status
  const handleToggleItem = (listId: string, categoryId: string, itemId: string) => {
    toggleItemPacked(listId, categoryId, itemId);
  };

  // Get progress for a list
  const progress = currentListId ? getListProgress(currentListId) : null;

  return (
    <div>
      {progress && (
        <div>Progress: {progress.completionPercentage}%</div>
      )}
      {/* Render lists and items */}
    </div>
  );
};
```

### Custom Hooks Usage
```typescript
// Using keyboard shortcuts hook
import { useKeyboardShortcuts, globalShortcuts } from '@/hooks/use-keyboard-shortcuts';

const App = () => {
  // Register global shortcuts
  useKeyboardShortcuts(globalShortcuts);

  // Register custom shortcuts
  const customShortcuts = [
    {
      key: 's',
      ctrl: true,
      action: () => {
        // Save current list
        console.log('Saving list...');
      },
      description: 'Save list',
    },
  ];

  useKeyboardShortcuts(customShortcuts);

  return <div>App content</div>;
};

// Using performance monitoring hook
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

const ExpensiveComponent = () => {
  const { measureRender, measureAsync, getMetrics } = usePerformanceMonitor({
    componentName: 'ExpensiveComponent',
    enableLogging: true,
  });

  const expensiveCalculation = () => {
    return measureRender(() => {
      // Expensive synchronous operation
      return heavyComputation();
    });
  };

  const expensiveAsyncOperation = async () => {
    return measureAsync(async () => {
      // Expensive asynchronous operation
      return await fetchLargeDataset();
    });
  };

  useEffect(() => {
    const metrics = getMetrics();
    console.log('Performance metrics:', metrics);
  }, []);

  return <div>{/* Component content */}</div>;
};
```

### Template System Usage
```typescript
// Working with templates
import { usePackListStore } from '@/store/usePackListStore';

const TemplateManager = () => {
  const {
    templates,
    saveAsTemplate,
    applyTemplate,
    deleteTemplate,
    getAllTemplates
  } = usePackListStore();

  // Save a list as a template
  const handleSaveAsTemplate = (listId: string) => {
    const templateId = saveAsTemplate(
      listId,
      'Business Trip Template',
      'Complete packing list for business travel',
      true // Make it public
    );
    console.log('Template saved:', templateId);
  };

  // Apply a template to create a new list
  const handleApplyTemplate = (templateId: string) => {
    const newListId = applyTemplate(templateId, 'My Business Trip');
    console.log('New list created from template:', newListId);
  };

  // Get all available templates
  const allTemplates = getAllTemplates();

  return (
    <div>
      {allTemplates.map(template => (
        <div key={template.id}>
          <h3>{template.name}</h3>
          <p>{template.description}</p>
          <button onClick={() => handleApplyTemplate(template.id)}>
            Use Template
          </button>
          <button onClick={() => deleteTemplate(template.id)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
};
```

---

## Testing

### Pack List Test Utilities
```typescript
// Mock factories for Pack List testing
export const createMockList = (overrides: Partial<List> = {}): List => ({
  id: 'test-list-id',
  name: 'Test List',
  description: 'A test packing list',
  categories: [],
  tags: ['test'],
  isTemplate: false,
  userId: 'test-user',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockCategory = (overrides: Partial<Category> = {}): Category => ({
  id: 'test-category-id',
  name: 'Test Category',
  color: '#3B82F6',
  icon: 'package',
  order: 0,
  items: [],
  collapsed: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockItem = (overrides: Partial<Item> = {}): Item => ({
  id: 'test-item-id',
  name: 'Test Item',
  quantity: 1,
  packed: false,
  priority: Priority.MEDIUM,
  categoryId: 'test-category-id',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Store testing utilities
export const createMockStore = () => ({
  lists: [createMockList()],
  currentListId: 'test-list-id',
  templates: [],
  user: null,
  createList: jest.fn(),
  updateList: jest.fn(),
  deleteList: jest.fn(),
  addCategory: jest.fn(),
  addItem: jest.fn(),
  toggleItemPacked: jest.fn(),
});
```

### Task Master Test Helpers
```typescript
// Task Master testing utilities
export const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'test-task-id',
  title: 'Test Task',
  description: 'A test task description',
  status: 'pending',
  priority: 'medium',
  complexity: 5,
  dependencies: [],
  tags: ['test'],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockConfig = (overrides: Partial<TaskMasterConfig> = {}): TaskMasterConfig => ({
  models: {
    main: {
      provider: 'anthropic',
      modelId: 'claude-3-7-sonnet-20250219',
      maxTokens: 120000,
      temperature: 0.2,
    },
    research: {
      provider: 'perplexity',
      modelId: 'sonar-pro',
      maxTokens: 8700,
      temperature: 0.1,
    },
    fallback: {
      provider: 'anthropic',
      modelId: 'claude-3-7-sonnet-20250219',
      maxTokens: 120000,
      temperature: 0.2,
    },
  },
  global: {
    logLevel: 'info',
    debug: false,
    defaultNumTasks: 10,
    defaultSubtasks: 5,
    defaultPriority: 'medium',
    projectName: 'Test Project',
    responseLanguage: 'English',
    userId: 'test-user',
  },
  ...overrides,
});
```

---

## Performance Considerations

### Pack List Performance
- **Local Storage**: All data persisted locally using Zustand persistence
- **Render Optimization**: Components use React.memo and useMemo for expensive calculations
- **Lazy Loading**: Large components loaded on demand using React.lazy
- **Virtual Scrolling**: Implemented for large lists (>100 items)
- **Debounced Search**: Search input debounced to 300ms to prevent excessive filtering

### Task Master Performance
- **Model Limits**:
  - Claude Sonnet: 120,000 tokens max
  - Perplexity Sonar: 8,700 tokens max
- **Rate Limits**: Respect provider-specific rate limits
- **Caching**: Task analysis results cached locally
- **Batch Operations**: Multiple task updates batched together

### Memory Management
```typescript
// Performance monitoring thresholds
const PERFORMANCE_THRESHOLDS = {
  RENDER_TIME_WARNING: 16, // 16ms for 60fps
  RENDER_TIME_ERROR: 33, // 33ms for 30fps
  MEMORY_WARNING: 50 * 1024 * 1024, // 50MB
  MEMORY_ERROR: 100 * 1024 * 1024, // 100MB
} as const;
```

---

## Security

### API Key Management
```typescript
// Task Master AI API keys (stored in environment variables)
const API_KEYS = {
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  // ... other provider keys
};

// Validation
const validateApiKeys = () => {
  const requiredKeys = ['ANTHROPIC_API_KEY']; // At least one required
  const availableKeys = Object.entries(API_KEYS)
    .filter(([_, value]) => value)
    .map(([key, _]) => key);

  if (availableKeys.length === 0) {
    throw new Error('At least one AI provider API key must be configured');
  }
};
```

### Data Privacy
```typescript
// Pack List data privacy considerations
interface PrivacySettings {
  localStorageOnly: boolean; // All data stored locally
  noCloudSync: boolean; // No cloud synchronization
  anonymousUsage: boolean; // No user identification required
  exportControl: boolean; // User controls data export
}

// Data sanitization for exports
const sanitizeExportData = (data: ExportData): ExportData => {
  return {
    ...data,
    user: data.user ? {
      ...data.user,
      email: undefined, // Remove sensitive data
      id: 'anonymous',
    } : null,
  };
};
```

### Input Validation
```typescript
// Validation schemas using Zod
import { z } from 'zod';

const TaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000),
  priority: z.enum(['low', 'medium', 'high']),
  status: z.enum(['pending', 'in-progress', 'done', 'review', 'deferred', 'cancelled']),
});

const ListSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  tags: z.array(z.string()).max(10).optional(),
});

const ItemSchema = z.object({
  name: z.string().min(1).max(100),
  quantity: z.number().min(1).max(999),
  priority: z.enum(['low', 'medium', 'high', 'essential']),
});
```

---

## File Locations Reference

### Task Master System Files
- **Configuration**: `.taskmaster/config.json`
- **Tasks Database**: `.taskmaster/tasks/tasks.json`
- **Individual Tasks**: `.taskmaster/tasks/task-*.md`
- **Documentation**: `.taskmaster/docs/`
- **Reports**: `.taskmaster/reports/`
- **Templates**: `.taskmaster/templates/`

### Pack List Application Files
- **Main Store**: `pack-list/src/store/usePackListStore.ts`
- **Types**: `pack-list/src/types/index.ts`
- **Constants**: `pack-list/src/constants/index.ts`
- **Components**: `pack-list/src/components/`
- **Hooks**: `pack-list/src/hooks/`
- **Configuration**: `pack-list/next.config.ts`, `pack-list/components.json`

### Claude Code Integration Files
- **Commands**: `.claude/commands/tm/`
- **Settings**: `.claude/settings.json`
- **MCP Config**: `.mcp.json`
- **Context**: `CLAUDE.md`

---

*Last Updated: September 01, 2025*
*This document contains comprehensive API documentation for task-master-init project*
*Must be updated with every new API addition or change*
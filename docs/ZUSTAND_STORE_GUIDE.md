# Pack List Zustand Store - Developer Guide

**Target**: `pack-list/src/store/usePackListStore.ts`  
**Type**: Guide Documentation  
**Style**: Detailed  
**Generated**: September 01, 2025

## Overview

This guide provides comprehensive instructions for working with the Pack List Zustand store, covering everything from basic usage to advanced patterns and best practices. The store manages all application state including lists, categories, items, templates, and user preferences.

## Prerequisites

- Basic understanding of React hooks
- Familiarity with TypeScript
- Knowledge of Zustand concepts (optional but helpful)

## Quick Start

### 1. Basic Store Usage

```typescript
import { usePackListStore } from '@/store/usePackListStore';

const MyComponent = () => {
  // Access state and actions
  const { lists, createList, updateList } = usePackListStore();
  
  // Use in component
  return (
    <div>
      <h2>My Lists ({lists.length})</h2>
      {lists.map(list => (
        <div key={list.id}>{list.name}</div>
      ))}
    </div>
  );
};
```

### 2. Creating Your First List

```typescript
const CreateListExample = () => {
  const { createList, setCurrentList } = usePackListStore();
  
  const handleCreateList = () => {
    const listId = createList({
      name: 'Weekend Trip',
      description: 'Packing for a weekend getaway',
      categories: [],
      tags: ['travel', 'weekend'],
      isTemplate: false,
      userId: 'user-123',
    });
    
    // Set as current list
    setCurrentList(listId);
    
    console.log('Created list:', listId);
  };
  
  return (
    <button onClick={handleCreateList}>
      Create New List
    </button>
  );
};
```

## Core Concepts

### State Structure

The store manages several key entities:

```typescript
interface StoreState {
  // Core Data
  user: User | null;
  lists: List[];
  currentListId: string | null;
  templates: Template[];
  
  // UI State
  isLoading: boolean;
  error: string | null;
}
```

### Entity Relationships

```
User
├── Lists (1:many)
│   ├── Categories (1:many)
│   │   └── Items (1:many)
│   └── Tags (many:many)
└── Templates (1:many)
    └── Category Templates (1:many)
```

## Step-by-Step Workflows

### Workflow 1: Complete List Management

#### Step 1: Create a List
```typescript
const { createList } = usePackListStore();

const listId = createList({
  name: 'Business Trip',
  description: 'Packing for 3-day business trip',
  categories: [],
  tags: ['business', 'travel'],
  isTemplate: false,
  userId: 'current-user-id',
});
```

#### Step 2: Add Categories
```typescript
const { addCategory } = usePackListStore();

const clothingCategoryId = addCategory(listId, {
  name: 'Clothing',
  color: '#3B82F6',
  icon: 'shirt',
  order: 0,
  items: [],
  collapsed: false,
});

const electronicsCategoryId = addCategory(listId, {
  name: 'Electronics',
  color: '#10B981',
  icon: 'smartphone',
  order: 1,
  items: [],
  collapsed: false,
});
```

#### Step 3: Add Items to Categories
```typescript
const { addItem } = usePackListStore();

// Add clothing items
addItem(listId, clothingCategoryId, {
  name: 'Business Shirts',
  quantity: 3,
  packed: false,
  priority: Priority.HIGH,
  notes: 'Wrinkle-free preferred',
  categoryId: clothingCategoryId,
});

addItem(listId, clothingCategoryId, {
  name: 'Dress Pants',
  quantity: 2,
  packed: false,
  priority: Priority.HIGH,
  categoryId: clothingCategoryId,
});

// Add electronics
addItem(listId, electronicsCategoryId, {
  name: 'Laptop Charger',
  quantity: 1,
  packed: false,
  priority: Priority.ESSENTIAL,
  categoryId: electronicsCategoryId,
});
```

#### Step 4: Manage Item Status
```typescript
const { toggleItemPacked, updateItem } = usePackListStore();

// Mark items as packed
toggleItemPacked(listId, clothingCategoryId, shirtItemId);
toggleItemPacked(listId, electronicsCategoryId, chargerItemId);

// Update item details
updateItem(listId, clothingCategoryId, shirtItemId, {
  notes: 'Packed in garment bag',
  packed: true,
});
```

### Workflow 2: Template Management

#### Step 1: Save List as Template
```typescript
const { saveAsTemplate } = usePackListStore();

const templateId = saveAsTemplate(
  listId,
  'Business Trip Template',
  'Complete packing list for 3-day business trips',
  true // Make it public
);
```

#### Step 2: Apply Template to New List
```typescript
const { applyTemplate } = usePackListStore();

const newListId = applyTemplate(
  templateId,
  'Chicago Business Trip'
);
```

#### Step 3: Customize Applied Template
```typescript
const { updateList, addItem } = usePackListStore();

// Update list details
updateList(newListId, {
  description: 'Business trip to Chicago, October 2025',
  tags: ['business', 'chicago', 'october'],
});

// Add location-specific items
const miscCategoryId = addCategory(newListId, {
  name: 'Chicago Specific',
  color: '#F59E0B',
  icon: 'map-pin',
  order: 10,
  items: [],
});

addItem(newListId, miscCategoryId, {
  name: 'Winter Coat',
  quantity: 1,
  packed: false,
  priority: Priority.HIGH,
  notes: 'Chicago weather can be cold',
  categoryId: miscCategoryId,
});
```

## Advanced Patterns

### Pattern 1: Optimized Component Updates

```typescript
// Instead of subscribing to entire store
const MyComponent = () => {
  // ❌ This causes re-renders on any store change
  const store = usePackListStore();
  
  // ✅ Subscribe only to needed data
  const lists = usePackListStore(state => state.lists);
  const createList = usePackListStore(state => state.createList);
  
  return <div>{/* Component content */}</div>;
};
```

### Pattern 2: Computed Values with Selectors

```typescript
// Create reusable selectors
const selectListById = (listId: string) => (state: PackListStore) =>
  state.lists.find(list => list.id === listId);

const selectListProgress = (listId: string) => (state: PackListStore) => {
  const list = state.lists.find(l => l.id === listId);
  if (!list) return null;
  
  const totalItems = list.categories.flatMap(cat => cat.items).length;
  const packedItems = list.categories
    .flatMap(cat => cat.items)
    .filter(item => item.packed).length;
    
  return {
    totalItems,
    packedItems,
    percentage: totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0,
  };
};

// Use in components
const ListProgress = ({ listId }: { listId: string }) => {
  const progress = usePackListStore(selectListProgress(listId));
  
  if (!progress) return null;
  
  return (
    <div>
      Progress: {progress.percentage}% ({progress.packedItems}/{progress.totalItems})
    </div>
  );
};
```

### Pattern 3: Batch Operations

```typescript
const { updateList, addCategory, addItem } = usePackListStore();

// Batch multiple operations for better performance
const setupCompleteList = (listData: ListSetupData) => {
  // Create list
  const listId = createList(listData.list);
  
  // Add all categories and items in sequence
  listData.categories.forEach((categoryData, index) => {
    const categoryId = addCategory(listId, {
      ...categoryData.category,
      order: index,
    });
    
    categoryData.items.forEach(itemData => {
      addItem(listId, categoryId, {
        ...itemData,
        categoryId,
      });
    });
  });
  
  return listId;
};
```

## Performance Optimization

### 1. Use Selective Subscriptions
```typescript
// ✅ Good - only re-renders when lists change
const lists = usePackListStore(state => state.lists);

// ❌ Bad - re-renders on any state change
const { lists } = usePackListStore();
```

### 2. Memoize Expensive Selectors
```typescript
const selectExpensiveComputation = useMemo(
  () => (state: PackListStore) => {
    return state.lists.map(list => ({
      ...list,
      totalWeight: calculateTotalWeight(list),
      estimatedVolume: calculateVolume(list),
    }));
  },
  []
);

const enrichedLists = usePackListStore(selectExpensiveComputation);
```

### 3. Use the Optimized Store Hook
```typescript
import { useOptimizedList } from '@/hooks/use-optimized-store';

const ListDetail = ({ listId }: { listId: string }) => {
  const { list, categories, items, stats } = useOptimizedList(listId);
  
  return (
    <div>
      <h1>{list?.name}</h1>
      <p>Progress: {stats?.completionPercentage}%</p>
      {categories.map(category => (
        <CategoryComponent key={category.id} category={category} />
      ))}
    </div>
  );
};
```

## Error Handling

### Handling Missing Data
```typescript
const SafeListComponent = ({ listId }: { listId: string }) => {
  const list = usePackListStore(state => 
    state.lists.find(l => l.id === listId)
  );
  
  if (!list) {
    return <div>List not found</div>;
  }
  
  return <div>{list.name}</div>;
};
```

### Handling Store Errors
```typescript
const { error, clearError } = usePackListStore();

if (error) {
  return (
    <div className="error-banner">
      <p>Error: {error}</p>
      <button onClick={clearError}>Dismiss</button>
    </div>
  );
}
```

## Testing Patterns

### Mock Store for Testing
```typescript
import { create } from 'zustand';

const createMockStore = (initialState = {}) => create(() => ({
  lists: [],
  currentListId: null,
  templates: [],
  user: null,
  createList: jest.fn(),
  updateList: jest.fn(),
  deleteList: jest.fn(),
  ...initialState,
}));

// Use in tests
const mockStore = createMockStore({
  lists: [mockList],
  currentListId: 'test-list-id',
});
```

## Troubleshooting

### Common Issues

1. **State not updating**: Ensure you're using the store actions, not mutating state directly
2. **Performance issues**: Use selective subscriptions and memoized selectors
3. **Persistence not working**: Check localStorage availability and quota
4. **Type errors**: Ensure all required fields are provided when creating entities

### Debug Tools

```typescript
// Enable Zustand devtools in development
import { devtools } from 'zustand/middleware';

const usePackListStore = create<PackListStore>()(
  devtools(
    persist(/* store implementation */),
    { name: 'pack-list-store' }
  )
);
```

## Next Steps

1. **Explore Templates**: Learn about the template system for reusable lists
2. **Performance Monitoring**: Implement performance tracking for store operations
3. **Advanced Features**: Explore import/export functionality and sharing features
4. **Custom Hooks**: Create custom hooks for common store patterns

## Related Resources

- [API Reference](./API_REFERENCE.md#pack-list-store-api) - Complete API documentation
- [Performance Utilities](./PERFORMANCE_UTILITIES_API.md) - Optimization tools
- [Code Patterns](../.taskmaster/docs/CODE_PATTERNS.md) - Reusable patterns

---

*This guide provides comprehensive coverage of the Pack List Zustand store, enabling developers to effectively manage application state and build robust features.*

# Pack List - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Components](#core-components)
4. [Features](#features)
5. [State Management](#state-management)
6. [API Reference](#api-reference)
7. [User Guide](#user-guide)
8. [Developer Guide](#developer-guide)

---

## Overview

Pack List is a modern Progressive Web Application (PWA) for creating and managing packing lists. Built with Next.js 14, TypeScript, and Tailwind CSS, it provides a seamless experience for organizing items needed for trips, events, or any occasion requiring a checklist.

### Key Features
- Create unlimited packing lists with categories and items
- Priority-based item organization (Essential, High, Medium, Low)
- Progress tracking with visual indicators
- Template library for quick list creation
- Dark mode support
- Offline functionality (PWA)
- Mobile-responsive design
- Export/Import capabilities

### Technical Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS + Shadcn/ui
- **State**: Zustand with persistence
- **Animations**: Framer Motion
- **Package Manager**: Bun

---

## Architecture

### Directory Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Homepage
│   ├── lists/             # List management pages
│   └── templates/         # Template pages
├── components/            # React components
│   ├── ui/               # Base UI components (Shadcn)
│   ├── lists/            # List-specific components
│   ├── templates/        # Template components
│   ├── progress/         # Progress tracking
│   ├── mobile/           # Mobile-specific components
│   ├── error/            # Error boundaries
│   └── accessibility/    # A11y components
├── lib/                   # Utility functions
│   ├── utils.ts          # General utilities
│   ├── progress-utils.ts # Progress calculations
│   └── performance.ts    # Performance utilities
├── store/                 # State management
│   └── usePackListStore.ts # Main Zustand store
├── types/                 # TypeScript definitions
│   └── index.ts          # Type definitions
└── data/                  # Static data
    └── templates.ts      # Default templates
```

### Data Flow
```
User Action → Component → Store Action → State Update → Re-render
                ↓              ↓
          Local Storage   Performance Utils
```

---

## Core Components

### List Components

#### ListCard
**Location**: `src/components/lists/list-card.tsx`

Displays a summary card for a packing list.

```typescript
interface ListCardProps {
  list: List;
  onClick?: () => void;
  onEdit?: () => void;
}
```

**Features**:
- Progress visualization
- Quick actions (edit, duplicate, delete)
- Statistics display
- Tag system

#### ListDetail
**Location**: `src/components/lists/list-detail.tsx`

Main component for viewing and editing a list.

```typescript
interface ListDetailProps {
  listId: string;
}
```

**Features**:
- Category management
- Item CRUD operations
- Drag-and-drop reordering
- Progress tracking
- Export/Import functionality

### Template Components

#### TemplateSelector
**Location**: `src/components/templates/template-selector.tsx`

Interface for browsing and selecting templates.

```typescript
interface TemplateSelectorProps {
  onSelectTemplate: (template: Template) => void;
  showCreateOption?: boolean;
}
```

**Default Templates**:
1. Business Trip
2. Beach Vacation
3. Camping Adventure
4. Weekend Getaway
5. International Travel

#### TemplateManager
**Location**: `src/components/templates/template-manager.tsx`

Manages template CRUD operations.

```typescript
interface TemplateManagerProps {
  template: Template;
  onClose?: () => void;
}
```

### Progress Components

#### ListProgress
**Location**: `src/components/progress/list-progress.tsx`

Comprehensive progress visualization component.

```typescript
interface ListProgressProps {
  list: List;
  className?: string;
}
```

**Features**:
- Overall progress bar
- Priority-based breakdown
- Weight statistics
- Confetti celebration at 100%
- Visual status indicators

#### ProgressBar
**Location**: `src/components/progress/progress-bar.tsx`

Reusable progress bar component.

```typescript
interface ProgressBarProps {
  value: number;
  showPercentage?: boolean;
  showEmoji?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}
```

---

## Features

### 1. List Management

#### Creating Lists
```typescript
const createList = (name: string, description?: string) => {
  const listId = usePackListStore.getState().addList({
    name,
    description,
    categories: [],
    tags: []
  });
  return listId;
};
```

#### List Operations
- **Create**: Add new lists with metadata
- **Read**: View list details and statistics
- **Update**: Edit list properties
- **Delete**: Remove lists with confirmation
- **Duplicate**: Copy existing lists
- **Export**: Save as JSON
- **Import**: Load from JSON

### 2. Category & Item Management

#### Category Structure
```typescript
interface Category {
  id: string;
  name: string;
  order: number;
  items: Item[];
  collapsed: boolean;
}
```

#### Item Structure
```typescript
interface Item {
  id: string;
  name: string;
  quantity: number;
  packed: boolean;
  priority: Priority;
  notes?: string;
  weight?: number;
}
```

#### Priority System
```typescript
enum Priority {
  ESSENTIAL = 'essential',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}
```

### 3. Template System

#### Template Structure
```typescript
interface Template {
  id: string;
  name: string;
  description: string;
  icon?: string;
  categories: TemplateCategory[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  isPublic: boolean;
}
```

#### Using Templates
1. Browse available templates
2. Preview template contents
3. Create list from template
4. Customize as needed
5. Save customized version as new template

### 4. Progress Tracking

#### Progress Calculation
```typescript
const getItemsStats = (items: Item[]) => {
  const total = items.length;
  const packed = items.filter(item => item.packed).length;
  const progress = total > 0 ? Math.round((packed / total) * 100) : 0;
  
  return {
    total,
    packed,
    remaining: total - packed,
    progress,
    byPriority: groupByPriority(items),
    packedByPriority: groupPackedByPriority(items)
  };
};
```

#### Visual Indicators
- Progress bars with percentages
- Color-coded priority indicators
- Completion celebrations (confetti)
- Status messages
- Statistics dashboard

### 5. Mobile Features

#### Responsive Design
- Mobile-first approach
- Touch-optimized interfaces
- Swipe gestures for actions
- Floating action buttons
- Pull-to-refresh

#### Mobile Navigation
```typescript
<MobileNav>
  <NavItem href="/" icon={Home} label="Home" />
  <NavItem href="/lists" icon={List} label="Lists" />
  <NavItem href="/templates" icon={Template} label="Templates" />
</MobileNav>
```

### 6. Accessibility

#### WCAG 2.1 AA Compliance
- Semantic HTML
- ARIA labels and descriptions
- Keyboard navigation
- Focus management
- Skip navigation links
- High contrast support

#### Keyboard Shortcuts
- `Tab` - Navigate elements
- `Enter` - Activate buttons/links
- `Space` - Toggle checkboxes
- `Escape` - Close modals
- Arrow keys - Navigate lists

### 7. Performance Optimizations

#### Utility Functions
```typescript
// Debouncing
const debouncedSave = debounce(saveToLocalStorage, 500);

// Throttling
const throttledScroll = throttle(handleScroll, 100);

// Memoization
const memoizedStats = useMemo(() => getItemsStats(items), [items]);

// Lazy Loading
const LazyComponent = lazy(() => import('./heavy-component'));
```

#### Web Vitals Monitoring
```typescript
export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    // Send to analytics
    console.log(metric);
  });
  return null;
}
```

---

## State Management

### Zustand Store Structure

```typescript
interface PackListStore {
  // State
  lists: List[];
  templates: Template[];
  settings: Settings;
  
  // Actions
  addList: (list: Partial<List>) => string;
  updateList: (id: string, updates: Partial<List>) => void;
  deleteList: (id: string) => void;
  
  addCategory: (listId: string, category: Partial<Category>) => string;
  updateCategory: (listId: string, categoryId: string, updates: Partial<Category>) => void;
  deleteCategory: (listId: string, categoryId: string) => void;
  
  addItem: (listId: string, categoryId: string, item: Partial<Item>) => string;
  updateItem: (listId: string, categoryId: string, itemId: string, updates: Partial<Item>) => void;
  deleteItem: (listId: string, categoryId: string, itemId: string) => void;
  toggleItemPacked: (listId: string, categoryId: string, itemId: string) => void;
  
  // Template actions
  saveAsTemplate: (listId: string, name: string, description: string, isPublic: boolean) => string;
  updateTemplate: (id: string, updates: Partial<Template>) => void;
  deleteTemplate: (id: string) => void;
  
  // Utility actions
  getListStatistics: (listId: string) => ListStatistics;
  exportList: (listId: string) => string;
  importList: (jsonString: string) => string | null;
}
```

### Persistence Layer

```typescript
const usePackListStore = create<PackListStore>()(
  persist(
    (set, get) => ({
      // Store implementation
    }),
    {
      name: 'pack-list-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        lists: state.lists,
        templates: state.templates,
        settings: state.settings
      })
    }
  )
);
```

---

## API Reference

### Store Hooks

#### usePackListStore
Main store hook for accessing state and actions.

```typescript
const { lists, addList, updateList } = usePackListStore();
```

### Utility Functions

#### Progress Utilities
```typescript
// Calculate item statistics
getItemsStats(items: Item[]): ItemStats

// Calculate weight statistics
getWeightStats(items: Item[]): WeightStats

// Get priority color
getPriorityColor(priority: Priority): string

// Get priority label
getPriorityLabel(priority: Priority): string
```

#### Performance Utilities
```typescript
// Measure performance
measurePerformance(name: string, fn: () => void): any

// Debounce function
debounce<T>(fn: T, delay: number): T

// Throttle function
throttle<T>(fn: T, limit: number): T

// Memoize function
memoize<T>(fn: T, getKey?: Function): T
```

---

## User Guide

### Getting Started

1. **Create Your First List**
   - Click "Create New List"
   - Enter a name and optional description
   - Choose a template or start from scratch

2. **Add Categories**
   - Click "Add Category"
   - Name your category (e.g., "Clothing", "Electronics")
   - Categories help organize related items

3. **Add Items**
   - Click "Add Item" within a category
   - Set item details:
     - Name (required)
     - Quantity
     - Priority level
     - Weight (optional)
     - Notes (optional)

4. **Track Progress**
   - Check items as packed
   - View progress bars
   - See statistics by priority
   - Celebrate completion with confetti!

### Using Templates

1. **Browse Templates**
   - Go to Templates section
   - View available templates
   - Preview template contents

2. **Create from Template**
   - Click "Use Template"
   - Customize the generated list
   - Save your changes

3. **Save as Template**
   - Open any list
   - Click "Save as Template"
   - Choose visibility settings
   - Reuse for future trips

### Mobile Usage

1. **Install as App**
   - iOS: Safari → Share → Add to Home Screen
   - Android: Chrome → Menu → Add to Home Screen

2. **Offline Usage**
   - App works without internet
   - Changes saved locally
   - Syncs when online (future feature)

---

## Developer Guide

### Setup

```bash
# Clone repository
git clone <repository-url>
cd pack-list

# Install dependencies
bun install

# Start development
bun run dev

# Build for production
bun run build

# Start production server
bun run start
```

### Environment Variables

```env
# .env.local
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_GA_ID=your-ga-id
NEXT_PUBLIC_ENABLE_PWA=true
NEXT_PUBLIC_ENABLE_OFFLINE=true
```

### Adding New Features

#### 1. Create Component
```typescript
// src/components/feature/new-feature.tsx
export function NewFeature({ prop }: Props) {
  // Implementation
}
```

#### 2. Add to Store
```typescript
// src/store/usePackListStore.ts
interface PackListStore {
  // Add new state
  newFeature: FeatureType;
  
  // Add new actions
  updateFeature: (data: FeatureData) => void;
}
```

#### 3. Update Types
```typescript
// src/types/index.ts
export interface FeatureType {
  // Type definition
}
```

### Testing

```bash
# Run tests (when implemented)
bun test

# Type checking
bun run type-check

# Linting
bun run lint
```

### Deployment

#### Vercel
```bash
vercel --prod
```

#### Docker
```dockerfile
FROM oven/bun:1 as base
WORKDIR /app
# ... (see DEPLOYMENT.md)
```

#### Traditional
```bash
pm2 start ecosystem.config.js --env production
```

---

## Performance Considerations

### Bundle Optimization
- Code splitting by route
- Dynamic imports for heavy components
- Tree shaking enabled
- CSS purging with Tailwind

### Runtime Optimization
- React.memo for expensive components
- useMemo for expensive calculations
- useCallback for stable function references
- Debouncing for user input
- Throttling for scroll events

### Loading Strategy
- Static generation for marketing pages
- Client-side rendering for dynamic content
- Progressive enhancement
- Lazy loading for images and components

---

## Troubleshooting

### Common Issues

#### Local Storage Not Persisting
```typescript
// Check browser settings
// Ensure localStorage is enabled
// Check storage quota
```

#### Performance Issues
```typescript
// Enable React DevTools Profiler
// Check for unnecessary re-renders
// Verify memoization is working
```

#### Build Errors
```bash
# Clear cache
rm -rf .next node_modules
bun install
bun run build
```

---

## Contributing

### Code Style
- Use TypeScript for all new code
- Follow existing patterns
- Use Prettier for formatting
- Follow ESLint rules

### Pull Request Process
1. Fork repository
2. Create feature branch
3. Make changes
4. Add tests (when available)
5. Submit PR with description

---

## License

MIT License - See LICENSE file for details

---

*Last Updated: September 01, 2025*
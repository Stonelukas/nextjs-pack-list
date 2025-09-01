import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { List, Category, Item, Template, Priority, User, UserPreferences } from '@/types';
import { defaultTemplates, createListFromTemplate } from '@/data/default-templates';

interface PackListState {
  // User
  user: User | null;
  
  // Lists
  lists: List[];
  currentListId: string | null;
  
  // Templates
  templates: Template[];
  
  // User Actions
  setUser: (user: User) => void;
  updateUserPreferences: (preferences: Partial<UserPreferences>) => void;
  
  // List Actions
  createList: (list: Omit<List, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateList: (id: string, updates: Partial<List>) => void;
  deleteList: (id: string) => void;
  duplicateList: (id: string) => string;
  setCurrentList: (id: string | null) => void;
  
  // Category Actions
  addCategory: (listId: string, category: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'items'>) => string;
  updateCategory: (listId: string, categoryId: string, updates: Partial<Category>) => void;
  deleteCategory: (listId: string, categoryId: string) => void;
  reorderCategories: (listId: string, categoryIds: string[]) => void;
  toggleCategoryCollapse: (listId: string, categoryId: string) => void;
  
  // Item Actions
  addItem: (listId: string, categoryId: string, item: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateItem: (listId: string, categoryId: string, itemId: string, updates: Partial<Item>) => void;
  deleteItem: (listId: string, categoryId: string, itemId: string) => void;
  toggleItemPacked: (listId: string, categoryId: string, itemId: string) => void;
  reorderItems: (listId: string, categoryId: string, itemIds: string[]) => void;
  moveItem: (listId: string, itemId: string, fromCategoryId: string, toCategoryId: string) => void;
  
  // Template Actions
  saveAsTemplate: (listId: string, name: string, description: string, isPublic?: boolean) => string;
  applyTemplate: (templateId: string, listName: string) => string;
  deleteTemplate: (templateId: string) => void;
  updateTemplate: (templateId: string, updates: Partial<Template>) => void;
  getAllTemplates: () => Template[];
  
  // Utility Actions
  clearAllData: () => void;
  importData: (data: { lists?: List[]; templates?: Template[]; user?: User }) => void;
  exportData: () => { lists: List[]; templates: Template[]; user: User | null };
  
  // Computed
  getCurrentList: () => List | null;
  getListStatistics: (listId: string) => {
    totalItems: number;
    packedItems: number;
    completionPercentage: number;
    itemsByPriority: Record<Priority, number>;
    itemsByCategory: Record<string, { total: number; packed: number }>;
  } | null;
}

const generateId = () => crypto.randomUUID();
const now = () => new Date();

export const usePackListStore = create<PackListState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      user: null,
      lists: [],
      currentListId: null,
      templates: [],
      
      // User Actions
      setUser: (user) => set(state => {
        state.user = user;
      }),
      
      updateUserPreferences: (preferences) => set(state => {
        if (state.user) {
          state.user.preferences = { ...state.user.preferences, ...preferences } as UserPreferences;
          state.user.updatedAt = now();
        }
      }),
      
      // List Actions
      createList: (listData) => {
        const id = generateId();
        set(state => {
          state.lists.push({
            ...listData,
            id,
            createdAt: now(),
            updatedAt: now(),
          } as List);
        });
        return id;
      },
      
      updateList: (id, updates) => set(state => {
        const list = state.lists.find(l => l.id === id);
        if (list) {
          Object.assign(list, updates, { updatedAt: now() });
        }
      }),
      
      deleteList: (id) => set(state => {
        state.lists = state.lists.filter(l => l.id !== id);
        if (state.currentListId === id) {
          state.currentListId = null;
        }
      }),
      
      duplicateList: (id) => {
        const originalList = get().lists.find(l => l.id === id);
        if (!originalList) return '';
        
        const newId = generateId();
        set(state => {
          state.lists.push({
            ...originalList,
            id: newId,
            name: `${originalList.name} (Copy)`,
            createdAt: now(),
            updatedAt: now(),
          });
        });
        return newId;
      },
      
      setCurrentList: (id) => set(state => {
        state.currentListId = id;
      }),
      
      // Category Actions
      addCategory: (listId, categoryData) => {
        const id = generateId();
        set(state => {
          const list = state.lists.find(l => l.id === listId);
          if (list) {
            list.categories.push({
              ...categoryData,
              id,
              items: [],
              createdAt: now(),
              updatedAt: now(),
            } as Category);
            list.updatedAt = now();
          }
        });
        return id;
      },
      
      updateCategory: (listId, categoryId, updates) => set(state => {
        const list = state.lists.find(l => l.id === listId);
        if (list) {
          const category = list.categories.find(c => c.id === categoryId);
          if (category) {
            Object.assign(category, updates, { updatedAt: now() });
            list.updatedAt = now();
          }
        }
      }),
      
      deleteCategory: (listId, categoryId) => set(state => {
        const list = state.lists.find(l => l.id === listId);
        if (list) {
          list.categories = list.categories.filter(c => c.id !== categoryId);
          list.updatedAt = now();
        }
      }),
      
      reorderCategories: (listId, categoryIds) => set(state => {
        const list = state.lists.find(l => l.id === listId);
        if (list) {
          const categoriesMap = new Map(list.categories.map(c => [c.id, c]));
          list.categories = categoryIds
            .map(id => categoriesMap.get(id))
            .filter(Boolean) as Category[];
          list.categories.forEach((cat, index) => {
            cat.order = index;
          });
          list.updatedAt = now();
        }
      }),
      
      toggleCategoryCollapse: (listId, categoryId) => set(state => {
        const list = state.lists.find(l => l.id === listId);
        if (list) {
          const category = list.categories.find(c => c.id === categoryId);
          if (category) {
            category.collapsed = !category.collapsed;
            list.updatedAt = now();
          }
        }
      }),
      
      // Item Actions
      addItem: (listId, categoryId, itemData) => {
        const id = generateId();
        set(state => {
          const list = state.lists.find(l => l.id === listId);
          if (list) {
            const category = list.categories.find(c => c.id === categoryId);
            if (category) {
              category.items.push({
                ...itemData,
                id,
                categoryId,
                createdAt: now(),
                updatedAt: now(),
              } as Item);
              category.updatedAt = now();
              list.updatedAt = now();
            }
          }
        });
        return id;
      },
      
      updateItem: (listId, categoryId, itemId, updates) => set(state => {
        const list = state.lists.find(l => l.id === listId);
        if (list) {
          const category = list.categories.find(c => c.id === categoryId);
          if (category) {
            const item = category.items.find(i => i.id === itemId);
            if (item) {
              Object.assign(item, updates, { updatedAt: now() });
              category.updatedAt = now();
              list.updatedAt = now();
            }
          }
        }
      }),
      
      deleteItem: (listId, categoryId, itemId) => set(state => {
        const list = state.lists.find(l => l.id === listId);
        if (list) {
          const category = list.categories.find(c => c.id === categoryId);
          if (category) {
            category.items = category.items.filter(i => i.id !== itemId);
            category.updatedAt = now();
            list.updatedAt = now();
          }
        }
      }),
      
      toggleItemPacked: (listId, categoryId, itemId) => set(state => {
        const list = state.lists.find(l => l.id === listId);
        if (list) {
          const category = list.categories.find(c => c.id === categoryId);
          if (category) {
            const item = category.items.find(i => i.id === itemId);
            if (item) {
              item.packed = !item.packed;
              item.updatedAt = now();
              category.updatedAt = now();
              list.updatedAt = now();
            }
          }
        }
      }),
      
      reorderItems: (listId, categoryId, itemIds) => set(state => {
        const list = state.lists.find(l => l.id === listId);
        if (list) {
          const category = list.categories.find(c => c.id === categoryId);
          if (category) {
            const itemsMap = new Map(category.items.map(i => [i.id, i]));
            category.items = itemIds
              .map(id => itemsMap.get(id))
              .filter(Boolean) as Item[];
            category.updatedAt = now();
            list.updatedAt = now();
          }
        }
      }),
      
      moveItem: (listId, itemId, fromCategoryId, toCategoryId) => set(state => {
        const list = state.lists.find(l => l.id === listId);
        if (list) {
          const fromCategory = list.categories.find(c => c.id === fromCategoryId);
          const toCategory = list.categories.find(c => c.id === toCategoryId);
          if (fromCategory && toCategory) {
            const itemIndex = fromCategory.items.findIndex(i => i.id === itemId);
            if (itemIndex !== -1) {
              const [item] = fromCategory.items.splice(itemIndex, 1);
              item.categoryId = toCategoryId;
              item.updatedAt = now();
              toCategory.items.push(item);
              fromCategory.updatedAt = now();
              toCategory.updatedAt = now();
              list.updatedAt = now();
            }
          }
        }
      }),
      
      // Template Actions
      saveAsTemplate: (listId, name, description, isPublic = false) => {
        const list = get().lists.find(l => l.id === listId);
        if (!list) return '';
        
        const templateId = generateId();
        set(state => {
          state.templates.push({
            id: templateId,
            name,
            description,
            categories: list.categories.map(c => ({
              name: c.name,
              color: c.color,
              icon: c.icon,
              order: c.order,
              items: c.items.map(i => ({
                name: i.name,
                quantity: i.quantity,
                packed: false,
                priority: i.priority,
                notes: i.notes,
                categoryId: '',
              })),
              collapsed: c.collapsed,
            })),
            tags: list.tags || [],
            isPublic,
            usageCount: 0,
            createdBy: state.user?.id || 'anonymous',
            createdAt: now(),
            updatedAt: now(),
          });
        });
        return templateId;
      },
      
      applyTemplate: (templateId, listName) => {
        // First check user templates
        let template = get().templates.find(t => t.id === templateId);
        
        // If not found in user templates, check default templates
        if (!template) {
          template = defaultTemplates.find(t => t.id === templateId);
        }
        
        if (!template) return '';
        
        const userId = get().user?.id || 'default';
        const listData = createListFromTemplate(template, listName, userId);
        const listId = generateId();
        
        set(state => {
          state.lists.push({
            ...listData,
            id: listId,
            createdAt: now(),
            updatedAt: now(),
          });
          
          // Increment template usage count if it's a user template
          const userTemplate = state.templates.find(t => t.id === templateId);
          if (userTemplate) {
            userTemplate.usageCount++;
            userTemplate.updatedAt = now();
          }
        });
        return listId;
      },
      
      deleteTemplate: (templateId) => set(state => {
        state.templates = state.templates.filter(t => t.id !== templateId);
      }),
      
      updateTemplate: (templateId, updates) => set(state => {
        const template = state.templates.find(t => t.id === templateId);
        if (template) {
          Object.assign(template, updates, { updatedAt: now() });
        }
      }),
      
      getAllTemplates: () => {
        const userTemplates = get().templates;
        // Combine default templates with user templates
        // User templates come first for priority
        return [...userTemplates, ...defaultTemplates];
      },
      
      // Utility Actions
      clearAllData: () => set(state => {
        state.lists = [];
        state.templates = [];
        state.currentListId = null;
        state.user = null;
      }),
      
      importData: (data) => set(state => {
        if (data.lists) state.lists = data.lists;
        if (data.templates) state.templates = data.templates;
        if (data.user) state.user = data.user;
      }),
      
      exportData: () => {
        const state = get();
        return {
          lists: state.lists,
          templates: state.templates,
          user: state.user,
        };
      },
      
      // Computed
      getCurrentList: () => {
        const state = get();
        return state.lists.find(l => l.id === state.currentListId) || null;
      },
      
      getListStatistics: (listId) => {
        const list = get().lists.find(l => l.id === listId);
        if (!list) return null;
        
        let totalItems = 0;
        let packedItems = 0;
        const itemsByPriority: Record<Priority, number> = {
          [Priority.LOW]: 0,
          [Priority.MEDIUM]: 0,
          [Priority.HIGH]: 0,
          [Priority.ESSENTIAL]: 0,
        };
        const itemsByCategory: Record<string, { total: number; packed: number }> = {};
        
        list.categories.forEach(category => {
          const categoryStats = { total: 0, packed: 0 };
          
          category.items.forEach(item => {
            totalItems++;
            categoryStats.total++;
            itemsByPriority[item.priority]++;
            
            if (item.packed) {
              packedItems++;
              categoryStats.packed++;
            }
          });
          
          itemsByCategory[category.id] = categoryStats;
        });
        
        return {
          totalItems,
          packedItems,
          completionPercentage: totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0,
          itemsByPriority,
          itemsByCategory,
        };
      },
    })),
    {
      name: 'pack-list-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
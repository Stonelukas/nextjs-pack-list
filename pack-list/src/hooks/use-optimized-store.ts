import { useMemo } from 'react';
import { usePackListStore } from '@/store/usePackListStore';
import { List, Category, Item } from '@/types';

export function useOptimizedList(listId: string) {
  const lists = usePackListStore((state) => state.lists);
  
  const list = useMemo(
    () => lists.find(l => l.id === listId),
    [lists, listId]
  );
  
  const categories = useMemo(
    () => list ? [...list.categories].sort((a, b) => a.order - b.order) : [],
    [list]
  );
  
  const items = useMemo(
    () => categories.flatMap(cat => cat.items || []),
    [categories]
  );
  
  const stats = useMemo(() => {
    if (!list) return null;
    
    const totalItems = items.length;
    const packedItems = items.filter(item => item.isPacked).length;
    const priorityCounts = {
      essential: items.filter(item => item.priority === 'essential').length,
      important: items.filter(item => item.priority === 'important').length,
      'nice-to-have': items.filter(item => item.priority === 'nice-to-have').length,
    };
    
    return {
      totalItems,
      packedItems,
      completionPercentage: totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0,
      priorityCounts,
      essentialsPacked: items
        .filter(item => item.priority === 'essential')
        .every(item => item.isPacked),
    };
  }, [list, items]);
  
  return {
    list,
    categories,
    items,
    stats,
  };
}

export function useOptimizedCategories() {
  const lists = usePackListStore((state) => state.lists);
  
  const allCategories = useMemo(
    () => lists.flatMap(list => list.categories),
    [lists]
  );
  
  const uniqueCategories = useMemo(
    () => {
      const seen = new Set<string>();
      return allCategories.filter(cat => {
        if (seen.has(cat.name)) return false;
        seen.add(cat.name);
        return true;
      });
    },
    [allCategories]
  );
  
  return {
    allCategories,
    uniqueCategories,
  };
}
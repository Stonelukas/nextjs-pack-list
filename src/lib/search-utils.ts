import { Item, List, Category } from "@/types";

/**
 * Search items by query string
 * Searches in name, description, and tags
 */
export const searchItems = (items: Item[], query: string): Item[] => {
  if (!query.trim()) return items;
  
  const lowerQuery = query.toLowerCase();
  return items.filter(item => 
    item.name.toLowerCase().includes(lowerQuery) ||
    item.description?.toLowerCase().includes(lowerQuery) ||
    item.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
};

/**
 * Search lists by query string
 * Searches in name, description, and tags
 */
export const searchLists = (lists: List[], query: string): List[] => {
  if (!query.trim()) return lists;
  
  const lowerQuery = query.toLowerCase();
  return lists.filter(list => 
    list.name.toLowerCase().includes(lowerQuery) ||
    list.description?.toLowerCase().includes(lowerQuery) ||
    list.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
};

/**
 * Search categories by query string
 */
export const searchCategories = (categories: Category[], query: string): Category[] => {
  if (!query.trim()) return categories;
  
  const lowerQuery = query.toLowerCase();
  return categories.filter(category => 
    category.name.toLowerCase().includes(lowerQuery) ||
    searchItems(category.items, query).length > 0
  );
};

/**
 * Highlight matched text in a string
 */
export const highlightText = (text: string, query: string): string => {
  if (!query.trim()) return text;
  
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};
import { Item, Category, List, Priority } from "@/types";

/**
 * Calculate overall progress percentage for a list of items
 */
export const calculateListProgress = (items: Item[]): number => {
  if (items.length === 0) return 0;
  const packedItems = items.filter(item => item.packed).length;
  return Math.round((packedItems / items.length) * 100);
};

/**
 * Calculate progress for a specific category
 */
export const calculateCategoryProgress = (items: Item[], categoryId: string): number => {
  const categoryItems = items.filter(item => item.categoryId === categoryId);
  return calculateListProgress(categoryItems);
};

/**
 * Get appropriate color class based on progress percentage
 */
export const getProgressColor = (progress: number): string => {
  if (progress === 0) return "bg-gray-500";
  if (progress < 30) return "bg-red-500";
  if (progress < 70) return "bg-yellow-500";
  if (progress < 100) return "bg-blue-500";
  return "bg-green-500";
};

/**
 * Get Tailwind gradient classes for progress bars
 */
export const getProgressGradient = (progress: number): string => {
  if (progress === 0) return "from-gray-500 to-gray-600";
  if (progress < 30) return "from-red-500 to-red-600";
  if (progress < 70) return "from-yellow-500 to-yellow-600";
  if (progress < 100) return "from-blue-500 to-blue-600";
  return "from-green-500 to-green-600";
};

/**
 * Get completion status text
 */
export const getCompletionStatus = (progress: number): string => {
  if (progress === 0) return "Not Started";
  if (progress < 100) return "In Progress";
  return "Complete";
};

/**
 * Get emoji for completion status
 */
export const getCompletionEmoji = (progress: number): string => {
  if (progress === 0) return "📋";
  if (progress < 30) return "🚀";
  if (progress < 70) return "⚡";
  if (progress < 100) return "🔥";
  return "✅";
};

/**
 * Get detailed item statistics
 */
export const getItemsStats = (items: Item[]) => {
  const total = items.length;
  const packed = items.filter(item => item.packed).length;
  const remaining = total - packed;
  const progress = total > 0 ? Math.round((packed / total) * 100) : 0;
  
  const byPriority = {
    [Priority.ESSENTIAL]: items.filter(item => item.priority === Priority.ESSENTIAL).length,
    [Priority.HIGH]: items.filter(item => item.priority === Priority.HIGH).length,
    [Priority.MEDIUM]: items.filter(item => item.priority === Priority.MEDIUM).length,
    [Priority.LOW]: items.filter(item => item.priority === Priority.LOW).length,
  };
  
  const packedByPriority = {
    [Priority.ESSENTIAL]: items.filter(item => item.packed && item.priority === Priority.ESSENTIAL).length,
    [Priority.HIGH]: items.filter(item => item.packed && item.priority === Priority.HIGH).length,
    [Priority.MEDIUM]: items.filter(item => item.packed && item.priority === Priority.MEDIUM).length,
    [Priority.LOW]: items.filter(item => item.packed && item.priority === Priority.LOW).length,
  };
  
  return {
    total,
    packed,
    remaining,
    progress,
    byPriority,
    packedByPriority,
    status: getCompletionStatus(progress),
    emoji: getCompletionEmoji(progress),
  };
};

/**
 * Calculate weight statistics for items
 */
export const getWeightStats = (items: Item[]) => {
  const itemsWithWeight = items.filter(item => item.weight !== undefined && item.weight !== null);
  const totalWeight = itemsWithWeight.reduce((sum, item) => sum + (item.weight || 0) * item.quantity, 0);
  const packedWeight = itemsWithWeight
    .filter(item => item.packed)
    .reduce((sum, item) => sum + (item.weight || 0) * item.quantity, 0);
  
  return {
    total: totalWeight,
    packed: packedWeight,
    remaining: totalWeight - packedWeight,
    hasWeightData: itemsWithWeight.length > 0,
  };
};

/**
 * Get priority color for badges and indicators
 */
export const getPriorityColor = (priority: Priority): string => {
  switch (priority) {
    case Priority.ESSENTIAL:
      return "text-red-600 dark:text-red-400";
    case Priority.HIGH:
      return "text-orange-600 dark:text-orange-400";
    case Priority.MEDIUM:
      return "text-yellow-600 dark:text-yellow-400";
    case Priority.LOW:
      return "text-green-600 dark:text-green-400";
    default:
      return "text-gray-600 dark:text-gray-400";
  }
};

/**
 * Get priority background color for badges
 */
export const getPriorityBgColor = (priority: Priority): string => {
  switch (priority) {
    case Priority.ESSENTIAL:
      return "bg-red-100 dark:bg-red-900/30";
    case Priority.HIGH:
      return "bg-orange-100 dark:bg-orange-900/30";
    case Priority.MEDIUM:
      return "bg-yellow-100 dark:bg-yellow-900/30";
    case Priority.LOW:
      return "bg-green-100 dark:bg-green-900/30";
    default:
      return "bg-gray-100 dark:bg-gray-900/30";
  }
};

/**
 * Sort items by priority
 */
export const sortByPriority = (items: Item[], ascending: boolean = false): Item[] => {
  const priorityOrder = {
    [Priority.ESSENTIAL]: 0,
    [Priority.HIGH]: 1,
    [Priority.MEDIUM]: 2,
    [Priority.LOW]: 3,
  };
  
  return [...items].sort((a, b) => {
    const orderA = priorityOrder[a.priority];
    const orderB = priorityOrder[b.priority];
    return ascending ? orderA - orderB : orderB - orderA;
  });
};

/**
 * Filter items by priority levels
 */
export const filterByPriority = (items: Item[], priorities: Priority[]): Item[] => {
  if (priorities.length === 0) return items;
  return items.filter(item => priorities.includes(item.priority));
};

/**
 * Check if all essential items are packed
 */
export const areEssentialsPacked = (items: Item[]): boolean => {
  const essentialItems = items.filter(item => item.priority === Priority.ESSENTIAL);
  if (essentialItems.length === 0) return true;
  return essentialItems.every(item => item.packed);
};

/**
 * Get next unpacked item by priority
 */
export const getNextUnpackedItem = (items: Item[]): Item | null => {
  const unpacked = items.filter(item => !item.packed);
  if (unpacked.length === 0) return null;
  
  const sorted = sortByPriority(unpacked);
  return sorted[0];
};
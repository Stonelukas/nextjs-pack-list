import { Item } from "@/types";

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching of similar item names
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  
  // If one string is empty, return the length of the other
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  
  // Initialize the matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  // Fill the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

/**
 * Normalize a string for comparison
 * Removes extra spaces, converts to lowercase, and removes punctuation
 */
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/gi, '') // Remove punctuation
    .replace(/\s+/g, ' ');     // Normalize whitespace
}

/**
 * Find potential duplicate items based on name similarity
 */
export function findPotentialDuplicates(
  items: Item[], 
  newItemName: string,
  threshold: number = 2
): Item[] {
  const normalized = normalizeString(newItemName);
  
  if (!normalized) return [];
  
  return items.filter(item => {
    const itemName = normalizeString(item.name);
    
    // Exact match (after normalization)
    if (itemName === normalized) return true;
    
    // Fuzzy match with Levenshtein distance
    if (normalized.length > 3 && levenshteinDistance(itemName, normalized) <= threshold) {
      return true;
    }
    
    // Substring match (one contains the other)
    if (normalized.length > 3 && (itemName.includes(normalized) || normalized.includes(itemName))) {
      return true;
    }
    
    // Word-based matching (all words from shorter string exist in longer)
    const words1 = normalized.split(' ').filter(w => w.length > 2);
    const words2 = itemName.split(' ').filter(w => w.length > 2);
    
    if (words1.length > 0 && words2.length > 0) {
      const shorterWords = words1.length <= words2.length ? words1 : words2;
      const longerWords = words1.length > words2.length ? words1 : words2;
      
      const allWordsMatch = shorterWords.every(word => 
        longerWords.some(w => w.includes(word) || word.includes(w))
      );
      
      if (allWordsMatch) return true;
    }
    
    return false;
  });
}

/**
 * Calculate similarity score between two strings (0-1)
 */
export function similarityScore(a: string, b: string): number {
  const normalizedA = normalizeString(a);
  const normalizedB = normalizeString(b);
  
  if (normalizedA === normalizedB) return 1;
  
  const maxLength = Math.max(normalizedA.length, normalizedB.length);
  if (maxLength === 0) return 1;
  
  const distance = levenshteinDistance(normalizedA, normalizedB);
  return 1 - (distance / maxLength);
}

/**
 * Group similar items together
 */
export function groupSimilarItems(items: Item[], threshold: number = 0.7): Item[][] {
  const groups: Item[][] = [];
  const processed = new Set<string>();
  
  for (const item of items) {
    if (processed.has(item.id)) continue;
    
    const group = [item];
    processed.add(item.id);
    
    for (const otherItem of items) {
      if (processed.has(otherItem.id)) continue;
      
      if (similarityScore(item.name, otherItem.name) >= threshold) {
        group.push(otherItem);
        processed.add(otherItem.id);
      }
    }
    
    groups.push(group);
  }
  
  return groups.filter(group => group.length > 1);
}
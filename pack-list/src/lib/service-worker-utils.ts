/**
 * Service worker utilities for enhanced offline support and error handling
 * Provides caching strategies, background sync, and error recovery
 */

import { logError, AppError, ErrorType } from './error-utils';

/**
 * Cache configuration for different resource types
 */
export const CACHE_CONFIG = {
  STATIC: 'pack-list-static-v1',
  DYNAMIC: 'pack-list-dynamic-v1',
  USER_DATA: 'pack-list-data-v1',
  IMAGES: 'pack-list-images-v1',
} as const;

/**
 * Cache strategies for different types of resources
 */
export enum CacheStrategy {
  CACHE_FIRST = 'cache-first',
  NETWORK_FIRST = 'network-first',
  CACHE_ONLY = 'cache-only',
  NETWORK_ONLY = 'network-only',
  STALE_WHILE_REVALIDATE = 'stale-while-revalidate',
}

/**
 * Cache a response with error handling
 */
export async function cacheResponse(
  cacheName: string,
  request: Request | string,
  response: Response
): Promise<void> {
  try {
    if (!response.ok) {
      throw new Error(`Response not ok: ${response.status}`);
    }

    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone());
  } catch (error) {
    logError(
      new AppError(
        'Failed to cache response',
        ErrorType.STORAGE,
        { 
          cacheName, 
          url: typeof request === 'string' ? request : request.url,
          originalError: error instanceof Error ? error.message : String(error)
        }
      )
    );
  }
}

/**
 * Retrieve from cache with fallback handling
 */
export async function getCachedResponse(
  cacheName: string,
  request: Request | string
): Promise<Response | null> {
  try {
    const cache = await caches.open(cacheName);
    const response = await cache.match(request);
    return response || null;
  } catch (error) {
    logError(
      new AppError(
        'Failed to retrieve cached response',
        ErrorType.STORAGE,
        { 
          cacheName, 
          url: typeof request === 'string' ? request : request.url,
          originalError: error instanceof Error ? error.message : String(error)
        }
      )
    );
    return null;
  }
}

/**
 * Generic cache strategy handler
 */
export async function handleCacheStrategy(
  request: Request,
  strategy: CacheStrategy,
  cacheName: string
): Promise<Response> {
  switch (strategy) {
    case CacheStrategy.CACHE_FIRST:
      return await cacheFirst(request, cacheName);
    
    case CacheStrategy.NETWORK_FIRST:
      return await networkFirst(request, cacheName);
    
    case CacheStrategy.CACHE_ONLY:
      return await cacheOnly(request, cacheName);
    
    case CacheStrategy.NETWORK_ONLY:
      return await networkOnly(request);
    
    case CacheStrategy.STALE_WHILE_REVALIDATE:
      return await staleWhileRevalidate(request, cacheName);
    
    default:
      return await networkFirst(request, cacheName);
  }
}

/**
 * Cache-first strategy: Try cache first, fallback to network
 */
async function cacheFirst(request: Request, cacheName: string): Promise<Response> {
  const cachedResponse = await getCachedResponse(cacheName, request);
  
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    await cacheResponse(cacheName, request, networkResponse);
    return networkResponse;
  } catch (error) {
    throw new AppError(
      'Network request failed and no cached version available',
      ErrorType.NETWORK,
      { url: request.url, strategy: 'cache-first' }
    );
  }
}

/**
 * Network-first strategy: Try network first, fallback to cache
 */
async function networkFirst(request: Request, cacheName: string): Promise<Response> {
  try {
    const networkResponse = await fetch(request);
    await cacheResponse(cacheName, request, networkResponse);
    return networkResponse;
  } catch (error) {
    const cachedResponse = await getCachedResponse(cacheName, request);
    
    if (cachedResponse) {
      return cachedResponse;
    }

    throw new AppError(
      'Network request failed and no cached version available',
      ErrorType.NETWORK,
      { url: request.url, strategy: 'network-first' }
    );
  }
}

/**
 * Cache-only strategy: Only serve from cache
 */
async function cacheOnly(request: Request, cacheName: string): Promise<Response> {
  const cachedResponse = await getCachedResponse(cacheName, request);
  
  if (cachedResponse) {
    return cachedResponse;
  }

  throw new AppError(
    'Resource not available in cache',
    ErrorType.NOT_FOUND,
    { url: request.url, strategy: 'cache-only' }
  );
}

/**
 * Network-only strategy: Only fetch from network
 */
async function networkOnly(request: Request): Promise<Response> {
  try {
    return await fetch(request);
  } catch (error) {
    throw new AppError(
      'Network request failed',
      ErrorType.NETWORK,
      { url: request.url, strategy: 'network-only' }
    );
  }
}

/**
 * Stale-while-revalidate: Serve from cache, update cache in background
 */
async function staleWhileRevalidate(request: Request, cacheName: string): Promise<Response> {
  const cachedResponse = await getCachedResponse(cacheName, request);
  
  // Update cache in background
  const networkUpdate = fetch(request)
    .then(response => cacheResponse(cacheName, request, response))
    .catch(error => {
      logError(
        new AppError(
          'Background cache update failed',
          ErrorType.NETWORK,
          { url: request.url, strategy: 'stale-while-revalidate' }
        )
      );
    });

  if (cachedResponse) {
    return cachedResponse;
  }

  // If no cache, wait for network
  try {
    await networkUpdate;
    const response = await getCachedResponse(cacheName, request);
    if (response) return response;
    
    // Fallback to direct fetch
    return await fetch(request);
  } catch (error) {
    throw new AppError(
      'Network request failed and no cached version available',
      ErrorType.NETWORK,
      { url: request.url, strategy: 'stale-while-revalidate' }
    );
  }
}

/**
 * Clean up old caches
 */
export async function cleanupOldCaches(currentCaches: string[]): Promise<void> {
  try {
    const cacheNames = await caches.keys();
    const oldCaches = cacheNames.filter(
      cacheName => !currentCaches.includes(cacheName)
    );

    await Promise.all(
      oldCaches.map(cacheName => caches.delete(cacheName))
    );

    if (oldCaches.length > 0) {
      console.log('Cleaned up old caches:', oldCaches);
    }
  } catch (error) {
    logError(
      new AppError(
        'Failed to cleanup old caches',
        ErrorType.STORAGE,
        { originalError: error instanceof Error ? error.message : String(error) }
      )
    );
  }
}

/**
 * Preload critical resources into cache
 */
export async function preloadResources(
  urls: string[],
  cacheName: string
): Promise<void> {
  try {
    const cache = await caches.open(cacheName);
    
    // Use addAll for atomic operation - either all succeed or all fail
    await cache.addAll(urls);
    
    console.log(`Preloaded ${urls.length} resources into ${cacheName}`);
  } catch (error) {
    logError(
      new AppError(
        'Failed to preload resources',
        ErrorType.NETWORK,
        { 
          urls, 
          cacheName,
          originalError: error instanceof Error ? error.message : String(error)
        }
      )
    );
  }
}

/**
 * Get cache storage usage information
 */
export async function getCacheStorageInfo(): Promise<{
  usage: number;
  quota: number;
  percentage: number;
}> {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percentage = quota > 0 ? Math.round((usage / quota) * 100) : 0;

      return { usage, quota, percentage };
    }

    return { usage: 0, quota: 0, percentage: 0 };
  } catch (error) {
    logError(
      new AppError(
        'Failed to get cache storage info',
        ErrorType.STORAGE,
        { originalError: error instanceof Error ? error.message : String(error) }
      )
    );
    return { usage: 0, quota: 0, percentage: 0 };
  }
}

/**
 * Clear all application caches
 */
export async function clearAllCaches(): Promise<void> {
  try {
    const cacheNames = await caches.keys();
    const packListCaches = cacheNames.filter(
      name => name.startsWith('pack-list-')
    );

    await Promise.all(
      packListCaches.map(cacheName => caches.delete(cacheName))
    );

    console.log(`Cleared ${packListCaches.length} application caches`);
  } catch (error) {
    logError(
      new AppError(
        'Failed to clear all caches',
        ErrorType.STORAGE,
        { originalError: error instanceof Error ? error.message : String(error) }
      )
    );
  }
}

/**
 * Check if the user is online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Add online/offline event listeners with error handling
 */
export function setupOnlineOfflineHandlers(
  onOnline?: () => void,
  onOffline?: () => void
): () => void {
  const handleOnline = () => {
    try {
      console.log('Application is online');
      onOnline?.();
    } catch (error) {
      logError(
        new AppError(
          'Error in online handler',
          ErrorType.UNKNOWN,
          { originalError: error instanceof Error ? error.message : String(error) }
        )
      );
    }
  };

  const handleOffline = () => {
    try {
      console.log('Application is offline');
      onOffline?.();
    } catch (error) {
      logError(
        new AppError(
          'Error in offline handler',
          ErrorType.UNKNOWN,
          { originalError: error instanceof Error ? error.message : String(error) }
        )
      );
    }
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
/**
 * Utility for caching API data locally to support offline mode
 */
export const localCache = {
  /**
   * Save data to localStorage with a timestamp
   */
  set: (key: string, data: any) => {
    if (typeof window === 'undefined') return;
    const cacheData = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(`cache_${key}`, JSON.stringify(cacheData));
  },

  /**
   * Get data from localStorage
   */
  get: (key: string) => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(`cache_${key}`);
    if (!stored) return null;
    try {
      const parsed = JSON.parse(stored);
      return parsed.data;
    } catch (e) {
      console.error(`Failed to parse cache for ${key}`, e);
      return null;
    }
  },

  /**
   * Remove specific cache
   */
  remove: (key: string) => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(`cache_${key}`);
  },

  /**
   * Clear all API caches
   */
  clearAll: () => {
    if (typeof window === 'undefined') return;
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('cache_')) {
        localStorage.removeItem(key);
      }
    });
  }
};

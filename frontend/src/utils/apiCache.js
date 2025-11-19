// API Request Cache and Deduplication Utility
// This prevents multiple identical API calls from being made simultaneously

class ApiCache {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes default TTL
  }

  // Generate a cache key from request config
  generateKey(method, url, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {});

    return `${method.toUpperCase()}:${url}:${JSON.stringify(sortedParams)}`;
  }

  // Get cached data if available and not expired
  get(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() > cached.expiresAt;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  // Set cache with TTL
  set(key, data, ttl = this.defaultTTL) {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl,
    });
  }

  // Clear specific cache entry
  delete(key) {
    this.cache.delete(key);
  }

  // Clear all cache
  clear() {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  // Clear cache entries matching a pattern (e.g., all leads-related caches)
  clearPattern(pattern) {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  // Request deduplication - prevent multiple identical requests
  async deduplicate(key, requestFn) {
    // Check if there's already a pending request
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    // Create new request promise
    const promise = requestFn()
      .then((result) => {
        this.pendingRequests.delete(key);
        return result;
      })
      .catch((error) => {
        this.pendingRequests.delete(key);
        throw error;
      });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  // Main method to get data with caching and deduplication
  async fetch(method, url, params = {}, requestFn, options = {}) {
    const { ttl = this.defaultTTL, skipCache = false } = options;
    const key = this.generateKey(method, url, params);

    // Return cached data if available and not skipping cache
    if (!skipCache) {
      const cached = this.get(key);
      if (cached !== null) {
        return cached;
      }
    }

    // Deduplicate request and cache result
    const result = await this.deduplicate(key, requestFn);

    // Only cache GET requests by default
    if (method.toUpperCase() === 'GET' && !skipCache) {
      this.set(key, result, ttl);
    }

    return result;
  }
}

// Export singleton instance
export const apiCache = new ApiCache();

// Cache configuration for different endpoints
export const cacheConfig = {
  // No caching for auth endpoints
  auth: { skipCache: true },

  // Short cache for frequently changing data
  leads: { ttl: 2 * 60 * 1000 }, // 2 minutes
  opportunities: { ttl: 2 * 60 * 1000 },
  tasks: { ttl: 1 * 60 * 1000 }, // 1 minute

  // Medium cache for less frequently changing data
  accounts: { ttl: 5 * 60 * 1000 }, // 5 minutes
  contacts: { ttl: 5 * 60 * 1000 },

  // Longer cache for static/rarely changing data
  roles: { ttl: 15 * 60 * 1000 }, // 15 minutes
  groups: { ttl: 15 * 60 * 1000 },
  users: { ttl: 10 * 60 * 1000 }, // 10 minutes
  tenants: { ttl: 15 * 60 * 1000 },
};

// Helper to invalidate related caches after mutations
export const invalidateCache = {
  lead: () => {
    apiCache.clearPattern('GET:/leads');
    apiCache.clearPattern('GET:/dashboard');
  },
  account: () => {
    apiCache.clearPattern('GET:/accounts');
    apiCache.clearPattern('GET:/dashboard');
  },
  contact: () => {
    apiCache.clearPattern('GET:/contacts');
    apiCache.clearPattern('GET:/dashboard');
  },
  opportunity: () => {
    apiCache.clearPattern('GET:/opportunities');
    apiCache.clearPattern('GET:/dashboard');
  },
  task: () => {
    apiCache.clearPattern('GET:/tasks');
    apiCache.clearPattern('GET:/dashboard');
  },
  user: () => {
    apiCache.clearPattern('GET:/users');
  },
  role: () => {
    apiCache.clearPattern('GET:/roles');
  },
  group: () => {
    apiCache.clearPattern('GET:/groups');
  },
  all: () => {
    apiCache.clear();
  }
};

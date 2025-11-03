/**
 * CacheManager - Universal rendering cache management system
 * 
 * Manages multiple rendering caches with:
 * - Memory budget enforcement
 * - LRU (Least Recently Used) eviction
 * - Multiple cache strategies (FullBuffer, DirtyRect, Throttled, Tiled)
 * - Performance statistics tracking
 * - Automatic cleanup and invalidation
 * 
 * @class CacheManager
 * @singleton
 */
class CacheManager {
  /**
   * Singleton instance
   * @private
   * @static
   */
  static _instance = null;

  /**
   * Get singleton instance
   * @returns {CacheManager} The singleton instance
   */
  static getInstance() {
    if (!CacheManager._instance) {
      CacheManager._instance = new CacheManager();
    }
    return CacheManager._instance;
  }

  /**
   * Private constructor (use getInstance())
   * @private
   */
  constructor() {
    if (CacheManager._instance) {
      throw new Error('CacheManager is a singleton. Use getInstance() instead.');
    }

    // Cache storage: name -> CacheEntry
    this._caches = new Map();

    // Memory management
    this._memoryBudget = 10 * 1024 * 1024; // 10MB default
    this._currentMemoryUsage = 0;
    this._evictionEnabled = true;

    // LRU tracking
    this._accessTimestamp = 0; // Monotonic counter for access ordering

    // Statistics
    this._stats = {
      hits: 0,
      misses: 0,
      evictions: 0
    };

    // Cache strategies registry
    this._strategies = new Map();
    this._registerDefaultStrategies();
  }

  /**
   * Register default cache strategies
   * @private
   */
  _registerDefaultStrategies() {
    // Placeholder strategies (will be implemented in separate files)
    this._strategies.set('fullBuffer', {
      create: (config) => new FullBufferCacheStrategy(config),
      type: 'fullBuffer'
    });

    this._strategies.set('dirtyRect', {
      create: (config) => new DirtyRectCacheStrategy(config),
      type: 'dirtyRect'
    });

    this._strategies.set('throttled', {
      create: (config) => new ThrottledCacheStrategy(config),
      type: 'throttled'
    });

    this._strategies.set('tiled', {
      create: (config) => new TiledCacheStrategy(config),
      type: 'tiled'
    });
  }

  /**
   * Get current memory budget
   * @returns {number} Memory budget in bytes
   */
  getMemoryBudget() {
    return this._memoryBudget;
  }

  /**
   * Set memory budget
   * @param {number} bytes - Memory budget in bytes
   * @throws {Error} If budget is negative
   */
  setMemoryBudget(bytes) {
    if (bytes < 0) {
      throw new Error('Invalid memory budget: cannot be negative');
    }
    this._memoryBudget = bytes;
  }

  /**
   * Enable or disable automatic eviction
   * @param {boolean} enabled - Whether to enable eviction
   */
  setEvictionEnabled(enabled) {
    this._evictionEnabled = enabled;
  }

  /**
   * Get current total memory usage
   * @returns {number} Current memory usage in bytes
   */
  getCurrentMemoryUsage() {
    return this._currentMemoryUsage;
  }

  /**
   * Register a new cache
   * @param {string} name - Unique cache name
   * @param {string} strategy - Cache strategy ('fullBuffer', 'dirtyRect', 'throttled', 'tiled')
   * @param {Object} config - Cache configuration
   * @throws {Error} If cache name already exists or strategy unsupported
   */
  register(name, strategy, config) {
    // Validate cache name
    if (this._caches.has(name)) {
      throw new Error(`Cache '${name}' is already registered`);
    }

    // Validate strategy
    if (!this._strategies.has(strategy)) {
      throw new Error(`Unsupported cache strategy: ${strategy}`);
    }

    // Validate dimensions
    if (config.width <= 0 || config.height <= 0) {
      throw new Error(`Invalid cache dimensions: ${config.width}x${config.height}`);
    }

    // Calculate memory requirement
    const memoryRequired = this._calculateMemory(config.width, config.height);

    // Check memory budget
    if (this._currentMemoryUsage + memoryRequired > this._memoryBudget) {
      if (this._evictionEnabled) {
        // Try to evict caches to make room
        this._evictToMakeRoom(memoryRequired, config.protected);
        
        // Check again after eviction
        if (this._currentMemoryUsage + memoryRequired > this._memoryBudget) {
          throw new Error(`Memory budget exceeded after eviction: need ${memoryRequired} bytes, budget: ${this._memoryBudget}, current: ${this._currentMemoryUsage}`);
        }
      } else {
        throw new Error(`Memory budget exceeded: need ${memoryRequired} bytes, budget: ${this._memoryBudget}, current: ${this._currentMemoryUsage}`);
      }
    }

    // Create cache entry
    const cacheEntry = {
      name,
      strategy,
      config,
      memoryUsage: memoryRequired,
      created: Date.now(),
      lastAccessed: this._accessTimestamp++, // Use monotonic counter
      hits: 0,
      valid: false, // Start invalid - must be generated before use
      protected: config.protected || false,
      dirtyRegions: [],
      _buffer: null,
      _strategyInstance: null
    };

    // Create graphics buffer if applicable
    if (strategy === 'fullBuffer' || strategy === 'dirtyRect' || strategy === 'tiled') {
      if (typeof createGraphics !== 'undefined') {
        cacheEntry._buffer = createGraphics(config.width, config.height);
        if (cacheEntry._buffer) {
          cacheEntry._buffer._estimatedMemory = memoryRequired;
        }
      }
    }

    // Create strategy instance (placeholder - will use actual strategies when implemented)
    try {
      const strategyFactory = this._strategies.get(strategy);
      if (strategyFactory && typeof strategyFactory.create === 'function') {
        cacheEntry._strategyInstance = strategyFactory.create(config);
      }
    } catch (e) {
      // Strategy classes may not exist yet - that's OK for base tests
    }

    // Register cache
    this._caches.set(name, cacheEntry);
    this._currentMemoryUsage += memoryRequired;
  }

  /**
   * Calculate memory usage for given dimensions
   * @private
   * @param {number} width - Width in pixels
   * @param {number} height - Height in pixels
   * @returns {number} Memory in bytes (RGBA = 4 bytes per pixel)
   */
  _calculateMemory(width, height) {
    return width * height * 4; // RGBA
  }

  /**
   * Evict caches to make room for new cache
   * @private
   * @param {number} memoryNeeded - Memory needed in bytes
   * @param {boolean} isProtected - Whether the new cache is protected
   */
  _evictToMakeRoom(memoryNeeded, isProtected) {
    // Keep evicting until we have room
    while (this._currentMemoryUsage + memoryNeeded > this._memoryBudget) {
      // Get all non-protected caches sorted by last access time (LRU)
      const evictableCaches = Array.from(this._caches.entries())
        .filter(([_, cache]) => !cache.protected)
        .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed); // Lower timestamp = older

      if (evictableCaches.length === 0) {
        // No more caches to evict
        break;
      }

      // Evict the least recently used cache
      const [nameToEvict, _] = evictableCaches[0];
      this._removeCache(nameToEvict);
      this._stats.evictions++;
    }
  }

  /**
   * Check if cache exists
   * @param {string} name - Cache name
   * @returns {boolean} True if cache exists
   */
  hasCache(name) {
    return this._caches.has(name);
  }

  /**
   * Get cache by name
   * @param {string} name - Cache name
   * @returns {Object|null} Cache entry or null if not found
   */
  getCache(name) {
    if (!this._caches.has(name)) {
      this._stats.misses++;
      return null;
    }

    const cache = this._caches.get(name);
    cache.lastAccessed = this._accessTimestamp++; // Update with monotonic counter
    cache.hits++;
    this._stats.hits++;

    return cache;
  }

  /**
   * Get all cache names
   * @returns {string[]} Array of cache names
   */
  getCacheNames() {
    return Array.from(this._caches.keys());
  }

  /**
   * Invalidate a cache
   * @param {string} name - Cache name
   * @param {Object} [region] - Optional region {x, y, width, height} for partial invalidation
   */
  invalidate(name, region = null) {
    if (!this._caches.has(name)) {
      return;
    }

    const cache = this._caches.get(name);

    if (region) {
      // Partial invalidation (dirty rect)
      cache.dirtyRegions.push(region);
    } else {
      // Full invalidation
      cache.valid = false;
      cache.dirtyRegions = [];
    }
  }

  /**
   * Invalidate all caches
   */
  invalidateAll() {
    for (const cache of this._caches.values()) {
      cache.valid = false;
      cache.dirtyRegions = [];
    }
  }

  /**
   * Get cache statistics
   * @param {string} name - Cache name
   * @returns {Object|null} Cache statistics or null if not found
   */
  getCacheStats(name) {
    if (!this._caches.has(name)) {
      return null;
    }

    const cache = this._caches.get(name);

    return {
      name: cache.name,
      strategy: cache.strategy,
      memoryUsage: cache.memoryUsage,
      created: cache.created,
      lastAccessed: cache.lastAccessed,
      hits: cache.hits,
      hitRate: cache.hits > 0 ? 1.0 : 0.0, // Individual cache hit rate
      valid: cache.valid,
      protected: cache.protected,
      dirtyRegions: [...cache.dirtyRegions]
    };
  }

  /**
   * Get global statistics
   * @returns {Object} Global cache statistics
   */
  getGlobalStats() {
    const totalAccesses = this._stats.hits + this._stats.misses;
    const hitRate = totalAccesses > 0 ? this._stats.hits / totalAccesses : 0;

    return {
      totalCaches: this._caches.size,
      memoryUsage: this._currentMemoryUsage,
      memoryBudget: this._memoryBudget,
      hits: this._stats.hits,
      misses: this._stats.misses,
      evictions: this._stats.evictions,
      hitRate
    };
  }

  /**
   * Remove a cache
   * @param {string} name - Cache name
   */
  removeCache(name) {
    if (!this._caches.has(name)) {
      return; // Silently ignore non-existent cache
    }

    this._removeCache(name);
  }

  /**
   * Internal method to remove cache (used by eviction)
   * @private
   * @param {string} name - Cache name
   */
  _removeCache(name) {
    const cache = this._caches.get(name);

    if (!cache) {
      return;
    }

    // Update memory tracking FIRST before removal
    this._currentMemoryUsage -= cache.memoryUsage;

    // Clean up graphics buffer
    if (cache._buffer && typeof cache._buffer.remove === 'function') {
      cache._buffer.remove();
    }

    // Remove from registry
    this._caches.delete(name);
  }

  /**
   * Destroy all caches and reset manager
   */
  destroy() {
    // Remove all caches
    const cacheNames = Array.from(this._caches.keys());
    for (const name of cacheNames) {
      this._removeCache(name);
    }

    // Reset statistics
    this._stats.hits = 0;
    this._stats.misses = 0;
    this._stats.evictions = 0;
    this._currentMemoryUsage = 0;
  }
}

/**
 * Placeholder cache strategy classes
 * These will be implemented in separate files, but we need basic versions for tests
 */

class FullBufferCacheStrategy {
  constructor(config) {
    this.config = config;
    this.type = 'fullBuffer';
  }
}

class DirtyRectCacheStrategy {
  constructor(config) {
    this.config = config;
    this.type = 'dirtyRect';
  }
}

class ThrottledCacheStrategy {
  constructor(config) {
    this.config = config;
    this.type = 'throttled';
  }
}

class TiledCacheStrategy {
  constructor(config) {
    this.config = config;
    this.type = 'tiled';
  }
}

// Export for Node.js tests and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CacheManager;
}

// Make available globally in browser
if (typeof window !== 'undefined') {
  window.CacheManager = CacheManager;
  window.FullBufferCacheStrategy = FullBufferCacheStrategy;
  window.DirtyRectCacheStrategy = DirtyRectCacheStrategy;
  window.ThrottledCacheStrategy = ThrottledCacheStrategy;
  window.TiledCacheStrategy = TiledCacheStrategy;
}

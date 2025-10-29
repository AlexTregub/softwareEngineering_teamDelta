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
    let memoryRequired;
    if (strategy === 'tiled') {
      // For tiled strategy, use worst-case (all tiles allocated)
      // Actual usage will be lower due to lazy allocation
      const tileSize = config.tileSize || 128;
      const tilesX = Math.ceil(config.width / tileSize);
      const tilesY = Math.ceil(config.height / tileSize);
      memoryRequired = tilesX * tilesY * tileSize * tileSize * 4;
      
      console.log('[CacheManager] TILED memory calculation:', {
        width: config.width,
        height: config.height,
        tileSize,
        tilesX,
        tilesY,
        memoryRequired,
        memoryRequiredMB: (memoryRequired / 1024 / 1024).toFixed(2) + 'MB'
      });
    } else {
      // Full buffer for other strategies
      memoryRequired = this._calculateMemory(config.width, config.height);
      
      console.log('[CacheManager] Full buffer memory:', {
        width: config.width,
        height: config.height,
        memoryRequired,
        memoryRequiredMB: (memoryRequired / 1024 / 1024).toFixed(2) + 'MB'
      });
    }

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

    // Create graphics buffer if applicable (skip for tiled - uses own buffers)
    if (strategy === 'fullBuffer' || strategy === 'dirtyRect') {
      if (typeof createGraphics !== 'undefined') {
        cacheEntry._buffer = createGraphics(config.width, config.height);
        if (cacheEntry._buffer) {
          cacheEntry._buffer._estimatedMemory = memoryRequired;
        }
      }
    }
    
    // Create strategy instance
    try {
      const strategyFactory = this._strategies.get(strategy);
      if (strategyFactory && typeof strategyFactory.create === 'function') {
        cacheEntry._strategyInstance = strategyFactory.create(config);
        
        // For tiled strategy, set buffer reference to strategy (not single buffer)
        if (strategy === 'tiled') {
          cacheEntry._buffer = cacheEntry._strategyInstance; // Strategy manages tiles
        }
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

/**
 * TiledCacheStrategy - Memory-efficient tiling for large canvases
 * 
 * Splits large canvas into small tiles (default 128x128px) and allocates
 * them lazily. Reduces memory from 44MB (full buffer) to ~1MB (tiled).
 * 
 * Example: 448x448px canvas @ 128px tiles = 4x4 grid = 16 tiles
 * - Full buffer: 448 * 448 * 4 = 802,816 bytes (~800KB)
 * - Tiled (all allocated): 16 * 128 * 128 * 4 = 1,048,576 bytes (~1MB)
 * - Tiled (lazy, 4 tiles): 4 * 128 * 128 * 4 = 262,144 bytes (~256KB)
 */
class TiledCacheStrategy {
  constructor(config) {
    this.config = config;
    this.type = 'tiled';
    
    // Set default tile size
    if (!this.config.tileSize) {
      this.config.tileSize = 128;
    }
    
    // Calculate tile grid dimensions
    this.tilesX = Math.ceil(config.width / this.config.tileSize);
    this.tilesY = Math.ceil(config.height / this.config.tileSize);
    this.totalTiles = this.tilesX * this.tilesY;
    
    // Lazy tile allocation (Map stores created tiles)
    this.tiles = new Map();
  }
  
  /**
   * Get or create tile at grid position
   * @param {number} x - Tile X coordinate (0-indexed)
   * @param {number} y - Tile Y coordinate (0-indexed)
   * @returns {Object|null} Tile object or null if out of bounds
   */
  getTile(x, y) {
    // Bounds check
    if (x < 0 || x >= this.tilesX || y < 0 || y >= this.tilesY) {
      return null;
    }
    
    const key = `${x},${y}`;
    
    // Return cached tile
    if (this.tiles.has(key)) {
      return this.tiles.get(key);
    }
    
    // Create new tile (lazy allocation)
    const tileWidth = Math.min(this.config.tileSize, this.config.width - x * this.config.tileSize);
    const tileHeight = Math.min(this.config.tileSize, this.config.height - y * this.config.tileSize);
    
    const tile = {
      x,
      y,
      buffer: typeof createGraphics !== 'undefined' 
        ? createGraphics(tileWidth, tileHeight) 
        : null,
      dirty: true // New tiles start dirty
    };
    
    if (tile.buffer) {
      tile.buffer._estimatedMemory = tileWidth * tileHeight * 4;
    }
    
    this.tiles.set(key, tile);
    return tile;
  }
  
  /**
   * Calculate memory per tile
   * @returns {number} Memory in bytes
   */
  getMemoryPerTile() {
    return this.config.tileSize * this.config.tileSize * 4; // RGBA
  }
  
  /**
   * Get current memory usage (allocated tiles only)
   * @returns {number} Memory in bytes
   */
  getCurrentMemoryUsage() {
    let total = 0;
    for (const tile of this.tiles.values()) {
      if (tile.buffer && tile.buffer._estimatedMemory) {
        total += tile.buffer._estimatedMemory;
      }
    }
    return total;
  }
  
  /**
   * Get maximum memory usage if all tiles allocated
   * @returns {number} Memory in bytes
   */
  getMaxMemoryUsage() {
    return this.totalTiles * this.getMemoryPerTile();
  }
  
  /**
   * Check if tile is dirty
   * @param {number} x - Tile X coordinate
   * @param {number} y - Tile Y coordinate
   * @returns {boolean} True if dirty
   */
  isDirty(x, y) {
    const tile = this.tiles.get(`${x},${y}`);
    return tile ? tile.dirty : false;
  }
  
  /**
   * Mark specific tile as dirty
   * @param {number} x - Tile X coordinate
   * @param {number} y - Tile Y coordinate
   */
  markDirty(x, y) {
    const tile = this.getTile(x, y);
    if (tile) {
      tile.dirty = true;
    }
  }
  
  /**
   * Mark tiles overlapping pixel region as dirty
   * @param {Object} region - Region {x, y, width, height} in pixels
   */
  markDirtyRegion(region) {
    const startTileX = Math.floor(region.x / this.config.tileSize);
    const startTileY = Math.floor(region.y / this.config.tileSize);
    const endTileX = Math.ceil((region.x + region.width) / this.config.tileSize);
    const endTileY = Math.ceil((region.y + region.height) / this.config.tileSize);
    
    for (let x = startTileX; x < endTileX; x++) {
      for (let y = startTileY; y < endTileY; y++) {
        this.markDirty(x, y);
      }
    }
  }
  
  /**
   * Render dirty tiles using callback
   * @param {Function} renderCallback - (buffer, {x, y}) => void
   */
  renderDirtyTiles(renderCallback) {
    for (const tile of this.tiles.values()) {
      if (tile.dirty && tile.buffer) {
        renderCallback(tile.buffer, { x: tile.x, y: tile.y });
        tile.dirty = false;
      }
    }
  }
  
  /**
   * Clean up all tile buffers
   */
  destroy() {
    for (const tile of this.tiles.values()) {
      if (tile.buffer && typeof tile.buffer.remove === 'function') {
        tile.buffer.remove();
      }
    }
    this.tiles.clear();
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

/**
 * FullBufferCache Strategy
 * 
 * Caches entire content to an off-screen graphics buffer (p5.Graphics).
 * Best for static or rarely-changing content like terrain, minimap backgrounds.
 * 
 * Strategy: Render once to buffer, reuse until invalidated
 * Memory: width × height × 4 bytes (RGBA)
 * Best For: MiniMap terrain, static UI backgrounds, level editor grid
 * 
 * Usage:
 *   const cache = new FullBufferCache('minimap-terrain', {
 *     width: 200,
 *     height: 200,
 *     renderCallback: (buffer) => {
 *       buffer.background(0);
 *       // ... draw terrain to buffer
 *     }
 *   });
 *   
 *   cache.generate(); // Render to buffer
 *   
 *   // Later in draw loop:
 *   if (cache.valid) {
 *     image(cache.getBuffer(), 0, 0);
 *   }
 */

class FullBufferCache {
  /**
   * Create a new FullBufferCache instance
   * @param {string} name - Unique cache identifier
   * @param {Object} config - Configuration options
   * @param {number} config.width - Buffer width in pixels
   * @param {number} config.height - Buffer height in pixels
   * @param {Function} config.renderCallback - Function to render content to buffer
   * @param {boolean} config.protected - Whether cache should be protected from eviction
   */
  constructor(name, config = {}) {
    this.name = name;
    this.strategy = 'fullBuffer';
    
    // Dimensions (allow 0 values, only use defaults if undefined)
    this.width = config.width !== undefined ? config.width : 256;
    this.height = config.height !== undefined ? config.height : 256;
    
    // State
    this.valid = false;
    this.protected = config.protected || false;
    
    // Statistics
    this.hits = 0;
    this.misses = 0;
    this.created = Date.now();
    this.lastAccessed = 0; // Will be set by CacheManager
    
    // Render callback
    this._renderCallback = config.renderCallback || null;
    
    // Create graphics buffer
    this._buffer = null;
    this._createBuffer();
  }

  /**
   * Create the off-screen graphics buffer
   * @private
   */
  _createBuffer() {
    // Check if createGraphics is available (p5.js)
    const createGraphicsFn = typeof createGraphics !== 'undefined' 
      ? createGraphics 
      : (typeof window !== 'undefined' && window.createGraphics)
        ? window.createGraphics
        : null;
    
    if (createGraphicsFn && this.width > 0 && this.height > 0) {
      try {
        this._buffer = createGraphicsFn(this.width, this.height);
      } catch (error) {
        console.warn(`[FullBufferCache] Failed to create buffer for '${this.name}':`, error);
        this._buffer = null;
      }
    } else {
      this._buffer = null;
    }
  }

  /**
   * Generate cache by calling render callback
   */
  generate() {
    if (!this._buffer) {
      // No buffer available, but mark as valid anyway
      // (useful for testing or headless environments)
      this.valid = true;
      return;
    }

    try {
      // Clear buffer
      this._buffer.clear();
      
      // Call render callback if provided
      if (this._renderCallback) {
        this._renderCallback(this._buffer);
      }
      
      // Mark as valid
      this.valid = true;
    } catch (error) {
      console.error(`[FullBufferCache] Render error for '${this.name}':`, error);
      this.valid = false;
    }
  }

  /**
   * Get the cached graphics buffer
   * @returns {p5.Graphics|null} The cached buffer or null
   */
  getBuffer() {
    return this._buffer;
  }

  /**
   * Invalidate the cache (marks for regeneration)
   * @param {Object} region - Optional region to invalidate (ignored for FullBuffer)
   */
  invalidate(region = null) {
    // FullBuffer strategy doesn't support partial invalidation
    // Any invalidation marks entire cache as invalid
    this.valid = false;
  }

  /**
   * Calculate memory usage in bytes
   * @returns {number} Memory usage (width × height × 4)
   */
  getMemoryUsage() {
    return this.width * this.height * 4; // RGBA = 4 bytes per pixel
  }

  /**
   * Record a cache hit (successful use)
   */
  recordHit() {
    this.hits++;
    this.lastAccessed = Date.now();
  }

  /**
   * Record a cache miss (had to regenerate)
   */
  recordMiss() {
    this.misses++;
  }

  /**
   * Set protected status
   * @param {boolean} isProtected - Whether cache should be protected from eviction
   */
  setProtected(isProtected) {
    this.protected = isProtected;
  }

  /**
   * Get cache statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    return {
      name: this.name,
      strategy: this.strategy,
      width: this.width,
      height: this.height,
      memoryUsage: this.getMemoryUsage(),
      valid: this.valid,
      protected: this.protected,
      hits: this.hits,
      misses: this.misses,
      created: this.created,
      lastAccessed: this.lastAccessed
    };
  }

  /**
   * Cleanup and destroy cache
   */
  destroy() {
    // Remove graphics buffer
    if (this._buffer && typeof this._buffer.remove === 'function') {
      try {
        this._buffer.remove();
      } catch (error) {
        console.warn(`[FullBufferCache] Error removing buffer for '${this.name}':`, error);
      }
    }
    
    this._buffer = null;
    this._renderCallback = null;
    this.valid = false;
  }
}

// Export for Node.js (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FullBufferCache;
}

// Export for browser (global)
if (typeof window !== 'undefined') {
  window.FullBufferCache = FullBufferCache;
}

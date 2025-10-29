/**
 * UIObject - Base class for UI components with integrated CacheManager support
 * 
 * Provides:
 * - Automatic cache registration/cleanup
 * - Render-to-cache pattern with dirty tracking
 * - Common UI properties (position, size, visibility)
 * - Template method pattern for rendering
 * - Memory-safe destruction
 * 
 * Usage:
 * ```javascript
 * class MyComponent extends UIObject {
 *   constructor(config) {
 *     super(config);
 *   }
 *   
 *   renderToCache(buffer) {
 *     // Render component to buffer (called when dirty)
 *     buffer.background(255);
 *   }
 * }
 * ```
 * 
 * @class UIObject
 */
class UIObject {
    /**
     * Create a UI object
     * @param {Object} config - Configuration object
     * @param {number} [config.width=100] - Width in pixels
     * @param {number} [config.height=100] - Height in pixels
     * @param {number} [config.x=0] - Position X
     * @param {number} [config.y=0] - Position Y
     * @param {string} [config.cacheStrategy='fullBuffer'] - Cache strategy ('fullBuffer', 'dirtyRect', 'throttled', 'tiled', 'none')
     * @param {number} [config.tileSize=128] - Tile size for 'tiled' strategy (pixels)
     * @param {boolean} [config.protected=false] - Protect cache from eviction
     * @param {boolean} [config.visible=true] - Initial visibility
     */
    constructor(config = {}) {
        // Common UI properties
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.width = config.width || 100;
        this.height = config.height || 100;
        this.visible = config.visible !== false; // Default true
        
        // Cache settings
        this._cacheStrategy = config.cacheStrategy || 'fullBuffer';
        this._cacheTileSize = config.tileSize || 128; // For tiled strategy
        this._cacheEnabled = this._cacheStrategy !== 'none';
        this._cacheProtected = config.protected || false;
        
        // Generate unique cache name (includes class name for debugging)
        this._cacheName = `${this.constructor.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Cache reference
        this._cache = null;
        
        // Dirty tracking
        this._isDirty = true; // Start dirty - must render once
        
        // Initialize cache if enabled
        if (this._cacheEnabled) {
            this._initializeCache();
        }
    }
    
    /**
     * Initialize cache with CacheManager
     * @private
     */
    _initializeCache() {
        // Check if CacheManager available
        if (typeof CacheManager === 'undefined') {
            console.warn(`[${this.constructor.name}] CacheManager not available - caching disabled`);
            this._cacheEnabled = false;
            return;
        }
        
        try {
            const manager = CacheManager.getInstance();
            
            // Build cache config
            const cacheConfig = {
                width: this.width,
                height: this.height,
                protected: this._cacheProtected
            };
            
            // Add tileSize for tiled strategy
            if (this._cacheStrategy === 'tiled' && this._cacheTileSize) {
                cacheConfig.tileSize = this._cacheTileSize;
            }
            
            // Register cache with CacheManager
            manager.register(this._cacheName, this._cacheStrategy, cacheConfig);
            
            // Get cache reference
            this._cache = manager.getCache(this._cacheName);
            
        } catch (error) {
            console.error(`[${this.constructor.name}] Cache initialization failed:`, error);
            this._cacheEnabled = false;
            this._cache = null;
        }
    }
    
    /**
     * Mark cache as dirty (needs re-render)
     * @param {Object} [region] - Optional dirty region {x, y, width, height}
     */
    markDirty(region = null) {
        this._isDirty = true;
        
        // Invalidate cache in CacheManager
        if (this._cacheEnabled && this._cache) {
            try {
                const manager = CacheManager.getInstance();
                manager.invalidate(this._cacheName, region);
            } catch (error) {
                // Silently handle - cache may not exist
            }
        }
    }
    
    /**
     * Check if cache is dirty
     * @returns {boolean} True if needs re-render
     */
    isDirty() {
        return this._isDirty;
    }
    
    /**
     * Get cache buffer for rendering
     * @returns {p5.Graphics|null} Cache buffer or null if caching disabled
     */
    getCacheBuffer() {
        if (!this._cacheEnabled || !this._cache) {
            return null;
        }
        return this._cache._buffer || null;
    }
    
    /**
     * Render content to cache buffer
     * SUBCLASSES: MUST override this method
     * @param {p5.Graphics} buffer - Graphics buffer to render to
     * @throws {Error} If not implemented by subclass
     */
    renderToCache(buffer) {
        throw new Error(`${this.constructor.name} must implement renderToCache(buffer)`);
    }
    
    /**
     * Update UI state (called every frame)
     * SUBCLASSES: Override to add custom update logic
     */
    update() {
        // Base implementation does nothing
        // Subclasses override for custom logic
    }
    
    /**
     * Render UI (called every frame)
     * PATTERN: Check visibility → check dirty → render to cache → draw to screen
     */
    render() {
        // Skip if not visible
        if (!this.visible) {
            return;
        }
        
        // If cache enabled and dirty, render to cache
        if (this._cacheEnabled && this._isDirty) {
            const buffer = this.getCacheBuffer();
            if (buffer) {
                try {
                    this.renderToCache(buffer);
                    this._isDirty = false; // Clear dirty flag after successful render
                } catch (error) {
                    console.error(`[${this.constructor.name}] renderToCache failed:`, error);
                }
            }
        }
        
        // Draw to screen
        this.renderToScreen();
    }
    
    /**
     * Render to screen (draw cached content or direct render)
     * SUBCLASSES: Override for custom screen rendering
     */
    renderToScreen() {
        const buffer = this.getCacheBuffer();
        
        if (buffer) {
            // Draw cached buffer to screen
            if (typeof image !== 'undefined') {
                image(buffer, this.x, this.y);
            }
        } else {
            // No cache - use direct render fallback
            if (typeof push !== 'undefined' && typeof pop !== 'undefined') {
                push();
                if (typeof translate !== 'undefined') {
                    translate(this.x, this.y);
                }
                this.renderDirect();
                pop();
            }
        }
    }
    
    /**
     * Direct render (no cache) - fallback
     * SUBCLASSES: Override if cache not available
     */
    renderDirect() {
        // Default: do nothing (subclasses implement)
    }
    
    /**
     * Set visibility
     * @param {boolean} visible - Visibility state
     */
    setVisible(visible) {
        this.visible = visible;
    }
    
    /**
     * Get visibility
     * @returns {boolean} Current visibility
     */
    isVisible() {
        return this.visible;
    }
    
    /**
     * Cleanup and destroy UI object
     * IMPORTANT: Always call when removing UI element to prevent memory leaks
     */
    destroy() {
        // Remove cache from CacheManager
        if (this._cacheEnabled && this._cache) {
            try {
                const manager = CacheManager.getInstance();
                manager.removeCache(this._cacheName);
            } catch (error) {
                // Silently handle - CacheManager may not be available
            }
        }
        
        // Nullify references
        this._cache = null;
        this._cacheEnabled = false;
    }
}

// Export for Node.js tests and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIObject;
}

// Make available globally in browser
if (typeof window !== 'undefined') {
    window.UIObject = UIObject;
}

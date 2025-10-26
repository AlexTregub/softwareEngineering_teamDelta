/**
 * MiniMap - UI component for terrain overview and navigation
 * 
 * Provides a miniaturized view of the terrain with:
 * - Scaled terrain rendering (CACHED for performance)
 * - Camera viewport indicator
 * - Click-to-navigate functionality
 * - Real-time updates
 * 
 * Performance: Uses FullBufferCache to avoid re-rendering terrain every frame.
 * With 100x100 terrain: ~10,000 tiles rendered ONCE to buffer, then reused.
 */
class MiniMap {
    /**
     * Create a mini map
     * @param {Object} terrain - Terrain data with getArrPos method
     * @param {number} width - Mini map width in pixels
     * @param {number} height - Mini map height in pixels
     */
    constructor(terrain, width, height) {
        this.terrain = terrain;
        this.width = width;
        this.height = height;
        this.updateInterval = 100; // ms between updates
        this.lastUpdate = 0;
        
        // Calculate scale based on terrain size
        // Support both CustomTerrain and gridTerrain
        this.terrainWidth = terrain.width ? terrain.width * (terrain.tileSize || 32) : terrain.gridSize || 800;
        this.terrainHeight = terrain.height ? terrain.height * (terrain.tileSize || 32) : terrain.gridSize || 800;
        this.scale = Math.min(width / this.terrainWidth, height / this.terrainHeight);
        
        // Cache settings
        this._cacheEnabled = true;
        this._cacheName = `minimap-terrain-${Date.now()}`;
        this._cache = null;
        this._terrainGenerated = false;
        
        // Debounced invalidation settings
        this._invalidateDebounceDelay = 1000; // 1 second default
        this._invalidateTimer = null;
        
        // Register cache if CacheManager available
        this._initializeCache();
    }
    
    /**
     * Initialize terrain cache
     * @private
     */
    _initializeCache() {
        if (typeof CacheManager === 'undefined' || !this._cacheEnabled) {
            console.warn('[MiniMap] CacheManager not available or caching disabled');
            return;
        }
        
        try {
            const manager = CacheManager.getInstance();
            
            // Register cache with render callback
            manager.register(this._cacheName, 'fullBuffer', {
                width: this.width,
                height: this.height,
                renderCallback: (buffer) => this._renderTerrainToBuffer(buffer),
                protected: false // Allow eviction if memory constrained
            });
            
            this._cache = manager.getCache(this._cacheName);
            console.log(`[MiniMap] Cache registered: ${this._cacheName} (${this.width}x${this.height})`);
        } catch (error) {
            console.error('[MiniMap] Failed to initialize cache:', error);
            this._cacheEnabled = false;
        }
    }
    
    /**
     * Render terrain to cache buffer
     * @param {p5.Graphics} buffer - Graphics buffer to render to
     * @private
     */
    _renderTerrainToBuffer(buffer) {
        if (!buffer || !this.terrain) return;
        
        // Clear buffer
        buffer.background(20, 20, 20);
        
        // Draw terrain tiles
        if (this.terrain.getArrPos) {
            const tilesX = Math.ceil(this.width / this.scale);
            const tilesY = Math.ceil(this.height / this.scale);
            
            buffer.noStroke();
            for (let ty = 0; ty < tilesY; ty++) {
                for (let tx = 0; tx < tilesX; tx++) {
                    try {
                        const tile = this.terrain.getArrPos([tx, ty]);
                        if (tile && tile.getMaterial) {
                            const material = tile.getMaterial();
                            
                            // Simple material to color mapping
                            switch(material) {
                                case 'grass':
                                    buffer.fill(50, 150, 50);
                                    break;
                                case 'dirt':
                                    buffer.fill(120, 80, 40);
                                    break;
                                case 'stone':
                                    buffer.fill(100, 100, 100);
                                    break;
                                case 'moss':
                                case 'moss_1':
                                    buffer.fill(40, 120, 60);
                                    break;
                                default:
                                    buffer.fill(80, 80, 80);
                            }
                            
                            buffer.rect(tx * this.scale, ty * this.scale, this.scale, this.scale);
                        }
                    } catch (e) {
                        // Skip tiles that are out of bounds or undefined
                        continue;
                    }
                }
            }
        }
        
        this._terrainGenerated = true;
    }
    
    /**
     * Invalidate terrain cache (call when terrain changes)
     */
    invalidateCache() {
        // Cancel any pending scheduled invalidation
        this.cancelScheduledInvalidation();
        
        if (this._cache) {
            const manager = CacheManager.getInstance();
            manager.invalidate(this._cacheName);
            this._terrainGenerated = false;
            console.log(`[MiniMap] Cache invalidated: ${this._cacheName}`);
        }
    }
    
    /**
     * Schedule cache invalidation with debounce
     * Call this during terrain editing to defer invalidation until editing stops
     */
    scheduleInvalidation() {
        if (!this._cacheEnabled || !this._cache) {
            return;
        }
        
        // Clear existing timer
        if (this._invalidateTimer !== null) {
            clearTimeout(this._invalidateTimer);
        }
        
        // Schedule new invalidation
        this._invalidateTimer = setTimeout(() => {
            this.invalidateCache();
            this._invalidateTimer = null;
        }, this._invalidateDebounceDelay);
    }
    
    /**
     * Cancel scheduled invalidation
     */
    cancelScheduledInvalidation() {
        if (this._invalidateTimer !== null) {
            clearTimeout(this._invalidateTimer);
            this._invalidateTimer = null;
        }
    }
    
    /**
     * Set debounce delay for scheduled invalidation
     * @param {number} delay - Delay in milliseconds
     */
    setInvalidateDebounceDelay(delay) {
        this._invalidateDebounceDelay = delay;
    }
    
    /**
     * Notify that terrain editing has started
     * Schedules cache invalidation (debounced)
     */
    notifyTerrainEditStart() {
        this.scheduleInvalidation();
    }
    
    /**
     * Notify that terrain editing has ended
     * Schedules cache invalidation (debounced)
     */
    notifyTerrainEditEnd() {
        this.scheduleInvalidation();
    }
    
    /**
     * Enable/disable caching
     * @param {boolean} enabled - Whether to use caching
     */
    setCacheEnabled(enabled) {
        this._cacheEnabled = enabled;
        if (!enabled && this._cache) {
            // Remove cache if disabled
            const manager = CacheManager.getInstance();
            manager.removeCache(this._cacheName);
            this._cache = null;
        } else if (enabled && !this._cache) {
            // Re-initialize cache if enabled
            this._initializeCache();
        }
    }
    
    /**
     * Check if cache is valid
     * @returns {boolean} True if cache is valid and ready to use
     */
    isCacheValid() {
        return this._cache && this._cache.valid;
    }
    
    /**
     * Get scale factor
     * @returns {number} Scale (minimap pixels / terrain pixels)
     */
    getScale() {
        return this.scale;
    }
    
    /**
     * Get viewport rectangle based on camera
     * @param {Object} camera - Camera with x, y, width, height
     * @returns {Object} Viewport rectangle {x, y, width, height}
     */
    getViewportRect(camera = null) {
        if (!camera) {
            // Default viewport
            return {
                x: 0,
                y: 0,
                width: this.width * 0.25,
                height: this.height * 0.25
            };
        }
        
        return {
            x: camera.x * this.scale,
            y: camera.y * this.scale,
            width: camera.width * this.scale,
            height: camera.height * this.scale
        };
    }
    
    /**
     * Convert mini map click to world position
     * @param {number} miniMapX - Click X on mini map
     * @param {number} miniMapY - Click Y on mini map
     * @returns {Object} World position {x, y}
     */
    clickToWorldPosition(miniMapX, miniMapY) {
        return {
            x: miniMapX / this.scale,
            y: miniMapY / this.scale
        };
    }
    
    /**
     * Check if mini map should update
     * @param {number} currentTime - Current timestamp in ms
     * @returns {boolean} True if enough time has passed
     */
    shouldUpdate(currentTime) {
        if (currentTime - this.lastUpdate >= this.updateInterval) {
            this.lastUpdate = currentTime;
            return true;
        }
        return false;
    }
    
    /**
     * Set update interval
     * @param {number} interval - Interval in ms
     */
    setUpdateInterval(interval) {
        this.updateInterval = interval;
    }
    
    /**
     * Get terrain data at mini map coordinates
     * @param {number} miniMapX - X coordinate on mini map
     * @param {number} miniMapY - Y coordinate on mini map
     * @returns {string|null} Material at position
     */
    getTerrainAt(miniMapX, miniMapY) {
        const worldPos = this.clickToWorldPosition(miniMapX, miniMapY);
        
        if (this.terrain.getArrPos) {
            return this.terrain.getArrPos(worldPos.x, worldPos.y);
        }
        
        return null;
    }
    
    /**
     * Get mini map dimensions
     * @returns {Object} {width, height}
     */
    getDimensions() {
        return {
            width: this.width,
            height: this.height
        };
    }
    
    /**
     * World position to mini map coordinates
     * @param {number} worldX - World X
     * @param {number} worldY - World Y
     * @returns {Object} Mini map position {x, y}
     */
    worldToMiniMap(worldX, worldY) {
        return {
            x: worldX * this.scale,
            y: worldY * this.scale
        };
    }
    
    /**
     * Update mini map state
     * Called each frame to update any dynamic elements
     */
    update() {
        // Update timestamp for throttling
        const currentTime = Date.now();
        if (this.shouldUpdate(currentTime)) {
            // Perform periodic updates if needed
        }
    }
    
    /**
     * Render the mini map
     * @param {number} x - X position to render at
     * @param {number} y - Y position to render at
     */
    render(x, y) {
        if (typeof push === 'undefined') {
            // p5.js not available, skip rendering
            return;
        }
        
        push();
        translate(x, y);
        
        // Draw background border
        fill(20, 20, 20);
        stroke(100, 150, 255);
        strokeWeight(2);
        rect(0, 0, this.width, this.height);
        
        // Use cached terrain if available, otherwise render directly
        if (this._cacheEnabled && this._cache) {
            // Generate cache if not valid
            if (!this._cache.valid) {
                // Call the render callback to generate cache
                if (this._cache._buffer && this._cache.config && this._cache.config.renderCallback) {
                    console.log(`[MiniMap] Generating cache: ${this._cacheName} (${this.width}x${this.height})`);
                    this._cache.config.renderCallback(this._cache._buffer);
                    this._cache.valid = true;
                    this._cache.hits++;
                    console.log(`[MiniMap] Cache generated successfully`);
                } else {
                    console.warn(`[MiniMap] Cache generation failed - buffer:`, !!this._cache._buffer, 'callback:', !!this._cache.config?.renderCallback);
                    this._renderTerrainDirect();
                }
            }
            
            // Draw cached terrain buffer
            if (this._cache._buffer && this._cache.valid) {
                // Use CORNER mode for precise positioning
                imageMode(CORNER);
                image(this._cache._buffer, 0, 0);
                this._cache.hits++;
                this._cache.lastAccessed = Date.now();
            } else {
                // Fallback to direct rendering if buffer unavailable
                console.warn(`[MiniMap] Using fallback rendering - buffer:`, !!this._cache._buffer, 'valid:', this._cache.valid);
                this._renderTerrainDirect();
            }
        } else {
            // Direct rendering (no cache)
            this._renderTerrainDirect();
        }
        
        // Draw viewport indicator (NOT cached - updates every frame)
        if (typeof cameraManager !== 'undefined' && cameraManager && cameraManager.camera) {
            const viewport = this.getViewportRect({
                x: cameraManager.camera.x || 0,
                y: cameraManager.camera.y || 0,
                width: cameraManager.camera.viewportWidth || 800,
                height: cameraManager.camera.viewportHeight || 600
            });
            
            noFill();
            stroke(0, 255, 0); // Changed from yellow to green
            strokeWeight(2);
            rect(viewport.x, viewport.y, viewport.width, viewport.height);
        }
        
        // Draw label
        fill(255);
        noStroke();
        textAlign(CENTER, TOP);
        textSize(12);
        text('Mini Map', this.width / 2, this.height + 5);
        
        pop();
    }
    
    /**
     * Direct terrain rendering (fallback when cache unavailable)
     * @private
     */
    _renderTerrainDirect() {
        // Draw terrain tiles directly to screen
        if (this.terrain && this.terrain.getArrPos) {
            const tilesX = Math.ceil(this.width / this.scale);
            const tilesY = Math.ceil(this.height / this.scale);
            
            noStroke();
            for (let ty = 0; ty < tilesY; ty++) {
                for (let tx = 0; tx < tilesX; tx++) {
                    try {
                        const tile = this.terrain.getArrPos([tx, ty]);
                        if (tile && tile.getMaterial) {
                            const material = tile.getMaterial();
                            
                            // Simple material to color mapping
                            switch(material) {
                                case 'grass':
                                    fill(50, 150, 50);
                                    break;
                                case 'dirt':
                                    fill(120, 80, 40);
                                    break;
                                case 'stone':
                                    fill(100, 100, 100);
                                    break;
                                case 'moss':
                                case 'moss_1':
                                    fill(40, 120, 60);
                                    break;
                                default:
                                    fill(80, 80, 80);
                            }
                            
                            rect(tx * this.scale, ty * this.scale, this.scale, this.scale);
                        }
                    } catch (e) {
                        // Skip tiles that are out of bounds or undefined
                        continue;
                    }
                }
            }
        }
    }
    
    /**
     * Cleanup - remove cache and resources
     */
    destroy() {
        // Cancel any pending invalidation
        this.cancelScheduledInvalidation();
        
        if (this._cache) {
            const manager = CacheManager.getInstance();
            manager.removeCache(this._cacheName);
            this._cache = null;
            console.log(`[MiniMap] Cache removed: ${this._cacheName}`);
        }
    }
}

// Export for use in Node.js tests and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MiniMap;
}

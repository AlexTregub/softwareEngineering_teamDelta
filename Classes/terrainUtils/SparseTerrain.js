/**
 * SparseTerrain - Sparse tile storage system for lazy terrain loading
 * 
 * Architecture:
 * - Map<string, Tile> storage with key format "x,y"
 * - Dynamic bounds tracking (expands/shrinks with tile operations)
 * - Unbounded coordinates (supports negative values, very large values)
 * - Sparse JSON export (only painted tiles, not empty grid)
 * 
 * Phase: 1B of Lazy Terrain Loading Enhancement
 * Tests: test/unit/terrainUtils/SparseTerrain.test.js (48 tests)
 */

class SparseTerrain {
    /**
     * Create a sparse terrain storage system
     * @param {number} tileSize - Size of each tile in pixels (default: 32)
     * @param {*} defaultMaterial - Default material for new tiles (default: 0)
     * @param {Object} options - Optional configuration
     * @param {number} options.maxMapSize - Maximum canvas size (default: 100, min: 10, max: 1000)
     */
    constructor(tileSize = 32, defaultMaterial = 0, options = {}) {
        this.tiles = new Map(); // Map<"x,y", Tile> - PUBLIC for test access
        this.tileSize = tileSize;
        this.defaultMaterial = defaultMaterial;
        this.bounds = null; // { minX, maxX, minY, maxY } or null if empty - PUBLIC
        
        // Parse and validate maxMapSize from options
        let maxMapSize = 100; // Default: 100x100
        if (options && typeof options.maxMapSize !== 'undefined') {
            // Validate: must be number, min 10, max 1000
            const parsed = Number(options.maxMapSize);
            if (!isNaN(parsed)) {
                maxMapSize = Math.max(10, Math.min(1000, Math.floor(parsed)));
            }
        }
        
        this.MAX_MAP_SIZE = maxMapSize; // Configurable limit (default 100x100)
        
        // Compatibility properties for TerrainEditor
        this._tileSize = tileSize;
        this._gridSizeX = this.MAX_MAP_SIZE; // Grid size = MAX_MAP_SIZE
        this._gridSizeY = this.MAX_MAP_SIZE;
        this._chunkSize = 1; // No chunking in SparseTerrain
    }

    /**
     * Convert grid coordinates to Map key
     * @private
     * @param {number} x - Grid X coordinate
     * @param {number} y - Grid Y coordinate
     * @returns {string} Map key "x,y"
     */
    _coordsToKey(x, y) {
        return `${x},${y}`;
    }

    /**
     * Convert Map key to grid coordinates
     * @private
     * @param {string} key - Map key "x,y"
     * @returns {Array<number>} [x, y] grid coordinates
     */
    _keyToCoords(key) {
        const [x, y] = key.split(',').map(Number);
        return [x, y];
    }

    /**
     * Set a tile at grid coordinates
     * Creates a simple tile object { material }
     * Updates bounds to include the new tile
     * @param {number} x - Grid X coordinate
     * @param {number} y - Grid Y coordinate
     * @param {*} material - Material type (string, number, or object)
     * @returns {boolean} True if tile was set, false if rejected due to size limit
     */
    setTile(x, y, material) {
        // Calculate what the new bounds would be
        const newBounds = this._calculateNewBounds(x, y);
        
        // Check if new bounds exceed MAX_MAP_SIZE limit (1000x1000)
        if (newBounds) {
            const width = newBounds.maxX - newBounds.minX + 1;
            const height = newBounds.maxY - newBounds.minY + 1;
            
            if (width > this.MAX_MAP_SIZE || height > this.MAX_MAP_SIZE) {
                return false; // Reject tile - would exceed size limit
            }
        }
        
        const key = this._coordsToKey(x, y);
        
        // Create simple tile object with material property
        const tile = { material };
        
        this.tiles.set(key, tile);
        this._updateBoundsForTile(x, y);
        
        return true; // Success
    }
    
    /**
     * Calculate what the bounds would be if a tile was added
     * @private
     * @param {number} x - Grid X coordinate
     * @param {number} y - Grid Y coordinate
     * @returns {Object|null} New bounds { minX, maxX, minY, maxY } or null if first tile
     */
    _calculateNewBounds(x, y) {
        if (this.bounds === null) {
            // First tile - bounds would be just this tile
            return { minX: x, maxX: x, minY: y, maxY: y };
        }
        
        // Calculate expanded bounds
        return {
            minX: Math.min(this.bounds.minX, x),
            maxX: Math.max(this.bounds.maxX, x),
            minY: Math.min(this.bounds.minY, y),
            maxY: Math.max(this.bounds.maxY, y)
        };
    }

    /**
     * Get a tile at grid coordinates
     * @param {number} x - Grid X coordinate
     * @param {number} y - Grid Y coordinate
     * @returns {Object|null} Tile object { material } or null if not painted
     */
    getTile(x, y) {
        const key = this._coordsToKey(x, y);
        return this.tiles.get(key) || null;
    }

    /**
     * Delete a tile at grid coordinates
     * Recalculates bounds after deletion
     * @param {number} x - Grid X coordinate
     * @param {number} y - Grid Y coordinate
     * @returns {boolean} True if tile was deleted, false if it didn't exist
     */
    deleteTile(x, y) {
        const key = this._coordsToKey(x, y);
        const existed = this.tiles.has(key);
        
        if (existed) {
            this.tiles.delete(key);
            this._recalculateBounds();
        }
        
        return existed;
    }

    /**
     * Update bounds to include a new tile
     * @private
     * @param {number} x - Grid X coordinate
     * @param {number} y - Grid Y coordinate
     */
    _updateBoundsForTile(x, y) {
        if (this.bounds === null) {
            // First tile - initialize bounds
            this.bounds = { minX: x, maxX: x, minY: y, maxY: y };
        } else {
            // Expand bounds to include new tile
            this.bounds.minX = Math.min(this.bounds.minX, x);
            this.bounds.maxX = Math.max(this.bounds.maxX, x);
            this.bounds.minY = Math.min(this.bounds.minY, y);
            this.bounds.maxY = Math.max(this.bounds.maxY, y);
        }
    }

    /**
     * Recalculate bounds from all tiles
     * Used after tile deletion
     * @private
     */
    _recalculateBounds() {
        if (this.tiles.size === 0) {
            this.bounds = null;
            return;
        }

        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        for (const key of this.tiles.keys()) {
            const [x, y] = this._keyToCoords(key);
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
        }

        this.bounds = { minX, maxX, minY, maxY };
    }

    /**
     * Get current terrain bounds
     * @returns {Object|null} { minX, maxX, minY, maxY } or null if no tiles
     */
    getBounds() {
        return this.bounds;
    }

    /**
     * Get total number of painted tiles
     * @returns {number} Tile count
     */
    getTileCount() {
        return this.tiles.size;
    }

    /**
     * Check if terrain has any tiles
     * @returns {boolean} True if empty
     */
    isEmpty() {
        return this.tiles.size === 0;
    }

    /**
     * Clear all tiles
     */
    clear() {
        this.tiles.clear();
        this.bounds = null;
    }

    /**
     * Export terrain to JSON (sparse format - only painted tiles)
     * @returns {Object} JSON object with metadata and sparse tile data
     */
    exportToJSON() {
        const tiles = [];
        
        for (const [key, tile] of this.tiles.entries()) {
            const [x, y] = this._keyToCoords(key);
            tiles.push({
                x,
                y,
                material: tile.material
            });
        }

        return {
            version: '1.0',
            metadata: {
                tileSize: this.tileSize,
                defaultMaterial: this.defaultMaterial,
                maxMapSize: this.MAX_MAP_SIZE,
                bounds: this.bounds
            },
            tileCount: this.tiles.size,
            tiles
        };
    }

    /**
     * Import terrain from JSON
     * @param {Object|string} json - JSON object from exportToJSON() or JSON string
     */
    importFromJSON(json) {
        // Clear existing data
        this.clear();

        // Parse JSON string if provided
        const data = typeof json === 'string' ? JSON.parse(json) : json;

        // Support both old format and new format with metadata
        const metadata = data.metadata || data;
        
        // Restore metadata
        this.tileSize = metadata.tileSize || 32;
        this.defaultMaterial = metadata.defaultMaterial || 0;
        
        // Restore maxMapSize (default to 100 if not specified)
        const maxMapSize = metadata.maxMapSize || 100;
        this.MAX_MAP_SIZE = Math.max(10, Math.min(1000, maxMapSize));
        
        // Update compatibility properties
        this._tileSize = this.tileSize;
        this._gridSizeX = this.MAX_MAP_SIZE;
        this._gridSizeY = this.MAX_MAP_SIZE;

        // Restore tiles
        if (data.tiles && Array.isArray(data.tiles)) {
            for (const tileData of data.tiles) {
                this.setTile(tileData.x, tileData.y, tileData.material);
            }
        }

        // Bounds are recalculated automatically during setTile calls
    }

    /**
     * Get all tile coordinates (for iteration)
     * @returns {Array<Array<number>>} Array of [x, y] coordinate pairs
     */
    getAllCoordinates() {
        const coords = [];
        for (const key of this.tiles.keys()) {
            coords.push(this._keyToCoords(key));
        }
        return coords;
    }

    /**
     * Get all tiles with coordinates (for iteration)
     * @returns {Generator} Generator yielding { x, y, material } objects
     */
    *getAllTiles() {
        for (const [key, tile] of this.tiles.entries()) {
            const [x, y] = this._keyToCoords(key);
            yield {
                x,
                y,
                material: tile.material
            };
        }
    }

    /**
     * Iterate over all tiles with coordinates
     * @param {Function} callback - Function(tile, x, y) called for each tile
     */
    forEach(callback) {
        for (const [key, tile] of this.tiles.entries()) {
            const [x, y] = this._keyToCoords(key);
            callback(tile, x, y);
        }
    }

    // ============================================================================
    // COMPATIBILITY LAYER FOR TERRAINEDITOR
    // ============================================================================

    /**
     * Get tile object at array position (TerrainEditor compatibility)
     * 
     * TerrainEditor expects:
     * - getArrPos([x, y]) returns tile object
     * - Tile object has getMaterial(), setMaterial(material), assignWeight()
     * 
     * @param {Array<number>} pos - Position array [x, y]
     * @returns {Object} Tile wrapper object with TerrainEditor interface
     */
    getArrPos(pos) {
        if (!Array.isArray(pos) || pos.length !== 2) {
            throw new Error('getArrPos requires array [x, y] with exactly 2 elements');
        }

        const [x, y] = pos;
        const terrain = this; // Closure reference

        // Return tile wrapper object with TerrainEditor interface
        return {
            getMaterial() {
                const tile = terrain.getTile(x, y);
                return tile ? tile.material : terrain.defaultMaterial;
            },

            setMaterial(material) {
                terrain.setTile(x, y, material);
            },

            assignWeight() {
                // No-op for compatibility (SparseTerrain doesn't use weights)
                // TerrainEditor calls this after painting, but we don't need it
            }
        };
    }

    /**
     * Invalidate cache (TerrainEditor compatibility)
     * 
     * TerrainEditor calls this after making changes.
     * SparseTerrain doesn't have a cache, so this is a no-op.
     */
    invalidateCache() {
        // No-op for compatibility
        // SparseTerrain doesn't cache, so nothing to invalidate
    }

    /**
     * Render terrain tiles (Level Editor compatibility)
     * 
     * Only renders painted tiles (sparse rendering).
     * Uses TERRAIN_MATERIALS_RANGED for textures if available.
     */
    render() {
        if (typeof push === 'undefined') return;
        
        push();
        
        // CRITICAL: Set imageMode(CORNER) for correct tile positioning
        if (typeof imageMode !== 'undefined' && typeof CORNER !== 'undefined') {
            imageMode(CORNER);
        }
        
        // Only render painted tiles (sparse rendering)
        for (const [key, tile] of this.tiles.entries()) {
            const [x, y] = this._keyToCoords(key);
            const screenX = x * this.tileSize;
            const screenY = y * this.tileSize;
            
            // Use texture render functions from TERRAIN_MATERIALS_RANGED
            if (typeof TERRAIN_MATERIALS_RANGED !== 'undefined' && 
                TERRAIN_MATERIALS_RANGED[tile.material] &&
                typeof TERRAIN_MATERIALS_RANGED[tile.material][1] === 'function') {
                // Call the render function with screen position and tile size
                TERRAIN_MATERIALS_RANGED[tile.material][1](screenX, screenY, this.tileSize);
            } else {
                // Fallback to solid color if texture not available
                const color = this._getMaterialColor(tile.material);
                if (typeof fill !== 'undefined' && typeof rect !== 'undefined') {
                    fill(color[0], color[1], color[2]);
                    noStroke();
                    rect(screenX, screenY, this.tileSize, this.tileSize);
                }
            }
        }
        
        pop();
    }

    /**
     * Get color for material (for rendering fallback)
     * @private
     */
    _getMaterialColor(material) {
        const colors = {
            'grass': [50, 150, 50],
            'dirt': [120, 80, 40],
            'stone': [100, 100, 100],
            'moss': [40, 120, 60],
            'moss_1': [40, 120, 60],
            'sand': [210, 180, 140]
        };
        return colors[material] || [128, 128, 128];
    }
}

// Global export for browser and Node.js
if (typeof window !== 'undefined') {
    window.SparseTerrain = SparseTerrain;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SparseTerrain;
}

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
     */
    constructor(tileSize = 32, defaultMaterial = 0) {
        this.tiles = new Map(); // Map<"x,y", Tile> - PUBLIC for test access
        this.tileSize = tileSize;
        this.defaultMaterial = defaultMaterial;
        this.bounds = null; // { minX, maxX, minY, maxY } or null if empty - PUBLIC
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
     */
    setTile(x, y, material) {
        const key = this._coordsToKey(x, y);
        
        // Create simple tile object with material property
        const tile = { material };
        
        this.tiles.set(key, tile);
        this._updateBoundsForTile(x, y);
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
            tileSize: this.tileSize,
            defaultMaterial: this.defaultMaterial,
            bounds: this.bounds,
            tileCount: this.tiles.size,
            tiles
        };
    }

    /**
     * Import terrain from JSON
     * @param {Object} json - JSON object from exportToJSON()
     */
    importFromJSON(json) {
        // Clear existing data
        this.clear();

        // Restore metadata
        this.tileSize = json.tileSize || 32;
        this.defaultMaterial = json.defaultMaterial || 0;

        // Restore tiles
        if (json.tiles && Array.isArray(json.tiles)) {
            for (const tileData of json.tiles) {
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
}

// Global export for browser and Node.js
if (typeof window !== 'undefined') {
    window.SparseTerrain = SparseTerrain;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SparseTerrain;
}

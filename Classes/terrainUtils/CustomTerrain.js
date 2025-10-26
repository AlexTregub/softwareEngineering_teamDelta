/**
 * CustomTerrain - Simplified terrain system for the Level Editor
 * Unlike gridTerrain which uses chunks and complex coordinate systems,
 * this uses a simple 2D array for direct tile access and editing.
 */

class CustomTerrain {
    /**
     * Create a new custom terrain
     * @param {number} width - Width in tiles
     * @param {number} height - Height in tiles
     * @param {number} tileSize - Size of each tile in pixels
     * @param {string} defaultMaterial - Default material for all tiles
     */
    constructor(width, height, tileSize = 32, defaultMaterial = 'dirt') {
        this.width = width;
        this.height = height;
        this.tileSize = tileSize;
        this.defaultMaterial = defaultMaterial;
        
        // Compatibility with gridTerrain for TerrainEditor
        this._gridSizeX = 1; // CustomTerrain doesn't use chunks, treat as 1 chunk
        this._gridSizeY = 1;
        this._chunkSize = Math.max(width, height); // Entire terrain is "one chunk"
        
        // Initialize tiles as 2D array
        this.tiles = [];
        for (let y = 0; y < height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < width; x++) {
                this.tiles[y][x] = this._createTile(x, y, defaultMaterial);
            }
        }
    }

    /**
     * Create a tile object
     * @private
     */
    _createTile(x, y, material) {
        const terrain = this; // Capture terrain reference
        
        const tile = {
            x: x,
            y: y,
            material: material,
            weight: this._getMaterialWeight(material),
            passable: this._getMaterialPassable(material),
            
            // Methods for TerrainEditor compatibility
            getMaterial: function() {
                return this.material;
            },
            setMaterial: function(newMaterial) {
                this.material = newMaterial;
                this.weight = terrain._getMaterialWeight(newMaterial);
                this.passable = terrain._getMaterialPassable(newMaterial);
            },
            assignWeight: function() {
                // Weight already assigned in setMaterial
            }
        };
        
        return tile;
    }

    /**
     * Get material weight (for pathfinding)
     * @private
     */
    _getMaterialWeight(material) {
        const weights = {
            'grass': 1,
            'dirt': 2,
            'stone': 100,
            'moss': 2,
            'moss_1': 2
        };
        return weights[material] || 1;
    }

    /**
     * Get material passability
     * @private
     */
    _getMaterialPassable(material) {
        const impassable = ['stone'];
        return !impassable.includes(material);
    }

    /**
     * Get default material
     * @returns {string}
     */
    getDefaultMaterial() {
        return this.defaultMaterial;
    }

    /**
     * Get pixel width of terrain
     * @returns {number}
     */
    getPixelWidth() {
        return this.width * this.tileSize;
    }

    /**
     * Get pixel height of terrain
     * @returns {number}
     */
    getPixelHeight() {
        return this.height * this.tileSize;
    }

    /**
     * Get tile at coordinates
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {Object|null} Tile object or null if out of bounds
     */
    getTile(x, y) {
        if (!this.isInBounds(x, y)) {
            return null;
        }
        return this.tiles[y][x];
    }

    /**
     * Set tile material at coordinates
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {string} material - Material name
     * @param {Object} properties - Optional additional properties
     * @returns {boolean} True if successful
     */
    setTile(x, y, material, properties = {}) {
        if (!this.isInBounds(x, y)) {
            return false;
        }
        
        // Use the tile's setMaterial method if available
        const tile = this.tiles[y][x];
        if (tile.setMaterial) {
            tile.setMaterial(material);
        } else {
            tile.material = material;
            tile.weight = properties.weight !== undefined ? properties.weight : this._getMaterialWeight(material);
            tile.passable = properties.passable !== undefined ? properties.passable : this._getMaterialPassable(material);
        }
        
        // Override with custom properties if provided
        if (properties.weight !== undefined) {
            tile.weight = properties.weight;
        }
        if (properties.passable !== undefined) {
            tile.passable = properties.passable;
        }
        
        return true;
    }

    /**
     * Fill region with material
     * @param {string} material - Material to fill with
     * @param {number} startX - Start X (default 0)
     * @param {number} startY - Start Y (default 0)
     * @param {number} endX - End X (default width)
     * @param {number} endY - End Y (default height)
     */
    fill(material, startX = 0, startY = 0, endX = this.width, endY = this.height) {
        // Clip to bounds
        startX = Math.max(0, startX);
        startY = Math.max(0, startY);
        endX = Math.min(this.width, endX);
        endY = Math.min(this.height, endY);
        
        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                this.setTile(x, y, material);
            }
        }
    }

    /**
     * Clear entire terrain to default material
     * @param {string} material - Material to clear to (default: defaultMaterial)
     */
    clear(material = null) {
        const clearMaterial = material || this.defaultMaterial;
        this.fill(clearMaterial);
    }

    /**
     * Convert screen coordinates to tile coordinates
     * @param {number} screenX - Screen X position
     * @param {number} screenY - Screen Y position
     * @returns {Object} {x, y} tile coordinates
     */
    screenToTile(screenX, screenY) {
        return {
            x: Math.floor(screenX / this.tileSize),
            y: Math.floor(screenY / this.tileSize)
        };
    }

    /**
     * Convert tile coordinates to screen coordinates
     * @param {number} tileX - Tile X coordinate
     * @param {number} tileY - Tile Y coordinate
     * @returns {Object} {x, y} screen coordinates
     */
    tileToScreen(tileX, tileY) {
        return {
            x: tileX * this.tileSize,
            y: tileY * this.tileSize
        };
    }

    /**
     * Check if coordinates are in bounds
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean}
     */
    isInBounds(x, y) {
        return Number.isInteger(x) && Number.isInteger(y) &&
               x >= 0 && x < this.width &&
               y >= 0 && y < this.height;
    }

    /**
     * Get count of each material type
     * @returns {Object} Material counts {material: count}
     */
    getMaterialCount() {
        const counts = {};
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const material = this.tiles[y][x].material;
                counts[material] = (counts[material] || 0) + 1;
            }
        }
        return counts;
    }

    /**
     * Get diversity (number of unique materials)
     * @returns {number}
     */
    getDiversity() {
        return Object.keys(this.getMaterialCount()).length;
    }

    /**
     * Resize terrain (expand or shrink)
     * @param {number} newWidth - New width
     * @param {number} newHeight - New height
     */
    resize(newWidth, newHeight) {
        const newTiles = [];
        
        for (let y = 0; y < newHeight; y++) {
            newTiles[y] = [];
            for (let x = 0; x < newWidth; x++) {
                // Copy existing tile if in bounds, otherwise create new
                if (y < this.height && x < this.width) {
                    newTiles[y][x] = this.tiles[y][x];
                } else {
                    newTiles[y][x] = this._createTile(x, y, this.defaultMaterial);
                }
            }
        }
        
        this.tiles = newTiles;
        this.width = newWidth;
        this.height = newHeight;
    }

    /**
     * Clone terrain
     * @returns {CustomTerrain}
     */
    clone() {
        const clone = new CustomTerrain(this.width, this.height, this.tileSize, this.defaultMaterial);
        
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tile = this.tiles[y][x];
                clone.tiles[y][x] = {
                    x: tile.x,
                    y: tile.y,
                    material: tile.material,
                    weight: tile.weight,
                    passable: tile.passable
                };
            }
        }
        
        return clone;
    }

    /**
     * Serialize to JSON
     * @returns {Object}
     */
    toJSON() {
        const tilesArray = [];
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                tilesArray.push({
                    x: x,
                    y: y,
                    material: this.tiles[y][x].material,
                    weight: this.tiles[y][x].weight,
                    passable: this.tiles[y][x].passable
                });
            }
        }
        
        return {
            width: this.width,
            height: this.height,
            tileSize: this.tileSize,
            defaultMaterial: this.defaultMaterial,
            tiles: tilesArray
        };
    }

    /**
     * Deserialize from JSON
     * @param {Object} json - JSON object
     * @returns {CustomTerrain}
     */
    static fromJSON(json) {
        const terrain = new CustomTerrain(json.width, json.height, json.tileSize, json.defaultMaterial);
        
        for (const tileData of json.tiles) {
            terrain.setTile(tileData.x, tileData.y, tileData.material, {
                weight: tileData.weight,
                passable: tileData.passable
            });
        }
        
        return terrain;
    }

    /**
     * Render terrain (p5.js)
     * Compatible with existing render pipeline
     */
    render() {
        if (typeof push === 'undefined') return;
        
        push();
        
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tile = this.tiles[y][x];
                const screenPos = this.tileToScreen(x, y);
                
                // Use texture render functions from TERRAIN_MATERIALS_RANGED
                if (typeof TERRAIN_MATERIALS_RANGED !== 'undefined' && 
                    TERRAIN_MATERIALS_RANGED[tile.material] &&
                    typeof TERRAIN_MATERIALS_RANGED[tile.material][1] === 'function') {
                    // Call the render function with screen position and tile size
                    TERRAIN_MATERIALS_RANGED[tile.material][1](screenPos.x, screenPos.y, this.tileSize);
                } else {
                    // Fallback to solid color if texture not available
                    const color = this._getMaterialColor(tile.material);
                    fill(color[0], color[1], color[2]);
                    noStroke();
                    rect(screenPos.x, screenPos.y, this.tileSize, this.tileSize);
                }
            }
        }
        
        pop();
    }

    /**
     * Get color for material (for rendering)
     * @private
     */
    _getMaterialColor(material) {
        const colors = {
            'grass': [50, 150, 50],
            'dirt': [120, 80, 40],
            'stone': [100, 100, 100],
            'moss': [40, 120, 60],
            'moss_1': [40, 120, 60]
        };
        return colors[material] || [128, 128, 128];
    }

    /**
     * Compatibility method for TerrainEditor
     * Get tile using array position [x, y]
     */
    getArrPos(pos) {
        return this.getTile(pos[0], pos[1]);
    }

    /**
     * Compatibility method for TerrainEditor
     * Set tile using array position [x, y]
     */
    setArrPos(pos, material) {
        return this.setTile(pos[0], pos[1], material);
    }

    /**
     * Invalidate cache (compatibility with gridTerrain)
     * CustomTerrain doesn't use caching, so this is a no-op
     */
    invalidateCache() {
        // No-op for CustomTerrain (no caching)
    }
}

// Export for use in Node.js tests and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CustomTerrain;
}

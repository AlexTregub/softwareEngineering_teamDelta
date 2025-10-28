/**
 * DynamicGridOverlay - Dynamic grid rendering for lazy terrain loading
 * 
 * Renders grid lines ONLY at edge tiles (tiles with at least 1 empty neighbor)
 * and mouse hover location. This dramatically improves performance with large
 * painted areas by reducing grid line count by ~64% for interior-heavy grids.
 * 
 * Edge Detection: A tile is an "edge" if ANY of its 4 cardinal neighbors is empty.
 * Mouse Priority: Mouse hover region ALWAYS shows grid, regardless of edge status.
 * 
 * Phase: 2B of Lazy Terrain Loading Enhancement
 * Tests: test/unit/ui/DynamicGridOverlay*.test.js (111+ tests)
 */

class DynamicGridOverlay {
    /**
     * Create a dynamic grid overlay
     * @param {Object} terrain - SparseTerrain instance
     * @param {number} bufferSize - Tiles to extend grid beyond painted area (default: 2)
     */
    constructor(terrain, bufferSize = 2) {
        this.terrain = terrain;
        this.bufferSize = bufferSize;
        this.gridLines = [];
        this._lastBounds = null;
        this._lastMousePos = null;
        
        // Memoization cache for feathering calculations
        // Key: "x,y" -> Value: { opacity, nearestTile: {x,y} }
        this._featheringCache = new Map();
        this._nearestTileCache = new Map(); // Key: "x,y" -> Value: {x,y} or null
        
        // Grid line cache to avoid regeneration every frame
        // Cache key: hash of painted tile positions + mouse tile position
        // Last mouse tile: {x, y} in tile coordinates to detect tile transitions
        this._gridCache = {
            gridLines: [],
            cacheKey: null,
            lastMouseTile: null
        };
    }
    
    /**
     * Check if a tile is an edge tile (has at least one empty neighbor)
     * Edge tiles are rendered with grid, interior tiles (fully surrounded) are not.
     * 
     * @private
     * @param {number} tileX - Tile X coordinate
     * @param {number} tileY - Tile Y coordinate
     * @param {Set} paintedTilesSet - Set of "x,y" keys for O(1) lookup
     * @returns {boolean} True if tile has at least one empty neighbor
     */
    _isEdgeTile(tileX, tileY, paintedTilesSet) {
        // Check all 4 cardinal neighbors (N, S, E, W)
        const neighbors = [
            [tileX, tileY - 1], // North
            [tileX, tileY + 1], // South
            [tileX + 1, tileY], // East
            [tileX - 1, tileY]  // West
        ];
        
        // If ANY neighbor is empty, this is an edge tile
        for (const [nx, ny] of neighbors) {
            const key = `${nx},${ny}`;
            if (!paintedTilesSet.has(key)) {
                return true; // Found empty neighbor - this is an edge
            }
        }
        
        return false; // All neighbors painted - interior tile
    }

    /**
     * Clear feathering cache (call when tiles are added/deleted)
     * @private
     */
    _clearCache() {
        this._featheringCache.clear();
        this._nearestTileCache.clear();
    }
    
    /**
     * Generate cache key from painted tiles and mouse tile position
     * Key format: "tile1,tile2|mouseTileX,mouseTileY"
     * @private
     * @param {Array} paintedTiles - Array of {x, y} tile objects
     * @param {Object|null} mousePos - {x, y} in grid coordinates or null
     * @returns {string} Cache key
     */
    _generateCacheKey(paintedTiles, mousePos) {
        // Sort tiles to make key order-independent
        const tileHash = paintedTiles
            .map(t => `${t.x},${t.y}`)
            .sort()
            .join('|');
        
        // Convert mouse position to tile coordinates
        const mouseTile = mousePos ? `${Math.floor(mousePos.x)},${Math.floor(mousePos.y)}` : 'null';
        
        return `${tileHash}::${mouseTile}`;
    }
    
    /**
     * Check if grid cache should be invalidated
     * Invalidates if painted tiles changed OR mouse moved to different tile
     * @private
     * @param {string} newCacheKey - New cache key to compare
     * @param {Object|null} mousePos - Current mouse position {x, y} or null
     * @returns {boolean} True if cache should be invalidated
     */
    _shouldInvalidateCache(newCacheKey, mousePos) {
        // Always invalidate if cache key changed (tiles added/removed)
        if (newCacheKey !== this._gridCache.cacheKey) {
            return true;
        }
        
        // Check if mouse moved to different tile
        if (mousePos && this._gridCache.lastMouseTile) {
            const newMouseTile = {
                x: Math.floor(mousePos.x),
                y: Math.floor(mousePos.y)
            };
            
            const mouseMovedTile = newMouseTile.x !== this._gridCache.lastMouseTile.x ||
                                   newMouseTile.y !== this._gridCache.lastMouseTile.y;
            
            if (mouseMovedTile) {
                return true;
            }
        } else if (mousePos !== this._gridCache.lastMouseTile) {
            // One is null, other isn't
            return true;
        }
        
        return false;
    }
    
    /**
     * Check if cache should be invalidated
     * Invalidates when:
     * - Cache key changed (tiles added/removed)
     * - Mouse moved to different tile (not just pixel movement)
     * @private
     * @param {string} newCacheKey - New cache key
     * @param {Object|null} newMouseTile - {x, y} in tile coords or null
     * @returns {boolean} True if cache should be invalidated
     */
    _shouldInvalidateCache(newCacheKey, newMouseTile) {
        const { cacheKey, lastMouseTile } = this._gridCache;
        
        // No cache yet
        if (cacheKey === null) {
            return true;
        }
        
        // Tiles changed (added/removed)
        if (newCacheKey !== cacheKey) {
            return true;
        }
        
        // Mouse moved to different tile
        if (newMouseTile && lastMouseTile) {
            if (newMouseTile.x !== lastMouseTile.x || newMouseTile.y !== lastMouseTile.y) {
                return true;
            }
        } else if (newMouseTile !== lastMouseTile) {
            // One is null, other is not
            return true;
        }
        
        return false;
    }

    /**
     * Calculate grid region from EDGE TILES ONLY + mouse position
     * Edge tiles are tiles with at least one empty neighbor (not fully surrounded).
     * This reduces grid line count by ~64% for interior-heavy grids.
     * 
     * @param {Object|null} mousePos - { x, y } in grid coordinates or null
     * @returns {Object|null} { minX, maxX, minY, maxY } or null if no region
     */
    calculateGridRegion(mousePos) {
        const paintedTiles = Array.from(this.terrain.getAllTiles());
        
        // No tiles and no mouse = no grid
        if (paintedTiles.length === 0 && !mousePos) {
            return null;
        }
        
        let region = null;
        
        // Filter to edge tiles only (tiles with at least 1 empty neighbor)
        if (paintedTiles.length > 0) {
            // Build Set for O(1) tile lookups
            const paintedTilesSet = new Set(
                paintedTiles.map(t => `${t.x},${t.y}`)
            );
            
            // Filter to edge tiles only (NO FALLBACK to all tiles)
            const edgeTiles = paintedTiles.filter(t => 
                this._isEdgeTile(t.x, t.y, paintedTilesSet)
            );
            
            // Calculate bounds from edge tiles only
            if (edgeTiles.length > 0) {
                const xs = edgeTiles.map(t => t.x);
                const ys = edgeTiles.map(t => t.y);
                
                region = {
                    minX: Math.min(...xs) - this.bufferSize,
                    maxX: Math.max(...xs) + this.bufferSize,
                    minY: Math.min(...ys) - this.bufferSize,
                    maxY: Math.max(...ys) + this.bufferSize
                };
            }
        }
        
        // Add mouse hover region (ALWAYS shows grid, even if interior tile)
        if (mousePos) {
            const mouseRegion = {
                minX: mousePos.x - this.bufferSize,
                maxX: mousePos.x + this.bufferSize,
                minY: mousePos.y - this.bufferSize,
                maxY: mousePos.y + this.bufferSize
            };
            
            if (region) {
                // Merge with existing region
                region.minX = Math.min(region.minX, mouseRegion.minX);
                region.maxX = Math.max(region.maxX, mouseRegion.maxX);
                region.minY = Math.min(region.minY, mouseRegion.minY);
                region.maxY = Math.max(region.maxY, mouseRegion.maxY);
            } else {
                // Use mouse region only
                region = mouseRegion;
            }
        }
        
        return region;
    }

    /**
     * Calculate opacity feathering based on distance to nearest EDGE tile (not painted tile)
     * CRITICAL: Uses EDGE TILES ONLY to create "hole" effect in interior of large painted areas
     * Formula: Aggressive exponential falloff - ZERO opacity at 1.5 tiles from nearest edge
     * Uses memoization cache for performance
     * 
     * Design: Grid renders ONLY near edges. Interior tiles have opacity 0 and are SKIPPED entirely.
     * This creates a visual "hole" in the middle of large painted areas (5x5, 10x10, etc.)
     * 
     * @param {number} x - Grid X coordinate
     * @param {number} y - Grid Y coordinate
     * @param {Object|null} nearestEdgeTile - { x, y } or null to auto-find
     * @returns {number} Opacity from 0.0 to 1.0 (0 = skip rendering)
     */
    calculateFeathering(x, y, nearestEdgeTile = null) {
        const MIN_OPACITY = 0.0; // ZERO opacity for interior tiles - creates "hole" effect
        const FADE_DISTANCE = 1.5; // Distance at which grid becomes invisible
        
        // Check cache first (before tile check to reuse calculations)
        const key = `${x},${y}`;
        const cached = this._featheringCache.get(key);
        if (cached !== undefined) {
            return cached;
        }
        
        // Find nearest EDGE tile (NOT just any painted tile!)
        const nearestEdge = nearestEdgeTile || this._findNearestEdgeTile(x, y);
        
        // No edge tiles = use default opacity (for mouse hover)
        if (!nearestEdge) {
            return 0.5; // Medium opacity when no tiles painted
        }
        
        // Calculate distance to nearest EDGE tile
        const dx = x - nearestEdge.x;
        const dy = y - nearestEdge.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Apply aggressive feathering: exponential falloff to ZERO
        // At distance 0: opacity = 1.0 (at edge)
        // At distance 1.0: opacity = ~0.11 (from pow(1-1/1.5, 2))
        // At distance 1.5+: opacity = 0.0 (ZERO - creates "hole" effect)
        const normalizedDistance = distance / FADE_DISTANCE;
        const opacity = Math.pow(Math.max(0, 1.0 - normalizedDistance), 2);
        
        // Clamp to [0.0, 1.0] - NO minimum opacity (allows zero)
        const result = Math.max(MIN_OPACITY, Math.min(1.0, opacity));
        
        // Cache the result
        this._featheringCache.set(key, result);
        
        return result;
    }

    /**
     * Find nearest painted tile to a grid coordinate
     * Uses terrain's sparse storage for efficiency (iterate painted tiles only)
     * Uses memoization cache for performance
     * @private
     * @param {number} x - Grid X coordinate
     * @param {number} y - Grid Y coordinate
     * @returns {Object|null} { x, y } of nearest tile or null
     */
    _findNearestPaintedTile(x, y) {
        // Check cache first
        const key = `${x},${y}`;
        const cached = this._nearestTileCache.get(key);
        if (cached !== undefined) {
            return cached;
        }
        
        const terrainBounds = this.terrain.getBounds();
        if (!terrainBounds) {
            return null;
        }
        
        let nearestTile = null;
        let minDistance = Infinity;
        
        // Iterate ONLY painted tiles (efficient with sparse storage)
        if (this.terrain.getAllTiles) {
            for (const tileData of this.terrain.getAllTiles()) {
                const dx = x - tileData.x;
                const dy = y - tileData.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestTile = { x: tileData.x, y: tileData.y };
                }
            }
        }
        
        // Cache the result
        this._nearestTileCache.set(key, nearestTile);
        
        return nearestTile;
    }

    /**
     * Find nearest EDGE tile to given position
     * CRITICAL: Only considers tiles with at least one empty neighbor (edge tiles)
     * This is what creates the "hole" effect in interior of large painted areas
     * 
     * @private
     * @param {number} x - Grid X coordinate
     * @param {number} y - Grid Y coordinate
     * @returns {Object|null} { x, y } of nearest edge tile or null
     */
    _findNearestEdgeTile(x, y) {
        // Check cache first
        const key = `edge_${x},${y}`;
        const cached = this._nearestTileCache.get(key);
        if (cached !== undefined) {
            return cached;
        }
        
        const terrainBounds = this.terrain.getBounds();
        if (!terrainBounds) {
            return null;
        }
        
        let nearestEdgeTile = null;
        let minDistance = Infinity;
        
        // Build Set of painted tiles for O(1) lookups
        const paintedTilesSet = new Set();
        if (this.terrain.getAllTiles) {
            for (const tileData of this.terrain.getAllTiles()) {
                paintedTilesSet.add(`${tileData.x},${tileData.y}`);
            }
        }
        
        // Iterate ONLY painted tiles, filter to edges
        if (this.terrain.getAllTiles) {
            for (const tileData of this.terrain.getAllTiles()) {
                // Check if this tile is an edge tile (has at least one empty neighbor)
                if (!this._isEdgeTile(tileData.x, tileData.y, paintedTilesSet)) {
                    continue; // Skip interior tiles
                }
                
                const dx = x - tileData.x;
                const dy = y - tileData.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestEdgeTile = { x: tileData.x, y: tileData.y };
                }
            }
        }
        
        // Cache the result
        this._nearestTileCache.set(key, nearestEdgeTile);
        
        return nearestEdgeTile;
    }

    /**
     * Generate grid lines for a region with feathered opacity
     * Uses caching to avoid regeneration when tiles/mouse haven't changed
     * @param {Object|null} region - { minX, maxX, minY, maxY } or null
     * @param {Object|null} mousePos - { x, y } in grid coordinates or null (for cache key)
     */
    generateGridLines(region, mousePos = null) {
        // No region = no grid
        if (!region) {
            this.gridLines = [];
            return;
        }
        
        const tileSize = this.terrain.tileSize;
        const paintedTiles = Array.from(this.terrain.getAllTiles());
        
        // Generate cache key
        const newCacheKey = this._generateCacheKey(paintedTiles, mousePos);
        
        // Check cache - if key hasn't changed and mouse hasn't moved tiles, reuse
        if (!this._shouldInvalidateCache(newCacheKey, mousePos)) {
            // Cache hit - reuse existing grid lines
            this.gridLines = this._gridCache.gridLines;
            return;
        }
        
        // Cache miss - regenerate grid
        this.gridLines = [];
        
        // If no tiles painted, show grid at mouse position with distance-based feathering
        if (paintedTiles.length === 0) {
            // Calculate center of region (mouse position)
            const centerX = (region.minX + region.maxX) / 2;
            const centerY = (region.minY + region.maxY) / 2;
            
            // Aggressive feathering: nearly invisible at 1.5 tiles
            const fadeDistance = 1.2; // Shorter distance for more aggressive fade
            
            // Vertical lines with aggressive feathering
            for (let x = region.minX; x <= region.maxX + 1; x++) {
                // Calculate opacity based on distance from center X
                const distX = Math.abs(x - centerX);
                // Exponential falloff for aggressive feathering
                const opacity = Math.max(0.05, Math.pow(Math.max(0, 1.0 - (distX / fadeDistance)), 2.5));
                
                this.gridLines.push({
                    x1: x * tileSize,
                    y1: region.minY * tileSize,
                    x2: x * tileSize,
                    y2: (region.maxY + 1) * tileSize,
                    opacity: opacity
                });
            }
            
            // Horizontal lines with aggressive feathering
            for (let y = region.minY; y <= region.maxY + 1; y++) {
                // Calculate opacity based on distance from center Y
                const distY = Math.abs(y - centerY);
                // Exponential falloff for aggressive feathering
                const opacity = Math.max(0.05, Math.pow(Math.max(0, 1.0 - (distY / fadeDistance)), 2.5));
                
                this.gridLines.push({
                    x1: region.minX * tileSize,
                    y1: y * tileSize,
                    x2: (region.maxX + 1) * tileSize,
                    y2: y * tileSize,
                    opacity: opacity
                });
            }
            
            // Update cache before returning
            this._gridCache.gridLines = [...this.gridLines];
            this._gridCache.cacheKey = newCacheKey;
            this._gridCache.lastMouseTile = mousePos ? {
                x: Math.floor(mousePos.x),
                y: Math.floor(mousePos.y)
            } : null;
            
            return;
        }
        
        // Build Set of edge tiles for O(1) lookups
        const paintedTilesSet = new Set();
        for (const tile of paintedTiles) {
            paintedTilesSet.add(`${tile.x},${tile.y}`);
        }
        
        const edgeTilesSet = new Set();
        for (const tile of paintedTiles) {
            if (this._isEdgeTile(tile.x, tile.y, paintedTilesSet)) {
                edgeTilesSet.add(`${tile.x},${tile.y}`);
            }
        }
        
        // Generate vertical lines (x-axis)
        // Only render lines that are ADJACENT to edge tiles
        for (let x = region.minX; x <= region.maxX + 1; x++) {
            // Check if this vertical line (at position x) is adjacent to any edge tiles
            // A vertical line at x is adjacent to tiles at x-1 and x
            let isAdjacentToEdge = false;
            for (let y = region.minY; y <= region.maxY; y++) {
                if (edgeTilesSet.has(`${x-1},${y}`) || edgeTilesSet.has(`${x},${y}`)) {
                    isAdjacentToEdge = true;
                    break;
                }
            }
            
            if (!isAdjacentToEdge) {
                continue; // Skip lines not adjacent to edges (creates hole effect)
            }
            
            // Sample a few points along the line to get average opacity
            const samplePoints = Math.min(5, region.maxY - region.minY + 1);
            let totalOpacity = 0;
            
            for (let i = 0; i < samplePoints; i++) {
                const y = region.minY + Math.floor(i * (region.maxY - region.minY) / (samplePoints - 1 || 1));
                const feather = this.calculateFeathering(x, y);
                if (x === 2 && y === 2) {
                    console.log(`  Sample point (${x},${y}): feathering = ${feather}`);
                }
                totalOpacity += feather;
            }
            
            const avgOpacity = totalOpacity / samplePoints;
            
            // Skip lines with zero opacity (creates "hole" effect in interior)
            if (avgOpacity > 0) {
                this.gridLines.push({
                    x1: x * tileSize,
                    y1: region.minY * tileSize,
                    x2: x * tileSize,
                    y2: (region.maxY + 1) * tileSize,
                    opacity: avgOpacity
                });
            }
        }
        
        // Generate horizontal lines (y-axis)
        // Only render lines that are ADJACENT to edge tiles
        for (let y = region.minY; y <= region.maxY + 1; y++) {
            // Check if this horizontal line (at position y) is adjacent to any edge tiles
            // A horizontal line at y is adjacent to tiles at y-1 and y
            let isAdjacentToEdge = false;
            for (let x = region.minX; x <= region.maxX; x++) {
                if (edgeTilesSet.has(`${x},${y-1}`) || edgeTilesSet.has(`${x},${y}`)) {
                    isAdjacentToEdge = true;
                    break;
                }
            }
            
            if (!isAdjacentToEdge) {
                continue; // Skip lines not adjacent to edges (creates hole effect)
            }
            
            // Sample a few points along the line to get average opacity
            const samplePoints = Math.min(5, region.maxX - region.minX + 1);
            let totalOpacity = 0;
            
            for (let i = 0; i < samplePoints; i++) {
                const x = region.minX + Math.floor(i * (region.maxX - region.minX) / (samplePoints - 1 || 1));
                totalOpacity += this.calculateFeathering(x, y);
            }
            
            const avgOpacity = totalOpacity / samplePoints;
            
            // Skip lines with zero opacity (creates "hole" effect in interior)
            if (avgOpacity > 0) {
                this.gridLines.push({
                    x1: region.minX * tileSize,
                    y1: y * tileSize,
                    x2: (region.maxX + 1) * tileSize,
                    y2: y * tileSize,
                    opacity: avgOpacity
                });
            }
        }
        
        // Update cache with newly generated grid lines
        this._gridCache.gridLines = [...this.gridLines]; // Copy array
        this._gridCache.cacheKey = newCacheKey;
        this._gridCache.lastMouseTile = mousePos ? {
            x: Math.floor(mousePos.x),
            y: Math.floor(mousePos.y)
        } : null;
    }

    /**
     * Update grid based on mouse position and viewport
     * Uses caching - only regenerates when tiles or mouse tile changes
     * @param {Object|null} mousePos - { x, y } in grid coordinates or null
     * @param {Object|null} viewport - { minX, maxX, minY, maxY } for culling or null
     */
    update(mousePos, viewport = null) {
        // Clear feathering cache (not grid cache - that's managed in generateGridLines)
        this._clearCache();
        
        const region = this.calculateGridRegion(mousePos);
        
        // Apply viewport culling if provided
        let finalRegion = region;
        if (region && viewport) {
            finalRegion = {
                minX: Math.max(region.minX, viewport.minX),
                maxX: Math.min(region.maxX, viewport.maxX),
                minY: Math.max(region.minY, viewport.minY),
                maxY: Math.min(region.maxY, viewport.maxY)
            };
        }
        
        // Pass mousePos to generateGridLines for cache key generation
        this.generateGridLines(finalRegion, mousePos);
        
        this._lastMousePos = mousePos;
        this._lastBounds = this.terrain.getBounds();
    }

    /**
     * Render grid lines with feathered opacity
     * Uses p5.js drawing functions (stroke, line)
     */
    render() {
        if (this.gridLines.length === 0) {
            return;
        }
        
        push();
        
        for (const gridLine of this.gridLines) {
            // Skip fully transparent lines
            if (gridLine.opacity <= 0.0) {
                continue;
            }
            
            // Apply opacity to stroke color (white grid with alpha)
            const alpha = Math.floor(gridLine.opacity * 255);
            stroke(255, 255, 255, alpha);
            strokeWeight(1);
            
            line(gridLine.x1, gridLine.y1, gridLine.x2, gridLine.y2);
        }
        
        pop();
    }

    /**
     * Check if grid needs update (bounds or mouse changed)
     * @param {Object|null} mousePos - Current mouse position
     * @returns {boolean} True if update needed
     */
    needsUpdate(mousePos) {
        const currentBounds = this.terrain.getBounds();
        
        // Bounds changed
        if (JSON.stringify(currentBounds) !== JSON.stringify(this._lastBounds)) {
            return true;
        }
        
        // Mouse position changed
        if (JSON.stringify(mousePos) !== JSON.stringify(this._lastMousePos)) {
            return true;
        }
        
        return false;
    }
}

// Global export for browser and Node.js
if (typeof window !== 'undefined') {
    window.DynamicGridOverlay = DynamicGridOverlay;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DynamicGridOverlay;
}

/**
 * DynamicGridOverlay - Dynamic grid rendering for lazy terrain loading
 * 
 * Renders grid lines only at painted tiles + 2-tile buffer with opacity feathering.
 * When no tiles painted, shows grid at mouse hover location.
 * 
 * Phase: 2A of Lazy Terrain Loading Enhancement
 * Tests: test/unit/ui/DynamicGridOverlay.test.js (28 tests)
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
    }

    /**
     * Calculate grid region from painted tiles + buffer and/or mouse position
     * @param {Object|null} mousePos - { x, y } in grid coordinates or null
     * @returns {Object|null} { minX, maxX, minY, maxY } or null if no region
     */
    calculateGridRegion(mousePos) {
        const terrainBounds = this.terrain.getBounds();
        
        // No tiles and no mouse = no grid
        if (!terrainBounds && !mousePos) {
            return null;
        }
        
        let region = null;
        
        // Start with painted tiles region (if any)
        if (terrainBounds) {
            region = {
                minX: terrainBounds.minX - this.bufferSize,
                maxX: terrainBounds.maxX + this.bufferSize,
                minY: terrainBounds.minY - this.bufferSize,
                maxY: terrainBounds.maxY + this.bufferSize
            };
        }
        
        // Add mouse hover region
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
     * Calculate opacity feathering based on distance to nearest painted tile
     * Formula: opacity = max(0, 1.0 - (distance / bufferSize))
     * 
     * @param {number} x - Grid X coordinate
     * @param {number} y - Grid Y coordinate
     * @param {Object|null} nearestPaintedTile - { x, y } or null to auto-find
     * @returns {number} Opacity from 0.0 to 1.0
     */
    calculateFeathering(x, y, nearestPaintedTile = null) {
        // If this tile is painted, full opacity
        const tile = this.terrain.getTile(x, y);
        if (tile) {
            return 1.0;
        }
        
        // Find nearest painted tile if not provided
        if (!nearestPaintedTile) {
            nearestPaintedTile = this._findNearestPaintedTile(x, y);
        }
        
        // No painted tiles = use default opacity (for mouse hover)
        if (!nearestPaintedTile) {
            return 0.5; // Medium opacity when no tiles painted
        }
        
        // Calculate distance to nearest painted tile
        const dx = x - nearestPaintedTile.x;
        const dy = y - nearestPaintedTile.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Apply feathering formula
        const opacity = 1.0 - (distance / this.bufferSize);
        
        // Clamp to [0.0, 1.0]
        return Math.max(0.0, Math.min(1.0, opacity));
    }

    /**
     * Find nearest painted tile to a grid coordinate
     * Uses terrain's sparse storage for efficiency (iterate painted tiles only)
     * @private
     * @param {number} x - Grid X coordinate
     * @param {number} y - Grid Y coordinate
     * @returns {Object|null} { x, y } of nearest tile or null
     */
    _findNearestPaintedTile(x, y) {
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
        
        return nearestTile;
    }

    /**
     * Generate grid lines for a region with feathered opacity
     * @param {Object|null} region - { minX, maxX, minY, maxY } or null
     */
    generateGridLines(region) {
        this.gridLines = [];
        
        if (!region) {
            return;
        }
        
        const tileSize = this.terrain.tileSize;
        
        // Generate vertical lines (x-axis)
        for (let x = region.minX; x <= region.maxX + 1; x++) {
            // Calculate average opacity for this vertical line
            let totalOpacity = 0;
            let samples = 0;
            
            for (let y = region.minY; y <= region.maxY; y++) {
                totalOpacity += this.calculateFeathering(x, y);
                samples++;
            }
            
            const avgOpacity = samples > 0 ? totalOpacity / samples : 0;
            
            this.gridLines.push({
                x1: x * tileSize,
                y1: region.minY * tileSize,
                x2: x * tileSize,
                y2: (region.maxY + 1) * tileSize,
                opacity: avgOpacity
            });
        }
        
        // Generate horizontal lines (y-axis)
        for (let y = region.minY; y <= region.maxY + 1; y++) {
            // Calculate average opacity for this horizontal line
            let totalOpacity = 0;
            let samples = 0;
            
            for (let x = region.minX; x <= region.maxX; x++) {
                totalOpacity += this.calculateFeathering(x, y);
                samples++;
            }
            
            const avgOpacity = samples > 0 ? totalOpacity / samples : 0;
            
            this.gridLines.push({
                x1: region.minX * tileSize,
                y1: y * tileSize,
                x2: (region.maxX + 1) * tileSize,
                y2: y * tileSize,
                opacity: avgOpacity
            });
        }
    }

    /**
     * Update grid based on mouse position and viewport
     * @param {Object|null} mousePos - { x, y } in grid coordinates or null
     * @param {Object|null} viewport - { minX, maxX, minY, maxY } for culling or null
     */
    update(mousePos, viewport = null) {
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
        
        this.generateGridLines(finalRegion);
        
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

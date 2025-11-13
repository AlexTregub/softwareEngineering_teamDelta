/**
 * DynamicGridOverlay v3 - Simple Direct Rendering
 * 
 * - No caching (grid lines are fast to draw)
 * - Only renders grid for painted tiles
 * - Draws directly each frame
 */

class DynamicGridOverlay {
    /**
     * Create a simple grid overlay
     * @param {Object} terrain - SparseTerrain instance
     * @param {number} tileSize - Size of grid tiles in pixels (default: 32)
     * @param {number} bufferSize - Tiles to extend grid beyond painted area (default: 2)
     */
    constructor(terrain, tileSize = 32, bufferSize = 2) {
        this.terrain = terrain;
        this.tileSize = tileSize;
        this.bufferSize = bufferSize;
        
        // Grid appearance
        this.gridColor = [255, 255, 255, 100]; // White, semi-transparent
        this.gridWeight = 1;
        
        this.visible = true;
    }
    
    /**
     * Render grid directly to screen (called every frame)
     * Only renders grid lines for painted tiles + buffer
     */
    render() {
        if (!this.visible || !this.terrain) return;
        
        // Get painted tiles from terrain
        if (!this.terrain.getAllTiles || typeof this.terrain.getAllTiles !== 'function') {
            return; // Not a SparseTerrain
        }
        
        const tiles = Array.from(this.terrain.getAllTiles());
        if (tiles.length === 0) return; // No tiles to render
        
        // Find bounds of painted tiles
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        for (const tile of tiles) {
            // getAllTiles() yields {x, y, material} objects
            minX = Math.min(minX, tile.x);
            minY = Math.min(minY, tile.y);
            maxX = Math.max(maxX, tile.x);
            maxY = Math.max(maxY, tile.y);
        }
        
        // Add buffer
        minX -= this.bufferSize;
        minY -= this.bufferSize;
        maxX += this.bufferSize;
        maxY += this.bufferSize;
        
        // Draw grid lines
        push();
        stroke(...this.gridColor);
        strokeWeight(this.gridWeight);
        
        // Vertical lines
        for (let x = minX; x <= maxX + 1; x++) {
            const screenX = x * this.tileSize;
            line(screenX, minY * this.tileSize, screenX, (maxY + 1) * this.tileSize);
        }
        
        // Horizontal lines
        for (let y = minY; y <= maxY + 1; y++) {
            const screenY = y * this.tileSize;
            line(minX * this.tileSize, screenY, (maxX + 1) * this.tileSize, screenY);
        }
        
        pop();
    }
    
    /**
     * Set visibility
     * @param {boolean} visible
     */
    setVisible(visible) {
        this.visible = visible;
    }
    
    /**
     * Clean up (no-op for simple version)
     */
    destroy() {
        // Nothing to clean up
    }
}

// Global export
if (typeof window !== 'undefined') {
    window.DynamicGridOverlay = DynamicGridOverlay;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DynamicGridOverlay;
}

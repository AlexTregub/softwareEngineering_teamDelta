/**
 * DynamicMinimap - Dynamic minimap for lazy terrain loading
 * 
 * Shows only painted terrain region with padding, not fixed 50x50 grid.
 * Viewport calculated from terrain bounds, scale adjusts automatically.
 * 
 * Phase: 3A/3B of Lazy Terrain Loading Enhancement
 * Tests: test/unit/ui/DynamicMinimap.test.js (32 tests)
 */

class DynamicMinimap {
    /**
     * Create a dynamic minimap
     * @param {Object} terrain - SparseTerrain instance
     * @param {number} width - Minimap width in pixels
     * @param {number} height - Minimap height in pixels
     * @param {number} padding - Tiles to extend viewport beyond painted area (default: 2)
     */
    constructor(terrain, width = 200, height = 200, padding = 2) {
        this.terrain = terrain;
        this.width = width;
        this.height = height;
        this.padding = padding;
        this.viewport = null; // { minX, maxX, minY, maxY } in grid coordinates
        this.scale = 1.0;
    }

    /**
     * Calculate viewport from terrain bounds with padding
     * @returns {Object|null} { minX, maxX, minY, maxY } or null if no tiles
     */
    calculateViewport() {
        const bounds = this.terrain.getBounds();
        
        if (!bounds) {
            return null;
        }
        
        return {
            minX: bounds.minX - this.padding,
            maxX: bounds.maxX + this.padding,
            minY: bounds.minY - this.padding,
            maxY: bounds.maxY + this.padding
        };
    }

    /**
     * Calculate scale to fit viewport in minimap
     * @param {Object|null} viewport - { minX, maxX, minY, maxY } or null
     * @returns {number} Scale factor
     */
    calculateScale(viewport) {
        if (!viewport) {
            return 1.0;
        }
        
        const tileSize = this.terrain.tileSize;
        
        // Calculate viewport size in pixels
        const viewportWidth = (viewport.maxX - viewport.minX + 1) * tileSize;
        const viewportHeight = (viewport.maxY - viewport.minY + 1) * tileSize;
        
        // Calculate scale to fit both dimensions
        const scaleX = this.width / viewportWidth;
        const scaleY = this.height / viewportHeight;
        
        // Use minimum scale to fit both dimensions
        return Math.min(scaleX, scaleY);
    }

    /**
     * Convert world coordinates to minimap pixel coordinates
     * @param {number} worldX - World grid X coordinate
     * @param {number} worldY - World grid Y coordinate
     * @returns {Object} { x, y } minimap pixel coordinates
     */
    worldToMinimap(worldX, worldY) {
        if (!this.viewport) {
            return { x: 0, y: 0 };
        }
        
        const tileSize = this.terrain.tileSize;
        
        // Offset from viewport origin
        const offsetX = worldX - this.viewport.minX;
        const offsetY = worldY - this.viewport.minY;
        
        // Convert to minimap pixels
        const x = offsetX * tileSize * this.scale;
        const y = offsetY * tileSize * this.scale;
        
        return { x, y };
    }

    /**
     * Update viewport and scale based on current terrain bounds
     */
    update() {
        this.viewport = this.calculateViewport();
        this.scale = this.calculateScale(this.viewport);
    }

    /**
     * Render minimap with painted tiles
     * Uses p5.js drawing functions
     * @param {number} x - Minimap position X (default: 0)
     * @param {number} y - Minimap position Y (default: 0)
     */
    render(x = 0, y = 0) {
        if (!this.viewport) {
            return; // No tiles to render
        }
        
        push();
        translate(x, y);
        
        // Render background
        fill(50, 50, 50);
        stroke(200, 200, 200);
        rect(0, 0, this.width, this.height);
        
        // Render painted tiles
        const tiles = this.terrain.getAllTiles ? Array.from(this.terrain.getAllTiles()) : [];
        
        for (const tileData of tiles) {
            const minimapCoords = this.worldToMinimap(tileData.x, tileData.y);
            const tileDisplaySize = this.terrain.tileSize * this.scale;
            
            // Simple color mapping (can be enhanced)
            this._setTileColor(tileData.material);
            noStroke();
            rect(minimapCoords.x, minimapCoords.y, tileDisplaySize, tileDisplaySize);
        }
        
        pop();
    }

    /**
     * Render camera viewport outline on minimap
     * @param {Object} cameraViewport - { minX, maxX, minY, maxY } in grid coordinates
     * @param {number} x - Minimap position X (default: 0)
     * @param {number} y - Minimap position Y (default: 0)
     */
    renderCameraViewport(cameraViewport, x = 0, y = 0) {
        if (!this.viewport || !cameraViewport) {
            return;
        }
        
        push();
        translate(x, y);
        
        const topLeft = this.worldToMinimap(cameraViewport.minX, cameraViewport.minY);
        const bottomRight = this.worldToMinimap(cameraViewport.maxX, cameraViewport.maxY);
        
        const viewportWidth = bottomRight.x - topLeft.x;
        const viewportHeight = bottomRight.y - topLeft.y;
        
        // Draw camera viewport outline
        noFill();
        stroke(255, 255, 0, 200); // Yellow outline
        strokeWeight(2);
        rect(topLeft.x, topLeft.y, viewportWidth, viewportHeight);
        
        pop();
    }

    /**
     * Set fill color based on material type
     * @private
     * @param {*} material - Material identifier
     */
    _setTileColor(material) {
        // Simple color mapping (can be customized)
        const colorMap = {
            'grass': [100, 200, 100],
            'stone': [150, 150, 150],
            'water': [100, 100, 255],
            'dirt': [150, 100, 50],
            'sand': [230, 220, 170],
            'moss': [80, 150, 80]
        };
        
        const color = colorMap[material] || [200, 200, 200]; // Default gray
        fill(color[0], color[1], color[2]);
    }

    /**
     * Get minimap info for debugging
     * @returns {Object} Minimap state info
     */
    getInfo() {
        return {
            viewport: this.viewport,
            scale: this.scale,
            width: this.width,
            height: this.height,
            padding: this.padding,
            tileCount: this.terrain.getAllTiles ? Array.from(this.terrain.getAllTiles()).length : 0
        };
    }
}

// Global export for browser and Node.js
if (typeof window !== 'undefined') {
    window.DynamicMinimap = DynamicMinimap;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DynamicMinimap;
}

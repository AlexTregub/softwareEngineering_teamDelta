/**
 * MiniMap - UI component for terrain overview and navigation
 * 
 * Provides a miniaturized view of the terrain with:
 * - Scaled terrain rendering
 * - Camera viewport indicator
 * - Click-to-navigate functionality
 * - Real-time updates
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
        
        // Draw background
        fill(20, 20, 20);
        stroke(100, 150, 255);
        strokeWeight(2);
        rect(0, 0, this.width, this.height);
        
        // Draw terrain tiles
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
        
        // Draw viewport indicator if camera available
        if (typeof cameraManager !== 'undefined' && cameraManager && cameraManager.camera) {
            const viewport = this.getViewportRect({
                x: cameraManager.camera.x || 0,
                y: cameraManager.camera.y || 0,
                width: cameraManager.camera.viewportWidth || 800,
                height: cameraManager.camera.viewportHeight || 600
            });
            
            noFill();
            stroke(255, 255, 0);
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
}

// Export for use in Node.js tests and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MiniMap;
}

/**
 * HoverPreviewManager - Calculates and manages tile highlights for Level Editor tools
 * 
 * FEATURES:
 * - Calculate affected tiles based on tool and brush size
 * - Circular brush patterns for paint tool
 * - Visual preview before painting
 * - Support for all tools (paint, fill, eyedropper)
 * 
 * USAGE:
 *   const hoverManager = new HoverPreviewManager();
 *   hoverManager.updateHover(tileX, tileY, 'paint', brushSize);
 *   const tilesToHighlight = hoverManager.getHoveredTiles();
 */

class HoverPreviewManager {
    constructor() {
        this.hoveredTiles = [];
    }
    
    /**
     * Calculate which tiles would be affected by the current tool
     * @param {number} tileX - Grid X coordinate
     * @param {number} tileY - Grid Y coordinate
     * @param {string} tool - Current tool name ('paint', 'fill', 'eyedropper', 'select')
     * @param {number} brushSize - Brush size (1, 2, 3, 4, 5, 6, 7, 8, 9)
     * @returns {Array<{x: number, y: number}>}
     */
    calculateAffectedTiles(tileX, tileY, tool, brushSize = 1) {
        const tiles = [];
        
        switch(tool) {
            case 'paint':
                const radius = Math.floor(brushSize / 2);
                const isOddSize = brushSize % 2 !== 0;
                
                if (isOddSize) {
                    // ODD SIZES (1,3,5,7,9): Full square pattern
                    for (let dy = -radius; dy <= radius; dy++) {
                        for (let dx = -radius; dx <= radius; dx++) {
                            tiles.push({ x: tileX + dx, y: tileY + dy });
                        }
                    }
                } else {
                    // EVEN SIZES (2,4,6,8): Circular pattern
                    for (let dy = -radius; dy <= radius; dy++) {
                        for (let dx = -radius; dx <= radius; dx++) {
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            if (distance <= radius) {
                                tiles.push({ x: tileX + dx, y: tileY + dy });
                            }
                        }
                    }
                }
                break;
                
            case 'fill':
                // Fill tool only affects the clicked tile (flood fill happens on click)
                tiles.push({ x: tileX, y: tileY });
                break;
                
            case 'eyedropper':
                // Eyedropper only affects single tile
                tiles.push({ x: tileX, y: tileY });
                break;
                
            case 'select':
                // Select tool doesn't show hover preview (shows during drag)
                break;
        }
        
        return tiles;
    }
    
    /**
     * Update the hover preview for the current mouse position
     * @param {number} tileX - Grid X coordinate
     * @param {number} tileY - Grid Y coordinate
     * @param {string} tool - Current tool name
     * @param {number} brushSize - Current brush size
     */
    updateHover(tileX, tileY, tool, brushSize = 1) {
        this.hoveredTiles = this.calculateAffectedTiles(tileX, tileY, tool, brushSize);
    }
    
    /**
     * Clear the hover preview
     */
    clearHover() {
        this.hoveredTiles = [];
    }
    
    /**
     * Get the currently hovered tiles
     * @returns {Array<{x: number, y: number}>}
     */
    getHoveredTiles() {
        return this.hoveredTiles;
    }
}

// Global export for browser
if (typeof window !== 'undefined') {
    window.HoverPreviewManager = HoverPreviewManager;
}

// Module export for Node.js tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HoverPreviewManager;
}

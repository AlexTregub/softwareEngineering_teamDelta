/**
 * SelectionManager - Handles rectangle selection for Level Editor select tool
 * 
 * FEATURES:
 * - Click-drag rectangle selection
 * - Calculate selection bounds
 * - Get all tiles within selection
 * - Visual feedback during selection
 * 
 * USAGE:
 *   const selectionManager = new SelectionManager();
 *   selectionManager.startSelection(tileX, tileY);
 *   selectionManager.updateSelection(newTileX, newTileY);
 *   const tiles = selectionManager.getTilesInSelection();
 */

class SelectionManager {
    constructor() {
        this.startTile = null;
        this.endTile = null;
        this.isSelecting = false;
    }
    
    /**
     * Start a new selection at the given tile position
     * @param {number} tileX - Grid X coordinate
     * @param {number} tileY - Grid Y coordinate
     */
    startSelection(tileX, tileY) {
        this.startTile = { x: tileX, y: tileY };
        this.endTile = { x: tileX, y: tileY };
        this.isSelecting = true;
    }
    
    /**
     * Update the selection end position (during drag)
     * @param {number} tileX - Grid X coordinate
     * @param {number} tileY - Grid Y coordinate
     */
    updateSelection(tileX, tileY) {
        if (!this.isSelecting) return;
        this.endTile = { x: tileX, y: tileY };
    }
    
    /**
     * End the current selection (on mouse release)
     */
    endSelection() {
        this.isSelecting = false;
    }
    
    /**
     * Clear the selection completely
     */
    clearSelection() {
        this.startTile = null;
        this.endTile = null;
        this.isSelecting = false;
    }
    
    /**
     * Check if there is an active selection
     * @returns {boolean}
     */
    hasSelection() {
        return this.startTile !== null && this.endTile !== null;
    }
    
    /**
     * Get the bounding box of the selection
     * @returns {Object|null} { minX, maxX, minY, maxY } or null if no selection
     */
    getSelectionBounds() {
        if (!this.hasSelection()) return null;
        
        return {
            minX: Math.min(this.startTile.x, this.endTile.x),
            maxX: Math.max(this.startTile.x, this.endTile.x),
            minY: Math.min(this.startTile.y, this.endTile.y),
            maxY: Math.max(this.startTile.y, this.endTile.y)
        };
    }
    
    /**
     * Get all tiles within the current selection
     * @returns {Array<{x: number, y: number}>}
     */
    getTilesInSelection() {
        const bounds = this.getSelectionBounds();
        if (!bounds) return [];
        
        const tiles = [];
        for (let y = bounds.minY; y <= bounds.maxY; y++) {
            for (let x = bounds.minX; x <= bounds.maxX; x++) {
                tiles.push({ x, y });
            }
        }
        return tiles;
    }
}

// Global export for browser
if (typeof window !== 'undefined') {
    window.SelectionManager = SelectionManager;
}

// Module export for Node.js tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SelectionManager;
}

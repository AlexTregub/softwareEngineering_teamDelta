/**
 * PropertiesPanel - UI component for terrain information display
 * 
 * Shows detailed information about:
 * - Selected tile properties
 * - Terrain statistics
 * - Undo/redo stack status
 */
class PropertiesPanel {
    /**
     * Create a properties panel
     */
    constructor() {
        this.selectedTile = null;
        this.terrain = null;
        this.editor = null;
    }
    
    /**
     * Set selected tile
     * @param {Object} tile - Tile with position, material, weight, passable
     */
    setSelectedTile(tile) {
        this.selectedTile = tile;
    }
    
    /**
     * Get selected tile properties
     * @returns {Object|null} Tile properties
     */
    getProperties() {
        if (!this.selectedTile) return null;
        
        return {
            position: this.selectedTile.position || { x: 0, y: 0 },
            material: this.selectedTile.material || 'unknown',
            weight: this.selectedTile.weight || 1,
            passable: this.selectedTile.passable !== undefined ? this.selectedTile.passable : true
        };
    }
    
    /**
     * Set terrain reference for statistics
     * @param {Object} terrain - Terrain object with getArrPos
     */
    setTerrain(terrain) {
        this.terrain = terrain;
    }
    
    /**
     * Get terrain statistics
     * @returns {Object} Statistics
     */
    getStatistics() {
        if (!this.terrain) {
            return {
                totalTiles: 0,
                materials: {},
                diversity: 0
            };
        }
        
        const stats = {
            totalTiles: 0,
            materials: {},
            diversity: 0
        };
        
        // If terrain has a statistics method, use it
        if (this.terrain.getStatistics) {
            return this.terrain.getStatistics();
        }
        
        // Otherwise calculate from terrain data
        if (this.terrain.gridSize) {
            stats.totalTiles = this.terrain.gridSize * this.terrain.gridSize;
        }
        
        return stats;
    }
    
    /**
     * Set editor reference for undo/redo info
     * @param {Object} editor - TerrainEditor instance
     */
    setEditor(editor) {
        this.editor = editor;
    }
    
    /**
     * Get undo/redo stack information
     * @returns {Object} Stack info
     */
    getStackInfo() {
        if (!this.editor) {
            return {
                canUndo: false,
                canRedo: false,
                undoCount: 0,
                redoCount: 0
            };
        }
        
        return {
            canUndo: this.editor.canUndo ? this.editor.canUndo() : false,
            canRedo: this.editor.canRedo ? this.editor.canRedo() : false,
            undoCount: this.editor.undoStack ? this.editor.undoStack.length : 0,
            redoCount: this.editor.redoStack ? this.editor.redoStack.length : 0
        };
    }
    
    /**
     * Clear selected tile
     */
    clearSelection() {
        this.selectedTile = null;
    }
    
    /**
     * Check if tile is selected
     * @returns {boolean} True if tile selected
     */
    hasSelection() {
        return this.selectedTile !== null;
    }
    
    /**
     * Update panel data (refresh statistics)
     * Call this when terrain changes to update tile counts
     */
    update() {
        // Force re-calculation of statistics
        // This is a no-op but allows external code to signal updates
        // The getStatistics() method will fetch fresh data
    }
    
    /**
     * Get content size for DraggablePanel integration
     * @returns {Object} Size object with width and height
     */
    getContentSize() {
        return {
            width: 180,
            height: 360
        };
    }
    
    /**
     * Get formatted property display
     * @returns {Array<Object>} Display items with label and value
     */
    getDisplayItems() {
        const items = [];
        const props = this.getProperties();

        if (props) {
            items.push(
                { label: 'Position', value: `(${props.position.x}, ${props.position.y})` },
                { label: 'Material', value: props.material },
                { label: 'Weight', value: props.weight.toString() },
                { label: 'Passable', value: props.passable ? 'Yes' : 'No' }
            );
        }

        const stats = this.getStatistics();
        items.push(
            { label: 'Total Tiles', value: stats.totalTiles.toString() },
            { label: 'Diversity', value: stats.diversity.toFixed(2) }
        );

        const stackInfo = this.getStackInfo();
        items.push(
            { label: 'Undo Available', value: stackInfo.canUndo ? 'Yes' : 'No' },
            { label: 'Redo Available', value: stackInfo.canRedo ? 'Yes' : 'No' }
        );

        return items;
    }

    /**
     * Render properties panel
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {Object} options - Render options
     * @param {boolean} options.isPanelContent - True if rendering as panel content (no background)
     */
    render(x, y, options = {}) {
        // Check if p5.js is available
        if (typeof push === 'undefined') return;

        push();

        const panelWidth = 180;
        const panelHeight = 360;
        const lineHeight = 20;
        const padding = 10;

        // Only render background if NOT panel content
        if (!options.isPanelContent) {
            // Panel background
            fill(40, 40, 40, 230);
            stroke(100, 150, 255);
            strokeWeight(2);
            rect(x, y, panelWidth, panelHeight, 5);

            // Title
            fill(100, 150, 255);
            noStroke();
            textAlign(CENTER, TOP);
            textSize(14);
            text('Properties', x + panelWidth / 2, y + padding);
        }

        // Get display items
        const items = this.getDisplayItems();
        let currentY = y + (options.isPanelContent ? 0 : padding + lineHeight + 5);

        // Render each property
        fill(255);
        textAlign(LEFT, TOP);
        textSize(11);

        for (const item of items) {
            // Label
            fill(150, 150, 150);
            text(item.label + ':', x + padding, currentY);

            // Value
            fill(255, 255, 255);
            text(item.value, x + panelWidth - padding - 80, currentY);

            currentY += lineHeight;

            // Add separator after selection properties
            if (item.label === 'Passable' || item.label === 'Diversity') {
                stroke(80, 80, 80);
                strokeWeight(1);
                line(x + padding, currentY + 3, x + panelWidth - padding, currentY + 3);
                noStroke();
                currentY += 8;
            }
        }

        pop();
    }
}// Export for use in Node.js tests and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PropertiesPanel;
}

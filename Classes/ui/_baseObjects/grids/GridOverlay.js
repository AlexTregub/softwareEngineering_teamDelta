/**
 * GridOverlay - UI component for terrain grid visualization
 * 
 * Provides a visual grid overlay with:
 * - Toggle visibility
 * - Adjustable opacity
 * - Hover highlighting
 * - Grid line calculation
 */
class GridOverlay {
    /**
     * Create a grid overlay
     * @param {number} tileSize - Size of each tile in pixels
     * @param {number} width - Grid width in tiles
     * @param {number} height - Grid height in tiles
     */
    constructor(tileSize, width, height) {
        this.tileSize = tileSize;
        this.width = width;
        this.height = height;
        this.visible = true;
        this.opacity = 0.3;
        this.alpha = 0.3; // Rendering alpha (same as opacity)
        this.gridSpacing = 1; // Draw grid every tile
        this.hoveredTile = null;
    }
    
    /**
     * Toggle grid visibility
     * @returns {boolean} New visibility state
     */
    toggle() {
        this.visible = !this.visible;
        return this.visible;
    }
    
    /**
     * Set grid visibility
     * @param {boolean} visible - Visibility state
     */
    setVisible(visible) {
        this.visible = visible;
    }
    
    /**
     * Get grid visibility
     * @returns {boolean} Current visibility
     */
    isVisible() {
        return this.visible;
    }
    
    /**
     * Set grid opacity
     * @param {number} opacity - Opacity (0.0 - 1.0)
     */
    setOpacity(opacity) {
        this.opacity = Math.max(0, Math.min(1, opacity));
        this.alpha = this.opacity; // Sync alpha for rendering
    }
    
    /**
     * Get grid opacity
     * @returns {number} Current opacity
     */
    getOpacity() {
        return this.opacity;
    }
    
    /**
     * Get vertical grid lines
     * @returns {Array<Object>} Lines with {x1, y1, x2, y2}
     */
    getVerticalLines() {
        const lines = [];
        const totalHeight = this.height * this.tileSize;
        
        for (let i = 0; i <= this.width; i++) {
            const x = i * this.tileSize;
            lines.push({
                x1: x,
                y1: 0,
                x2: x,
                y2: totalHeight
            });
        }
        
        return lines;
    }
    
    /**
     * Get horizontal grid lines
     * @returns {Array<Object>} Lines with {x1, y1, x2, y2}
     */
    getHorizontalLines() {
        const lines = [];
        const totalWidth = this.width * this.tileSize;
        
        for (let i = 0; i <= this.height; i++) {
            const y = i * this.tileSize;
            lines.push({
                x1: 0,
                y1: y,
                x2: totalWidth,
                y2: y
            });
        }
        
        return lines;
    }
    
    /**
     * Get all grid lines
     * @returns {Object} {vertical: Array, horizontal: Array}
     */
    getAllLines() {
        return {
            vertical: this.getVerticalLines(),
            horizontal: this.getHorizontalLines()
        };
    }
    
    /**
     * Set hovered tile from mouse coordinates
     * @param {number} mouseX - Mouse X position
     * @param {number} mouseY - Mouse Y position
     * @returns {Object|null} Hovered tile {x, y} or null
     */
    setHovered(mouseX, mouseY) {
        const tileX = Math.floor(mouseX / this.tileSize);
        const tileY = Math.floor(mouseY / this.tileSize);
        
        if (tileX >= 0 && tileX < this.width && tileY >= 0 && tileY < this.height) {
            this.hoveredTile = { x: tileX, y: tileY };
            return this.hoveredTile;
        }
        
        this.hoveredTile = null;
        return null;
    }
    
    /**
     * Get currently hovered tile
     * @returns {Object|null} Tile {x, y} or null
     */
    getHoveredTile() {
        return this.hoveredTile;
    }
    
    /**
     * Clear hovered tile
     */
    clearHovered() {
        this.hoveredTile = null;
    }
    
    /**
     * Get highlight rectangle for hovered tile
     * @returns {Object|null} Rectangle {x, y, width, height} or null
     */
    getHighlightRect() {
        if (!this.hoveredTile) return null;

        return {
            x: this.hoveredTile.x * this.tileSize,
            y: this.hoveredTile.y * this.tileSize,
            width: this.tileSize,
            height: this.tileSize
        };
    }

    /**
     * Render grid overlay
     * @param {number} offsetX - Camera offset X (default 0)
     * @param {number} offsetY - Camera offset Y (default 0)
     */
    render(offsetX = 0, offsetY = 0) {
        // Check if p5.js is available
        if (typeof push === 'undefined') return;

        if (!this.visible) return;

        push();

        // Grid lines
        stroke(255, 255, 255, this.alpha * 255);
        strokeWeight(1);

        // FIX: Add 0.5px offset to align stroke edge with tile edge
        // p5.js draws strokes CENTERED on coordinates. With strokeWeight(1):
        // - A line at x=64 draws from 63.5 to 64.5 (centered)
        // - A tile at x=64 draws from 64 to 96 (CORNER mode)
        // Adding 0.5px offset aligns the stroke's LEFT edge with the tile's LEFT edge
        const strokeOffset = 0.5;

        // Vertical lines (every tile if spacing is 1, every chunk if spacing is chunk size)
        for (let x = 0; x <= this.width; x += this.gridSpacing) {
            const screenX = x * this.tileSize + offsetX + strokeOffset;
            line(screenX, offsetY, screenX, this.height * this.tileSize + offsetY);
        }

        // Horizontal lines
        for (let y = 0; y <= this.height; y += this.gridSpacing) {
            const screenY = y * this.tileSize + offsetY + strokeOffset;
            line(offsetX, screenY, this.width * this.tileSize + offsetX, screenY);
        }

        // Hovered tile highlight
        if (this.hoveredTile) {
            const highlightRect = this.getHighlightRect();
            stroke(255, 255, 0);
            strokeWeight(2);
            noFill();
            rect(highlightRect.x + offsetX, highlightRect.y + offsetY, highlightRect.width, highlightRect.height);
        }

        pop();
    }
}// Export for use in Node.js tests and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GridOverlay;
}

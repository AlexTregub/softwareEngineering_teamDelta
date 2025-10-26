/**
 * BrushSizeControl - UI component for brush size selection
 * 
 * Controls the size of the painting brush with:
 * - Size validation (odd numbers only)
 * - Min/max constraints
 * - Brush pattern preview
 */
class BrushSizeControl {
    /**
     * Create a brush size control
     * @param {number} initialSize - Initial brush size (default: 1)
     * @param {number} minSize - Minimum size (default: 1)
     * @param {number} maxSize - Maximum size (default: 9)
     */
    constructor(initialSize = 1, minSize = 1, maxSize = 9) {
        this.minSize = minSize;
        this.maxSize = maxSize;
        this.size = this._validateSize(initialSize);
    }
    
    /**
     * Validate size (must be odd number within range)
     * @param {number} size - Size to validate
     * @returns {number} Valid size
     * @private
     */
    _validateSize(size) {
        // Must be odd number
        if (size % 2 === 0) {
            size = size + 1;
        }
        
        // Clamp to range
        if (size < this.minSize) {
            size = this.minSize;
        }
        if (size > this.maxSize) {
            size = this.maxSize;
        }
        
        return size;
    }
    
    /**
     * Set brush size
     * @param {number} size - New size
     * @returns {boolean} True if size was valid
     */
    setSize(size) {
        const validSize = this._validateSize(size);
        this.size = validSize;
        return validSize === size;
    }
    
    /**
     * Get current brush size
     * @returns {number} Current size
     */
    getSize() {
        return this.size;
    }
    
    /**
     * Increase brush size
     * @returns {number} New size
     */
    increase() {
        const newSize = this.size + 2; // Jump by 2 to keep odd
        this.setSize(newSize);
        return this.size;
    }
    
    /**
     * Decrease brush size
     * @returns {number} New size
     */
    decrease() {
        const newSize = this.size - 2; // Jump by 2 to keep odd
        this.setSize(newSize);
        return this.size;
    }
    
    /**
     * Get brush pattern as array of relative coordinates
     * @returns {Array<Array<number>>} Pattern coordinates [[x, y], ...]
     */
    getBrushPattern() {
        const pattern = [];
        const radius = Math.floor(this.size / 2);
        const center = radius;
        
        // Generate circular pattern
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                const dx = x - center;
                const dy = y - center;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= radius) {
                    pattern.push([x, y]);
                }
            }
        }
        
        return pattern;
    }
    
    /**
     * Get brush pattern centered at origin
     * @returns {Array<Array<number>>} Pattern with centered coordinates
     */
    getCenteredPattern() {
        const pattern = this.getBrushPattern();
        const offset = Math.floor(this.size / 2);
        
        return pattern.map(([x, y]) => [x - offset, y - offset]);
    }
    
    /**
     * Get brush preview as 2D grid
     * @returns {Array<Array<boolean>>} 2D grid (true = painted)
     */
    getPreviewGrid() {
        const grid = Array(this.size).fill(null).map(() => Array(this.size).fill(false));
        const pattern = this.getBrushPattern();
        
        pattern.forEach(([x, y]) => {
            grid[y][x] = true;
        });
        
        return grid;
    }
    
    /**
     * Handle mouse click
     * @param {number} mouseX - Mouse X coordinate
     * @param {number} mouseY - Mouse Y coordinate
     * @param {number} panelX - Panel X position
     * @param {number} panelY - Panel Y position
     * @returns {string|null} 'increase', 'decrease', or null
     */
    handleClick(mouseX, mouseY, panelX, panelY) {
        const panelWidth = 90;
        
        // Decrease button (left)
        const decreaseX = panelX + 5;
        const decreaseY = panelY + 10;
        if (mouseX >= decreaseX && mouseX <= decreaseX + 20 &&
            mouseY >= decreaseY && mouseY <= decreaseY + 20) {
            this.decrease();
            return 'decrease';
        }
        
        // Increase button (right)
        const increaseX = panelX + panelWidth - 25;
        const increaseY = panelY + 10;
        if (mouseX >= increaseX && mouseX <= increaseX + 20 &&
            mouseY >= increaseY && mouseY <= increaseY + 20) {
            this.increase();
            return 'increase';
        }
        
        return null;
    }
    
    /**
     * Check if point is within the control panel
     * @param {number} mouseX - Mouse X coordinate
     * @param {number} mouseY - Mouse Y coordinate
     * @param {number} panelX - Panel X position
     * @param {number} panelY - Panel Y position
     * @returns {boolean} True if within bounds
     */
    containsPoint(mouseX, mouseY, panelX, panelY) {
        const panelWidth = 90;
        const panelHeight = 50;
        
        return mouseX >= panelX && mouseX <= panelX + panelWidth &&
               mouseY >= panelY && mouseY <= panelY + panelHeight;
    }
    
    /**
     * Render the brush size control
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    render(x, y) {
        if (typeof push === 'undefined') {
            // p5.js not available
            return;
        }
        
        push();
        
        const panelWidth = 90;
        const panelHeight = 50;
        
        // NO background panel or title - draggable panel provides this
        
        // Size value
        fill(255);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(16);
        text(this.size, x + panelWidth / 2, y + 15);
        
        // Decrease button
        fill(60, 60, 60);
        stroke(150);
        strokeWeight(1);
        rect(x + 5, y + 10, 20, 20, 3);
        fill(255);
        noStroke();
        textSize(18);
        text('-', x + 15, y + 20);
        
        // Increase button
        fill(60, 60, 60);
        stroke(150);
        strokeWeight(1);
        rect(x + panelWidth - 25, y + 10, 20, 20, 3);
        fill(255);
        noStroke();
        textSize(18);
        text('+', x + panelWidth - 15, y + 20);
        
        pop();
    }
}

// Export for use in Node.js tests and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BrushSizeControl;
}

/**
 * MaterialPalette - UI component for material selection
 * 
 * Provides a visual palette of available terrain materials with:
 * - Click selection
 * - Keyboard navigation
 * - Category organization
 * - Material preview with colors
 */
class MaterialPalette {
    /**
     * Create a material palette
     * @param {Array<string>} materials - Array of material names
     */
    constructor(materials = []) {
        this.materials = materials;
        this.selectedIndex = 0;
        this.selectedMaterial = materials.length > 0 ? materials[0] : null;
        
        // Material color mapping for visual preview
        this.materialColors = {
            'moss': '#228B22',
            'moss_0': '#2E8B57',
            'moss_1': '#3CB371',
            'stone': '#808080',
            'stone_0': '#696969',
            'stone_1': '#A9A9A9',
            'dirt': '#8B4513',
            'grass': '#7CFC00',
            'water': '#1E90FF',
            'sand': '#F4A460',
            'rock': '#696969'
        };
        
        // Material categories
        this.categories = {
            'natural': ['moss', 'moss_0', 'moss_1', 'grass'],
            'solid': ['stone', 'stone_0', 'stone_1', 'rock'],
            'soil': ['dirt', 'sand']
        };
    }
    
    /**
     * Select a material by name
     * @param {string} material - Material name
     * @returns {boolean} True if material exists
     */
    selectMaterial(material) {
        const index = this.materials.indexOf(material);
        if (index !== -1) {
            this.selectedMaterial = material;
            this.selectedIndex = index;
            return true;
        }
        return false;
    }
    
    /**
     * Get currently selected material
     * @returns {string|null} Selected material name
     */
    getSelectedMaterial() {
        return this.selectedMaterial;
    }
    
    /**
     * Get index of selected material
     * @returns {number} 0-based index
     */
    getSelectedIndex() {
        return this.selectedIndex;
    }
    
    /**
     * Select next material (keyboard navigation)
     * @returns {string|null} New selected material
     */
    selectNext() {
        if (this.materials.length === 0) return null;
        
        this.selectedIndex = (this.selectedIndex + 1) % this.materials.length;
        this.selectedMaterial = this.materials[this.selectedIndex];
        return this.selectedMaterial;
    }
    
    /**
     * Select previous material (keyboard navigation)
     * @returns {string|null} New selected material
     */
    selectPrevious() {
        if (this.materials.length === 0) return null;
        
        this.selectedIndex = (this.selectedIndex - 1 + this.materials.length) % this.materials.length;
        this.selectedMaterial = this.materials[this.selectedIndex];
        return this.selectedMaterial;
    }
    
    /**
     * Get color for a material
     * @param {string} material - Material name
     * @returns {string} Hex color code
     */
    getMaterialColor(material) {
        return this.materialColors[material] || '#CCCCCC';
    }
    
    /**
     * Get materials by category
     * @param {string} category - Category name (natural, solid, soil)
     * @returns {Array<string>} Materials in category
     */
    getMaterialsByCategory(category) {
        return this.categories[category] || [];
    }
    
    /**
     * Get category for a material
     * @param {string} material - Material name
     * @returns {string|null} Category name
     */
    getCategory(material) {
        for (const [category, materials] of Object.entries(this.categories)) {
            if (materials.includes(material)) {
                return category;
            }
        }
        return null;
    }
    
    /**
     * Check if material is highlighted (selected)
     * @param {string} material - Material name
     * @returns {boolean} True if selected
     */
    isHighlighted(material) {
        return this.selectedMaterial === material;
    }
    
    /**
     * Get all available materials
     * @returns {Array<string>} All materials
     */
    getMaterials() {
        return [...this.materials];
    }
    
    /**
     * Get material preview info
     * @param {string} material - Material name
     * @returns {Object} Preview data
     */
    getPreview(material) {
        return {
            name: material,
            color: this.getMaterialColor(material),
            category: this.getCategory(material)
        };
    }
    
    /**
     * Handle mouse click
     * @param {number} mouseX - Mouse X coordinate
     * @param {number} mouseY - Mouse Y coordinate
     * @param {number} panelX - Panel X position
     * @param {number} panelY - Panel Y position
     * @returns {boolean} True if click was handled
     */
    handleClick(mouseX, mouseY, panelX, panelY) {
        const swatchSize = 40;
        const spacing = 5;
        const columns = 2;
        
        let swatchX = panelX + spacing;
        let swatchY = panelY + 30;
        let col = 0;
        
        for (let i = 0; i < this.materials.length; i++) {
            // Check if click is within this swatch
            if (mouseX >= swatchX && mouseX <= swatchX + swatchSize &&
                mouseY >= swatchY && mouseY <= swatchY + swatchSize) {
                this.selectMaterial(this.materials[i]);
                return true;
            }
            
            // Move to next position
            col++;
            if (col >= columns) {
                col = 0;
                swatchX = panelX + spacing;
                swatchY += swatchSize + spacing;
            } else {
                swatchX += swatchSize + spacing;
            }
        }
        
        return false;
    }
    
    /**
     * Check if point is within the palette panel
     * @param {number} mouseX - Mouse X coordinate
     * @param {number} mouseY - Mouse Y coordinate
     * @param {number} panelX - Panel X position
     * @param {number} panelY - Panel Y position
     * @returns {boolean} True if within bounds
     */
    containsPoint(mouseX, mouseY, panelX, panelY) {
        const swatchSize = 40;
        const spacing = 5;
        const columns = 2;
        const panelWidth = columns * swatchSize + (columns + 1) * spacing;
        const panelHeight = Math.ceil(this.materials.length / columns) * (swatchSize + spacing) + spacing + 30;
        
        return mouseX >= panelX && mouseX <= panelX + panelWidth &&
               mouseY >= panelY && mouseY <= panelY + panelHeight;
    }
    
    /**
     * Render the material palette
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    render(x, y) {
        if (typeof push === 'undefined') {
            // p5.js not available
            return;
        }
        
        push();
        
        const swatchSize = 40;
        const spacing = 5;
        const columns = 2;
        const panelWidth = columns * swatchSize + (columns + 1) * spacing;
        const panelHeight = Math.ceil(this.materials.length / columns) * (swatchSize + spacing) + spacing + 30;
        
        // Background panel
        fill(40, 40, 40, 230);
        stroke(100, 150, 255);
        strokeWeight(2);
        rect(x, y, panelWidth, panelHeight, 5);
        
        // Title
        fill(255);
        noStroke();
        textAlign(CENTER, TOP);
        textSize(14);
        text('Materials', x + panelWidth / 2, y + 5);
        
        // Material swatches
        let swatchX = x + spacing;
        let swatchY = y + 30;
        let col = 0;
        
        this.materials.forEach((material, index) => {
            const color = this.getMaterialColor(material);
            const rgb = this._hexToRgb(color);
            
            // Highlight if selected
            if (this.isHighlighted(material)) {
                fill(255, 255, 0);
                stroke(255, 255, 0);
                strokeWeight(3);
                rect(swatchX - 2, swatchY - 2, swatchSize + 4, swatchSize + 4, 3);
            }
            
            // Material swatch
            fill(rgb.r, rgb.g, rgb.b);
            stroke(200);
            strokeWeight(1);
            rect(swatchX, swatchY, swatchSize, swatchSize, 2);
            
            // Material name (abbreviated)
            fill(255);
            noStroke();
            textAlign(CENTER, CENTER);
            textSize(8);
            const abbrev = material.substring(0, 4);
            text(abbrev, swatchX + swatchSize / 2, swatchY + swatchSize / 2);
            
            // Move to next position
            col++;
            if (col >= columns) {
                col = 0;
                swatchX = x + spacing;
                swatchY += swatchSize + spacing;
            } else {
                swatchX += swatchSize + spacing;
            }
        });
        
        pop();
    }
    
    /**
     * Convert hex color to RGB
     * @param {string} hex - Hex color code
     * @returns {Object} {r, g, b}
     * @private
     */
    _hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 200, g: 200, b: 200 };
    }
}

// Export for use in Node.js tests and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MaterialPalette;
}

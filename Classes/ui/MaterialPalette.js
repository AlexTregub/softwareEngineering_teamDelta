/**
 * MaterialPalette - UI component for material selection
 * 
 * Provides a visual palette of available terrain materials with:
 * - Click selection
 * - Keyboard navigation
 * - Category organization
 * - Material preview with colors
 * - Search, favorites, recently used
 */
class MaterialPalette {
    /**
     * Create a material palette
     * @param {Array<string>} materials - Array of material names (optional, auto-loads from TERRAIN_MATERIALS_RANGED if not provided)
     */
    constructor(materials = []) {
        // Auto-populate from TERRAIN_MATERIALS_RANGED if no materials provided
        if (materials.length === 0 && typeof TERRAIN_MATERIALS_RANGED !== 'undefined') {
            this.materials = Object.keys(TERRAIN_MATERIALS_RANGED);
        } else {
            this.materials = materials;
        }
        
        this.selectedIndex = 0;
        this.selectedMaterial = this.materials.length > 0 ? this.materials[0] : null;
        
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
        
        // Material categories (will be replaced by loadCategories())
        this.categories = [];
        
        // Recently used materials (FIFO queue, max 8)
        this.recentlyUsed = [];
        
        // Search results
        this.searchResults = null;
        
        // Scroll support
        this.scrollOffset = 0;
        this.maxScrollOffset = 0;
        this.viewportHeight = 0;
        
        // Initialize components
        if (typeof MaterialSearchBar !== 'undefined') {
            this.searchBar = new MaterialSearchBar({ placeholder: 'Search materials...' });
        }
        
        if (typeof MaterialFavorites !== 'undefined') {
            this.favorites = new MaterialFavorites();
        }
        
        if (typeof MaterialPreviewTooltip !== 'undefined') {
            this.tooltip = new MaterialPreviewTooltip();
        }
        
        // Load preferences from LocalStorage
        this.loadPreferences();
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
            
            // Add to recently used
            this.addToRecentlyUsed(material);
            
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
     * Get content size for panel auto-sizing
     * @returns {Object} {width, height} Content dimensions in pixels
     */
    getContentSize() {
        const swatchSize = 40;
        const spacing = 5;
        const columns = 2;
        
        const width = columns * swatchSize + (columns + 1) * spacing;
        const rows = Math.ceil(this.materials.length / columns);
        const height = rows * (swatchSize + spacing) + spacing;
        
        return { width, height };
    }
    
    /**
     * Load categories from config
     * @param {Object} categoryConfig - Category configuration object
     */
    loadCategories(categoryConfig) {
        if (!categoryConfig || !categoryConfig.categories) {
            return;
        }
        
        this.categories = [];
        
        // Create MaterialCategory instances if available
        if (typeof MaterialCategory !== 'undefined') {
            categoryConfig.categories.forEach(catConfig => {
                const category = new MaterialCategory(
                    catConfig.id,
                    catConfig.name,
                    catConfig.materials,
                    { defaultExpanded: catConfig.defaultExpanded }
                );
                this.categories.push(category);
            });
        }
    }
    
    /**
     * Search materials by name
     * @param {string} query - Search query (case-insensitive)
     * @returns {Array<string>} Filtered materials
     */
    searchMaterials(query) {
        if (!query || query.trim() === '') {
            this.searchResults = null;
            return [...this.materials];
        }
        
        const lowerQuery = query.toLowerCase();
        this.searchResults = this.materials.filter(material => 
            material.toLowerCase().includes(lowerQuery)
        );
        
        return [...this.searchResults];
    }
    
    /**
     * Toggle category expanded state
     * @param {string} categoryId - Category ID
     */
    toggleCategory(categoryId) {
        const category = this.categories.find(cat => cat.id === categoryId);
        if (category) {
            category.toggle();
        }
    }
    
    /**
     * Expand all categories
     */
    expandAll() {
        this.categories.forEach(cat => cat.expand());
    }
    
    /**
     * Collapse all categories
     */
    collapseAll() {
        this.categories.forEach(cat => cat.collapse());
    }
    
    /**
     * Add material to recently used (FIFO, max 8)
     * @param {string} material - Material name
     */
    addToRecentlyUsed(material) {
        // Remove if already exists (move to front)
        const existingIndex = this.recentlyUsed.indexOf(material);
        if (existingIndex !== -1) {
            this.recentlyUsed.splice(existingIndex, 1);
        }
        
        // Add to front
        this.recentlyUsed.unshift(material);
        
        // Limit to 8
        if (this.recentlyUsed.length > 8) {
            this.recentlyUsed = this.recentlyUsed.slice(0, 8);
        }
    }
    
    /**
     * Get recently used materials
     * @returns {Array<string>} Recently used materials
     */
    getRecentlyUsed() {
        return [...this.recentlyUsed];
    }
    
    /**
     * Toggle favorite
     * @param {string} material - Material name
     */
    toggleFavorite(material) {
        if (this.favorites) {
            this.favorites.toggle(material);
        }
    }
    
    /**
     * Check if material is favorite
     * @param {string} material - Material name
     * @returns {boolean} True if favorite
     */
    isFavorite(material) {
        if (this.favorites) {
            return this.favorites.has(material);
        }
        return false;
    }
    
    /**
     * Get all favorites
     * @returns {Array<string>} Favorite materials
     */
    getFavorites() {
        if (this.favorites) {
            return this.favorites.getAll();
        }
        return [];
    }
    
    /**
     * Save preferences to LocalStorage
     */
    savePreferences() {
        // Save recently used
        try {
            localStorage.setItem('materialPalette.recentlyUsed', JSON.stringify(this.recentlyUsed));
        } catch (e) {
            console.warn('Failed to save recently used:', e);
        }
        
        // Save favorites
        if (this.favorites) {
            this.favorites.save();
        }
    }
    
    /**
     * Load preferences from LocalStorage
     */
    loadPreferences() {
        // Load recently used
        try {
            const stored = localStorage.getItem('materialPalette.recentlyUsed');
            if (stored) {
                this.recentlyUsed = JSON.parse(stored);
            }
        } catch (e) {
            console.warn('Failed to load recently used:', e);
            this.recentlyUsed = [];
        }
        
        // Load favorites
        if (this.favorites) {
            this.favorites.load();
        }
    }
    
    /**
     * Calculate total content height (all sections)
     * @returns {number} Total height in pixels
     */
    getTotalContentHeight() {
        let height = 0;
        
        // Search bar
        if (this.searchBar) {
            height += 45;
        }
        
        // Recently used section
        if (this.recentlyUsed.length > 0) {
            height += 20; // Label
            const rows = Math.ceil(this.recentlyUsed.length / 2);
            height += rows * 45; // 40px swatch + 5px spacing
            height += 10; // Bottom padding
        }
        
        // Categories (sum of getHeight())
        this.categories.forEach(category => {
            height += category.getHeight();
        });
        
        return height;
    }
    
    /**
     * Update scroll bounds based on content and viewport height
     */
    updateScrollBounds() {
        const contentHeight = this.getTotalContentHeight();
        this.maxScrollOffset = Math.max(0, contentHeight - this.viewportHeight);
    }
    
    /**
     * Handle mouse wheel scrolling
     * @param {number} delta - Scroll delta (positive = scroll down)
     */
    handleMouseWheel(delta) {
        this.scrollOffset += delta;
        this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, this.maxScrollOffset));
    }
    
    /**
     * Handle keyboard input (routes to search bar if focused)
     * @param {string} key - Key pressed
     * @param {number} keyCode - Key code
     * @returns {boolean} True if key press consumed
     */
    handleKeyPress(key, keyCode) {
        // If search bar has focus, route to it
        if (this.searchBar && this.searchBar.isFocused()) {
            this.searchBar.handleKeyPress(key, keyCode);
            
            // Update search results
            const query = this.searchBar.getValue();
            this.searchMaterials(query);
            
            return true; // Consumed
        }
        
        return false; // Not consumed
    }
    
    /**
     * Handle hover for tooltip
     * @param {number} mouseX - Mouse X coordinate
     * @param {number} mouseY - Mouse Y coordinate
     * @param {number} panelX - Panel X position
     * @param {number} panelY - Panel Y position
     */
    handleHover(mouseX, mouseY, panelX, panelY) {
        if (!this.tooltip) {
            return;
        }
        
        // Check if hovering over a material swatch
        // This is simplified - full implementation would check categories, etc.
        const swatchSize = 40;
        const spacing = 5;
        const columns = 2;
        
        let swatchX = panelX + spacing;
        let swatchY = panelY + spacing + 50; // Offset for search bar
        let col = 0;
        
        let hoveredMaterial = null;
        
        for (let i = 0; i < this.materials.length; i++) {
            if (mouseX >= swatchX && mouseX <= swatchX + swatchSize &&
                mouseY >= swatchY && mouseY <= swatchY + swatchSize) {
                hoveredMaterial = this.materials[i];
                break;
            }
            
            col++;
            if (col >= columns) {
                col = 0;
                swatchX = panelX + spacing;
                swatchY += swatchSize + spacing;
            } else {
                swatchX += swatchSize + spacing;
            }
        }
        
        if (hoveredMaterial) {
            this.tooltip.show(hoveredMaterial, mouseX, mouseY);
        } else {
            this.tooltip.hide();
        }
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
        // Check if click is on search bar (focus)
        if (this.searchBar && mouseY >= panelY && mouseY <= panelY + 45) {
            this.searchBar.focus();
            return true;
        }
        
        // Click elsewhere - blur search bar
        if (this.searchBar) {
            this.searchBar.blur();
        }
        
        const swatchSize = 40;
        const spacing = 5;
        const columns = 2;
        
        let swatchX = panelX + spacing;
        let swatchY = panelY + spacing;
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
        const panelHeight = Math.ceil(this.materials.length / columns) * (swatchSize + spacing) + spacing;
        
        return mouseX >= panelX && mouseX <= panelX + panelWidth &&
               mouseY >= panelY && mouseY <= panelY + panelHeight;
    }
    
    /**
     * Render the material palette
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Panel width
     * @param {number} height - Panel height
     */
    render(x, y, width, height) {
        if (typeof push === 'undefined') {
            // p5.js not available
            return;
        }
        
        // Update viewport and scroll bounds
        this.viewportHeight = height;
        this.updateScrollBounds();
        
        push();
        
        // Apply scroll offset
        let currentY = y - this.scrollOffset;
        
        // Render search bar
        if (this.searchBar) {
            this.searchBar.render(x, currentY, width, 40);
            currentY += 45;
        }
        
        // Render recently used section (if non-empty)
        if (this.recentlyUsed.length > 0) {
            fill(200);
            noStroke();
            textAlign(LEFT, TOP);
            textSize(12);
            text('Recently Used', x + 5, currentY);
            currentY += 20;
            
            // Render recently used swatches
            this._renderMaterialSwatches(this.recentlyUsed, x, currentY, width);
            const rows = Math.ceil(this.recentlyUsed.length / 2);
            currentY += rows * 45 + 10;
        }
        
        // Render categories (if loaded)
        if (this.categories.length > 0) {
            this.categories.forEach(category => {
                category.render(x, currentY, width);
                currentY += category.getHeight();
            });
        } else {
            // Fallback: render all materials (legacy mode)
            this._renderMaterialSwatches(this.materials, x, currentY, width);
        }
        
        // Render tooltip
        if (this.tooltip) {
            this.tooltip.render();
        }
        
        pop();
    }
    
    /**
     * Render material swatches
     * @param {Array<string>} materials - Materials to render
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Panel width
     * @private
     */
    _renderMaterialSwatches(materials, x, y, width) {
        const swatchSize = 40;
        const spacing = 5;
        const columns = 2;
        
        let swatchX = x + spacing;
        let swatchY = y;
        let col = 0;
        
        materials.forEach((material, index) => {
            // Highlight if selected
            if (this.isHighlighted(material)) {
                fill(255, 255, 0);
                stroke(255, 255, 0);
                strokeWeight(3);
                rect(swatchX - 2, swatchY - 2, swatchSize + 4, swatchSize + 4, 3);
            }
            
            // Try to render with terrain texture first
            let textureRendered = false;
            if (typeof TERRAIN_MATERIALS_RANGED !== 'undefined' && TERRAIN_MATERIALS_RANGED[material]) {
                const renderFunction = TERRAIN_MATERIALS_RANGED[material][1];
                if (typeof renderFunction === 'function') {
                    push();
                    noStroke();
                    if (typeof imageMode !== 'undefined') {
                        const cornerMode = typeof CORNER !== 'undefined' ? CORNER : 'corner';
                        imageMode(cornerMode);
                    }
                    renderFunction(swatchX, swatchY, swatchSize);
                    pop();
                    textureRendered = true;
                }
            }
            
            // Fallback to color swatch
            if (!textureRendered) {
                const color = this.getMaterialColor(material);
                const rgb = this._hexToRgb(color);
                fill(rgb.r, rgb.g, rgb.b);
                stroke(200);
                strokeWeight(1);
                rect(swatchX, swatchY, swatchSize, swatchSize, 2);
            }
            
            // Material name
            fill(255);
            noStroke();
            textAlign(CENTER, CENTER);
            textSize(8);
            text(material, swatchX + swatchSize / 2, swatchY + swatchSize / 2);
            
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

// Also export to window for browser
if (typeof window !== 'undefined') {
    window.MaterialPalette = MaterialPalette;
}

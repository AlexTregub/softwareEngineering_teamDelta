/**
 * Resource Inventory Bar Component
 * @module ui_new/components/resourceInventoryBar
 *
 * A generic horizontal UI bar that displays resource quantities in {SPRITE} : {CAPTION} format.
 * Used to show resources stored in buildings and carried by ants.
 */

const { InformationLine } = require('./informationLine');

class ResourceInventoryBar {
    /**
     * Creates a ResourceInventoryBar instance.
     * @param {Object} options - Configuration options
     * @param {string} [options.id] - Unique identifier
     * @param {Object} [options.position] - Position {x, y}
     * @param {Object} [options.size] - Size {width, height}
     * @param {boolean} [options.isVisible=true] - Visibility
     * @param {string} [options.backgroundColor='rgba(0, 0, 0, 0.7)'] - Background color
     * @param {number} [options.padding=10] - Padding around content
     * @param {number} [options.spacing=20] - Spacing between resource items
     * @param {string} [options.alignment='left'] - Alignment (left, center, right)
     */
    constructor(options = {}) {
        this.id = options.id ?? `resourceBar_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        this.position = options.position ?? { x: 0, y: 0 };
        this.size = options.size ?? { width: 800, height: 40 };
        this.isVisible = options.isVisible ?? true;
        this.backgroundColor = options.backgroundColor ?? 'rgba(0, 0, 0, 0.7)';
        this.padding = options.padding ?? 10;
        this.spacing = options.spacing ?? 20;
        this.alignment = options.alignment ?? 'left';
        
        // Store resource InformationLines by resourceType
        this.resourceLines = new Map();
    }

    /**
     * Add or update a resource in the inventory bar
     * @param {string} resourceType - Resource identifier (e.g., 'wood', 'stone')
     * @param {Object} options - Resource options
     * @param {p5.Image} [options.sprite] - Sprite image
     * @param {number} [options.quantity=0] - Resource quantity
     * @param {Function} [options.captionFormat] - Custom caption formatter
     * @param {string} [options.color] - Text color
     * @param {number} [options.textSize] - Text size
     * @returns {InformationLine} The created/updated information line
     */
    addResource(resourceType, options = {}) {
        const quantity = options.quantity ?? 0;
        let caption = String(quantity);
        
        // Apply custom caption format if provided
        if (options.captionFormat && typeof options.captionFormat === 'function') {
            caption = options.captionFormat(quantity);
        }
        
        // If resource already exists, update it
        if (this.resourceLines.has(resourceType)) {
            return this.updateResource(resourceType, {
                sprite: options.sprite,
                quantity: quantity,
                color: options.color,
                textSize: options.textSize
            });
        }
        
        // Create new InformationLine
        const line = new InformationLine({
            sprite: options.sprite ?? null,
            caption: caption,
            color: options.color,
            textSize: options.textSize,
            id: `${this.id}_${resourceType}`
        });
        
        // Store reference to quantity for later updates
        line.quantity = quantity;
        line.resourceType = resourceType;
        line.captionFormat = options.captionFormat;
        
        this.resourceLines.set(resourceType, line);
        return line;
    }

    /**
     * Remove a resource from the inventory bar
     * @param {string} resourceType - Resource identifier
     * @returns {boolean} True if removed, false if not found
     */
    removeResource(resourceType) {
        const line = this.resourceLines.get(resourceType);
        if (line) {
            if (typeof line.destroy === 'function') {
                line.destroy();
            }
            this.resourceLines.delete(resourceType);
            return true;
        }
        return false;
    }

    /**
     * Update an existing resource
     * @param {string} resourceType - Resource identifier
     * @param {Object} options - Update options
     * @param {p5.Image} [options.sprite] - New sprite
     * @param {number} [options.quantity] - New quantity
     * @param {string} [options.color] - New color
     * @param {number} [options.textSize] - New text size
     * @returns {boolean} True if updated, false if not found
     */
    updateResource(resourceType, options = {}) {
        const line = this.resourceLines.get(resourceType);
        if (!line) {
            return false;
        }
        
        // Update sprite if provided
        if (options.sprite !== undefined) {
            line.setSprite(options.sprite);
        }
        
        // Update quantity/caption if provided
        if (options.quantity !== undefined) {
            line.quantity = options.quantity;
            let caption = String(options.quantity);
            
            // Apply custom caption format if available
            if (line.captionFormat && typeof line.captionFormat === 'function') {
                caption = line.captionFormat(options.quantity);
            }
            
            line.setCaption(caption);
        }
        
        // Update color if provided
        if (options.color !== undefined) {
            line.setColor(options.color);
        }
        
        // Update text size if provided
        if (options.textSize !== undefined) {
            line.setTextSize(options.textSize);
        }
        
        return true;
    }

    /**
     * Get a resource InformationLine
     * @param {string} resourceType - Resource identifier
     * @returns {InformationLine|null} The information line or null if not found
     */
    getResource(resourceType) {
        return this.resourceLines.get(resourceType) || null;
    }

    /**
     * Clear all resources from the bar
     */
    clearResources() {
        this.resourceLines.forEach(line => {
            if (typeof line.destroy === 'function') {
                line.destroy();
            }
        });
        this.resourceLines.clear();
    }

    /**
     * Get the number of resources in the bar
     * @returns {number} Resource count
     */
    getResourceCount() {
        return this.resourceLines.size;
    }

    /**
     * Set the position of the bar
     * @param {number|Object} x - X coordinate or position object {x, y}
     * @param {number} [y] - Y coordinate
     */
    setPosition(x, y) {
        if (typeof x === 'object') {
            this.position.x = x.x;
            this.position.y = x.y;
        } else {
            this.position.x = x;
            this.position.y = y;
        }
    }

    /**
     * Set the size of the bar
     * @param {number|Object} width - Width or size object {width, height}
     * @param {number} [height] - Height
     */
    setSize(width, height) {
        if (typeof width === 'object') {
            this.size.width = width.width;
            this.size.height = width.height;
        } else {
            this.size.width = width;
            this.size.height = height;
        }
    }

    /**
     * Set visibility of the bar
     * @param {boolean} visible - Visibility state
     */
    setVisible(visible) {
        this.isVisible = visible;
    }

    /**
     * Render the resource inventory bar
     */
    render() {
        // Don't render if not visible
        if (!this.isVisible) {
            return;
        }
        
        // Calculate starting position based on alignment
        let currentX = this.position.x + this.padding;
        const currentY = this.position.y + this.padding;
        
        // Get array of resources for positioning
        const resources = Array.from(this.resourceLines.values());
        
        if (resources.length === 0) {
            return;
        }
        
        // Calculate total width needed for all resources
        if (this.alignment === 'center') {
            const totalWidth = this._calculateTotalWidth(resources);
            currentX = this.position.x + (this.size.width - totalWidth) / 2;
        } else if (this.alignment === 'right') {
            const totalWidth = this._calculateTotalWidth(resources);
            currentX = this.position.x + this.size.width - totalWidth - this.padding;
        }
        
        // Position and render each resource InformationLine
        resources.forEach((line, index) => {
            // Set position for this line
            line.position.x = currentX;
            line.position.y = currentY;
            line.size.height = this.size.height - (this.padding * 2);
            
            // Render the line (only if p5.js is available)
            if (typeof line.render === 'function') {
                line.render();
            }
            
            // Calculate width for this item (estimate based on sprite + text)
            const itemWidth = this._calculateItemWidth(line);
            currentX += itemWidth + this.spacing;
        });
        
        // Draw background and UI elements if p5.js is available
        if (typeof push !== 'undefined') {
            push();
            fill(this.backgroundColor);
            noStroke();
            rect(this.position.x, this.position.y, this.size.width, this.size.height);
            pop();
        }
    }

    /**
     * Calculate total width needed for all resources
     * @private
     * @param {Array} resources - Array of InformationLine resources
     * @returns {number} Total width
     */
    _calculateTotalWidth(resources) {
        let totalWidth = 0;
        resources.forEach((line, index) => {
            totalWidth += this._calculateItemWidth(line);
            if (index < resources.length - 1) {
                totalWidth += this.spacing;
            }
        });
        return totalWidth;
    }

    /**
     * Calculate width for a single resource item
     * @private
     * @param {InformationLine} line - Information line
     * @returns {number} Item width
     */
    _calculateItemWidth(line) {
        let width = 0;
        
        // Add sprite width if present
        if (line.sprite) {
            width += (this.size.height - (this.padding * 2)); // Square sprite
            width += line.padding; // Padding after sprite
        }
        
        // Add separator width if both sprite and caption exist
        if (line.sprite && line.caption) {
            if (typeof textWidth === 'function') {
                width += textWidth(" : ");
            } else {
                width += 20; // Fallback estimate
            }
        }
        
        // Add caption width
        if (line.caption) {
            if (typeof textWidth === 'function') {
                textSize(line.textSize || 12);
                width += textWidth(line.caption);
            } else {
                width += line.caption.length * 8; // Fallback estimate
            }
        }
        
        return width || 50; // Minimum width
    }

    /**
     * Cleanup and destroy the bar
     */
    destroy() {
        this.clearResources();
    }
}

module.exports = ResourceInventoryBar;

/**
 * ResourceCountDisplay Component
 * @module ui_new/components/resourceCountDisplay
 * 
 * Horizontal bar displaying resource counts (wood, stone, food, etc.)
 * Updates in real-time via EventBus integration with ResourceManager
 */

class ResourceCountDisplay {
    /**
     * Create a ResourceCountDisplay
     * @param {Object} p5Instance - p5.js instance for rendering
     * @param {Object} [options={}] - Configuration options
     * @param {number} [options.x=10] - X position
     * @param {number} [options.y=10] - Y position
     * @param {number} [options.height=40] - Height of the bar
     * @param {number} [options.iconSize=24] - Size of resource icons
     * @param {number} [options.spacing=15] - Spacing between resources
     * @param {string} [options.bgColor='rgba(0, 0, 0, 0.7)'] - Background color
     * @param {string} [options.textColor='#FFFFFF'] - Text color
     * @param {number} [options.fontSize=14] - Font size for counts
     */
    constructor(p5Instance, options = {}) {
        this.p5 = p5Instance;
        
        // Position and sizing
        this.height = options.height ?? 40;
        this.iconSize = options.iconSize ?? 24;
        this.spacing = options.spacing ?? 20;
        this.padding = 12;
        
        // Calculate width first
        this._calculateWidth();
        
        // Center horizontally at top of screen if no x provided
        this.x = options.x ?? (this.p5.width / 2 - this.width / 2);
        this.y = options.y ?? 10;
        
        // Styling
        this.bgColor = options.bgColor ?? 'rgba(0, 0, 0, 0.7)';
        this.textColor = options.textColor ?? '#FFFFFF';
        this.fontSize = options.fontSize ?? 14;
        
        // Resource data - map actual resource types to display categories
        this.resources = {
            stick: 0,      // Wood/building materials
            stone: 0,      // Stone
            greenLeaf: 0,  // Food (leaves)
            mapleLeaf: 0   // Food (leaves)
        };
        
        // Display aggregation (combine leaf types into food)
        this.displayResources = {
            wood: 0,   // stick
            stone: 0,  // stone
            food: 0    // greenLeaf + mapleLeaf
        };
        
        // Resource icons (will be loaded if available)
        this.icons = {
            wood: null,
            stone: null,
            food: null
        };
        
        // Try to load icons
        this._loadIcons();
        
        // EventBus integration
        this.eventBus = window.eventBus;
        if (this.eventBus) {
            this.eventBus.on('RESOURCE_COUNTS_UPDATED', this._handleResourceUpdate.bind(this));
        }
        
        // Query initial resource counts
        this._queryInitialResources();
    }
    
    /**
     * Load resource icons if available
     * @private
     */
    _loadIcons() {
        // Load actual resource sprites
        if (typeof loadImage === 'function') {
            try {
                this.icons.wood = loadImage('Images/Resources/stick.png');
                this.icons.stone = loadImage('Images/Resources/stone.png');
                this.icons.food = loadImage('Images/Resources/leaf.png');
            } catch (e) {
                console.warn('Failed to load resource icons:', e);
            }
        }
    }
    
    /**
     * Calculate component width based on display resources
     * @private
     */
    _calculateWidth() {
        const resourceCount = 3; // wood, stone, food
        const itemWidth = this.iconSize + 70; // icon + space for count text
        this.width = (resourceCount * itemWidth) + ((resourceCount - 1) * this.spacing) + (this.padding * 2);
    }
    
    /**
     * Query initial resource counts from global functions
     * @private
     */
    _queryInitialResources() {
        // Try to get counts from global resource totals
        if (typeof window.getResourceTotals === 'function') {
            const totals = window.getResourceTotals();
            if (totals) {
                this._updateResourceCounts(totals);
            }
        }
    }
    
    /**
     * Handle resource update event from EventBus
     * @param {Object} data - Event data with resource counts
     * @private
     */
    _handleResourceUpdate(data) {
        if (data && typeof data === 'object') {
            this._updateResourceCounts(data);
        }
    }
    
    /**
     * Update resource counts from raw data
     * Maps actual resource types to display categories
     * @param {Object} data - Resource counts object
     * @private
     */
    _updateResourceCounts(data) {
        // Update raw resources
        if (data.stick !== undefined) this.resources.stick = data.stick;
        if (data.stone !== undefined) this.resources.stone = data.stone;
        if (data.greenLeaf !== undefined) this.resources.greenLeaf = data.greenLeaf;
        if (data.mapleLeaf !== undefined) this.resources.mapleLeaf = data.mapleLeaf;
        
        // Aggregate for display
        this.displayResources.wood = this.resources.stick || 0;
        this.displayResources.stone = this.resources.stone || 0;
        this.displayResources.food = (this.resources.greenLeaf || 0) + (this.resources.mapleLeaf || 0);
    }
    
    /**
     * Update component state (called before render)
     */
    update() {
        // Animation or state updates can go here
        // For now, resources update via EventBus only
    }
    
    /**
     * Render the resource display
     */
    render() {
        this.p5.push();
        
        // Draw background
        this.p5.fill(this.bgColor);
        this.p5.noStroke();
        this.p5.rect(this.x, this.y, this.width, this.height, 5);
        
        // Draw each resource
        let currentX = this.x + this.padding;
        
        // Wood (sticks)
        this._renderResource(currentX, 'wood', this.displayResources.wood, '🪵');
        currentX += this.iconSize + 70 + this.spacing;
        
        // Stone
        this._renderResource(currentX, 'stone', this.displayResources.stone, '🪨');
        currentX += this.iconSize + 70 + this.spacing;
        
        // Food (leaves)
        this._renderResource(currentX, 'food', this.displayResources.food, '🍃');
        
        this.p5.pop();
    }
    
    /**
     * Render a single resource item
     * @param {number} x - X position
     * @param {string} resourceType - Type of resource
     * @param {number} count - Resource count
     * @param {string} emoji - Emoji fallback if no icon
     * @private
     */
    _renderResource(x, resourceType, count, emoji) {
        const centerY = this.y + (this.height / 2);
        
        // Draw icon or emoji
        if (this.icons[resourceType] && this.icons[resourceType].width > 0) {
            // Draw icon image (scaled to iconSize)
            this.p5.imageMode(this.p5.CENTER);
            this.p5.image(
                this.icons[resourceType],
                x + (this.iconSize / 2),
                centerY,
                this.iconSize,
                this.iconSize
            );
            this.p5.imageMode(this.p5.CORNER);
        } else {
            // Draw emoji fallback
            this.p5.textSize(this.iconSize);
            this.p5.textAlign(this.p5.LEFT, this.p5.CENTER);
            this.p5.text(emoji, x, centerY);
        }
        
        // Draw count with better formatting
        this.p5.fill(this.textColor);
        this.p5.textSize(this.fontSize);
        this.p5.textAlign(this.p5.LEFT, this.p5.CENTER);
        this.p5.textStyle(this.p5.BOLD);
        this.p5.text(count, x + this.iconSize + 8, centerY);
        this.p5.textStyle(this.p5.NORMAL);
    }
    
    /**
     * Check if point is within component bounds
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean} True if point is inside component
     */
    contains(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
    }
    
    /**
     * Cleanup and destroy component
     */
    destroy() {
        if (this.eventBus) {
            this.eventBus.off('RESOURCE_COUNTS_UPDATED', this._handleResourceUpdate);
        }
    }
}

// Export for Node.js test environments
if (typeof module !== 'undefined' && module.exports && typeof window === 'undefined') {
    module.exports = ResourceCountDisplay;
}

// Export for browser
if (typeof window !== 'undefined') {
    window.ResourceCountDisplay = ResourceCountDisplay;
}

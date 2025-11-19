/**
 * ResourceDisplayComponent - UI component for displaying faction resources
 * 
 * TDD Phase 1: Data Layer Only (NO rendering yet)
 * 
 * This component stores and manages resource count data (food, wood, stone)
 * for a specific faction. Rendering logic will be added in Phase 2.
 * 
 * @class ResourceDisplayComponent
 */

console.log('Loading ResourceDisplayComponent.js');

class ResourceDisplayComponent {
  /**
   * Create a resource display component
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {string} factionId - Faction identifier
   * @param {Object} [options={}] - Optional configuration
   * @param {Object} [options.sprites] - Sprite images {food, wood, stone}
   * @param {EventManager} [options.eventManager] - EventManager for auto-updates
   */
  constructor(x, y, factionId, options = {}) {
    // Handle backward compatibility: options could be sprites object
    const sprites = options.sprites || (options.eventManager ? {} : options);
    
    // Position
    this.x = x;
    this.y = y;
    
    // Faction identifier
    this.factionId = factionId;
    
    // Resource counts (internal storage)
    this._resources = {
      food: 0,
      wood: 0,
      stone: 0
    };
    
    // Visual properties
    this.scale = 1.0;
    
    // Sprite storage (deep copy to prevent external mutation)
    this.sprites = { ...sprites };
    
    // EventManager integration (Phase 6)
    this.eventManager = options.eventManager;
    this._eventUnsubscribers = [];
    
    // Setup event listeners if EventManager provided
    if (this.eventManager) {
      this._setupEventListeners();
    }
  }

  /**
   * Get current position
   * @returns {{x: number, y: number}} Position object
   */
  getPosition() {
    return { x: this.x, y: this.y };
  }

  /**
   * Set position
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  /**
   * Get resource counts (returns copy to prevent external mutation)
   * @returns {{food: number, wood: number, stone: number}} Resource counts
   */
  getResources() {
    return { ...this._resources };
  }

  /**
   * Update specific resource count
   * @param {string} type - Resource type (food, wood, stone)
   * @param {number} amount - New amount
   */
  updateResourceCount(type, amount) {
    // Normalize type to lowercase
    const resourceKey = type.toLowerCase();
    
    // Only update if valid resource type
    if (resourceKey in this._resources) {
      this._resources[resourceKey] = amount;
    } else {
      console.warn(`[ResourceDisplayComponent] Invalid resource type: ${type}`);
    }
  }

  /**
   * Set multiple resources at once (partial update supported)
   * @param {{food?: number, wood?: number, stone?: number}} resources - Resource counts to update
   */
  setResources(resources) {
    // Update only provided resources
    if (resources.food !== undefined) {
      this._resources.food = resources.food;
    }
    if (resources.wood !== undefined) {
      this._resources.wood = resources.wood;
    }
    if (resources.stone !== undefined) {
      this._resources.stone = resources.stone;
    }
  }

  /**
   * Render the resource display
   * @param {string} [gameState] - Current game state (optional)
   */
  render(gameState) {
    // Protect against missing p5.js functions
    if (typeof push !== 'function') return;
    
    try {
      push();
      
      // Apply scale to all sizes
      const iconSize = 24 * this.scale;
      const spacing = 120 * this.scale;
      const fontSize = 16 * this.scale;
      const panelHeight = iconSize + 30;
      const panelWidth = spacing * 3 + 20;
      
      // Draw semi-transparent background panel
      this._drawPanel(this.x - 10, this.y - 10, panelWidth, panelHeight);
      
      // Text settings
      if (typeof textAlign === 'function') {
        textAlign(LEFT, CENTER);
      }
      if (typeof textSize === 'function') {
        textSize(fontSize);
      }
      if (typeof fill === 'function') {
        fill(255, 255, 255);
      }
      
      // Draw each resource with its icon and count
      this._drawResource('food', this.sprites.food || '🍖', this._resources.food, 0, [255, 200, 100], iconSize, spacing, fontSize);
      this._drawResource('wood', this.sprites.wood || '🪵', this._resources.wood, 1, [139, 90, 43], iconSize, spacing, fontSize);
      this._drawResource('stone', this.sprites.stone || '🪨', this._resources.stone, 2, [150, 150, 150], iconSize, spacing, fontSize);
      
      pop();
    } catch (error) {
      // Silently handle rendering errors in tests
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[ResourceDisplayComponent] Render error:', error.message);
      }
    }
  }

  /**
   * Draw background panel
   * @private
   */
  _drawPanel(x, y, width, height) {
    try {
      if (typeof fill === 'function' && typeof rect === 'function') {
        fill(0, 0, 0, 150); // Semi-transparent black
        if (typeof noStroke === 'function') noStroke();
        rect(x, y, width, height, 5); // 5px corner radius
      }
    } catch (e) {
      // Ignore rendering errors
    }
  }

  /**
   * Draw individual resource icon and count
   * @private
   */
  _drawResource(resourceType, iconOrSprite, count, index, color, iconSize, spacing, fontSize) {
    const xPos = this.x + (index * spacing);
    const yPos = this.y + iconSize / 2;
    
    try {
      // Draw icon (sprite if available and loaded, emoji fallback)
      if (typeof iconOrSprite === 'string') {
        // Emoji fallback
        if (typeof textSize === 'function') textSize(iconSize);
        if (typeof fill === 'function') fill(255);
        if (typeof text === 'function') text(iconOrSprite, xPos, yPos);
      } else if (iconOrSprite && iconOrSprite.width > 0 && typeof image === 'function') {
        // Sprite image (only if loaded)
        if (typeof imageMode === 'function') imageMode(CENTER);
        image(iconOrSprite, xPos + iconSize / 2, yPos, iconSize, iconSize);
      } else if (iconOrSprite && iconOrSprite.width === undefined) {
        // Loading, show emoji placeholder
        if (typeof textSize === 'function') textSize(iconSize);
        if (typeof fill === 'function') fill(255);
        const emoji = resourceType === 'food' ? '🐜' : resourceType === 'wood' ? '🪵' : '🪨';
        if (typeof text === 'function') text(emoji, xPos, yPos);
      }
      
      // Draw count with color
      if (typeof textSize === 'function') textSize(fontSize);
      if (typeof fill === 'function') fill(color[0], color[1], color[2]);
      if (typeof text === 'function') {
        const countText = this._formatNumber(count);
        text(countText, xPos + iconSize + 8, yPos);
      }
    } catch (e) {
      // Ignore rendering errors
    }
  }

  /**
   * Format number with commas for thousands
   * @private
   */
  _formatNumber(num) {
    if (num === undefined || num === null) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  /**
   * Setup event listeners for resource updates (Phase 6)
   * @private
   */
  _setupEventListeners() {
    if (!this.eventManager) return;
    
    // Subscribe to RESOURCE_UPDATED event
    const handler = this._onResourceUpdated.bind(this);
    this.eventManager.on('RESOURCE_UPDATED', handler);
    
    // Store unsubscriber for cleanup
    this._eventUnsubscribers.push(() => {
      this.eventManager.off('RESOURCE_UPDATED', handler);
    });
  }

  /**
   * Handle RESOURCE_UPDATED event
   * @private
   * @param {Object} data - Event data
   * @param {string} data.factionId - Faction ID
   * @param {string} [data.resourceType] - Single resource type
   * @param {number} [data.amount] - Single resource amount
   * @param {Object} [data.resources] - Bulk resource updates {food, wood, stone}
   */
  _onResourceUpdated(data) {
    if (!data || data.factionId !== this.factionId) {
      return; // Ignore events for other factions
    }
    
    // Handle bulk updates
    if (data.resources) {
      Object.keys(data.resources).forEach(type => {
        if (this._resources.hasOwnProperty(type)) {
          this._resources[type] = data.resources[type];
        }
      });
      return;
    }
    
    // Handle single resource update
    if (data.resourceType && data.amount !== undefined) {
      const type = data.resourceType.toLowerCase();
      if (this._resources.hasOwnProperty(type)) {
        this._resources[type] = data.amount;
      }
    }
  }

  /**
   * Cleanup event listeners and resources
   */
  destroy() {
    // Unsubscribe from all events
    this._eventUnsubscribers.forEach(unsubscribe => unsubscribe());
    this._eventUnsubscribers = [];
    
    // Clear references
    this.eventManager = null;
    this.sprites = null;
  }
}

// Export for Node.js (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ResourceDisplayComponent;
}

// Export for browser (global)
if (typeof window !== 'undefined') {
  window.ResourceDisplayComponent = ResourceDisplayComponent;
}

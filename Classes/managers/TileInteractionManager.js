/**
 * TileInteractionManager - Efficient tile-based mouse interaction system
 * Uses spatial hashing to avoid O(n) object iteration for mouse events
 */
class TileInteractionManager {
  constructor(tileSize, gridWidth, gridHeight) {
    this.tileSize = tileSize;
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
    
    // Spatial hash g_map: "x,y" -> [objects in that tile]
    this.tileMap = new Map();
    
    // UI elements (buttons, menus) - checked first
    this.uiElements = [];
    
    // Debug settings
    this.debugEnabled = false;
  }

  // --- Coordinate Conversion ---

  /**
   * Convert pixel coordinates to tile coordinates
   * @param {number} pixelX - X coordinate in pixels
   * @param {number} pixelY - Y coordinate in pixels
   * @returns {Object} {tileX, tileY, centerX, centerY}
   */
  pixelToTile(pixelX, pixelY) {
    const tileX = Math.floor(pixelX / this.tileSize);
    const tileY = Math.floor(pixelY / this.tileSize);
    const centerX = tileX * this.tileSize + this.tileSize / 2;
    const centerY = tileY * this.tileSize + this.tileSize / 2;
    
    return { tileX, tileY, centerX, centerY };
  }

  /**
   * Get tile key for spatial hash g_map
   * @param {number} tileX - Tile X coordinate
   * @param {number} tileY - Tile Y coordinate
   * @returns {string} Tile key
   */
  getTileKey(tileX, tileY) {
    return `${tileX},${tileY}`;
  }

  /**
   * Check if tile coordinates are valid
   * @param {number} tileX - Tile X coordinate
   * @param {number} tileY - Tile Y coordinate
   * @returns {boolean} True if valid
   */
  isValidTile(tileX, tileY) {
    return tileX >= 0 && tileX < this.gridWidth && 
           tileY >= 0 && tileY < this.gridHeight;
  }

  // --- Object Management ---

  /**
   * Register an object in a specific tile
   * @param {Object} object - Game object (ant, resource, etc.)
   * @param {number} tileX - Tile X coordinate
   * @param {number} tileY - Tile Y coordinate
   */
  addObjectToTile(object, tileX, tileY) {
    if (!this.isValidTile(tileX, tileY)) return;
    
    const key = this.getTileKey(tileX, tileY);
    if (!this.tileMap.has(key)) {
      this.tileMap.set(key, []);
    }
    
    const objects = this.tileMap.get(key);
    if (!objects.includes(object)) {
      objects.push(object);
      
      // Sort by z-index/priority (higher values rendered on top)
      objects.sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));
    }
  }

  /**
   * Remove an object from a specific tile
   * @param {Object} object - Game object to remove
   * @param {number} tileX - Tile X coordinate
   * @param {number} tileY - Tile Y coordinate
   */
  removeObjectFromTile(object, tileX, tileY) {
    const key = this.getTileKey(tileX, tileY);
    const objects = this.tileMap.get(key);
    
    if (objects) {
      const index = objects.indexOf(object);
      if (index !== -1) {
        objects.splice(index, 1);
        
        // Clean up empty tiles
        if (objects.length === 0) {
          this.tileMap.delete(key);
        }
      }
    }
  }

  /**
   * Update object position (move from old tile to new tile)
   * @param {Object} object - Game object
   * @param {number} oldTileX - Old tile X coordinate
   * @param {number} oldTileY - Old tile Y coordinate
   * @param {number} newTileX - New tile X coordinate
   * @param {number} newTileY - New tile Y coordinate
   */
  updateObjectPosition(object, oldTileX, oldTileY, newTileX, newTileY) {
    // Remove from old tile
    if (oldTileX !== undefined && oldTileY !== undefined) {
      this.removeObjectFromTile(object, oldTileX, oldTileY);
    }
    
    // Add to new tile
    this.addObjectToTile(object, newTileX, newTileY);
    
    if (this.debugEnabled) {
      console.log(`Moved object from tile (${oldTileX},${oldTileY}) to (${newTileX},${newTileY})`);
    }
  }

  /**
   * Get all objects at specific pixel coordinates
   * @param {number} pixelX - X coordinate in pixels
   * @param {number} pixelY - Y coordinate in pixels
   * @returns {Array} Array of objects at that location
   */
  getObjectsAtPixel(pixelX, pixelY) {
    const { tileX, tileY } = this.pixelToTile(pixelX, pixelY);
    const key = this.getTileKey(tileX, tileY);
    return this.tileMap.get(key) || [];
  }

  /**
   * Get all objects in a specific tile
   * @param {number} tileX - Tile X coordinate
   * @param {number} tileY - Tile Y coordinate
   * @returns {Array} Array of objects in that tile
   */
  getObjectsInTile(tileX, tileY) {
    const key = this.getTileKey(tileX, tileY);
    return this.tileMap.get(key) || [];
  }

  // --- UI Element Management ---

  /**
   * Register a UI element (button, menu, etc.)
   * @param {Object} uiElement - UI element with containsPoint() and handleClick() methods
   * @param {number} priority - Higher priority elements are checked first
   */
  registerUIElement(uiElement, priority = 0) {
    this.uiElements.push({ element: uiElement, priority });
    
    // Sort by priority (higher first)
    this.uiElements.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Remove a UI element
   * @param {Object} uiElement - UI element to remove
   */
  unregisterUIElement(uiElement) {
    this.uiElements = this.uiElements.filter(item => item.element !== uiElement);
  }

  // --- Mouse Event Handling ---

  /**
   * Handle mouse click events
   * @param {number} mouseX - Mouse X position
   * @param {number} mouseY - Mouse Y position
   * @param {string} button - Mouse button ('LEFT', 'RIGHT', 'CENTER')
   * @returns {boolean} True if click was handled
   */
  handleMouseClick(mouseX, mouseY, button = 'LEFT') {
    if (this.debugEnabled) {
      console.log(`Mouse click at (${mouseX}, ${mouseY}) with ${button} button`);
    }

    // 1. Check UI elements first (highest priority)
    for (let { element } of this.uiElements) {
      if (element.containsPoint && element.containsPoint(mouseX, mouseY)) {
        if (element.handleClick) {
          element.handleClick(mouseX, mouseY, button);
          return { entityClicked: false, tileCenter: null };
        }
      }
    }

    // 2. Check tile-based game objects
    const { tileX, tileY, centerX, centerY } = this.pixelToTile(mouseX, mouseY);

    if (!this.isValidTile(tileX, tileY)) {
      return { entityClicked: false, tileCenter: null };
    }

    const objectsInTile = this.getObjectsInTile(tileX, tileY);

    if (objectsInTile.length > 0) {
      // Handle click on top-most object (highest z-index)
      const topObject = objectsInTile[0];

      if (topObject._interactionController) {
        topObject._interactionController.handleMousePress(mouseX, mouseY, button);
        return { entityClicked: true, tileCenter: { x: centerX, y: centerY }, clickedObject: topObject };
      } else if (topObject.handleClick) {
        topObject.handleClick(mouseX, mouseY, button);
        return { entityClicked: true, tileCenter: { x: centerX, y: centerY }, clickedObject: topObject };
      }
    }

    // 3. Handle empty tile click (movement, placement, etc.)
    const handled = this.handleTileClick(tileX, tileY, mouseX, mouseY, button);
    return { entityClicked: false, tileCenter: handled ? { x: centerX, y: centerY } : null };
  }

  /**
   * Handle mouse release events
   * @param {number} mouseX - Mouse X position
   * @param {number} mouseY - Mouse Y position
   * @param {string} button - Mouse button
   * @returns {boolean} True if release was handled
   */
  handleMouseRelease(mouseX, mouseY, button = 'LEFT') {
    // Check objects that might be handling drag operations
    const objectsInTile = this.getObjectsAtPixel(mouseX, mouseY);
    
    for (let object of objectsInTile) {
      if (object._interactionController) {
        if (object._interactionController.handleMouseRelease(mouseX, mouseY, button)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Handle empty tile clicks (override this for game-specific behavior)
   * @param {number} tileX - Tile X coordinate
   * @param {number} tileY - Tile Y coordinate
   * @param {number} mouseX - Mouse X position
   * @param {number} mouseY - Mouse Y position
   * @param {string} button - Mouse button
   * @returns {boolean} True if handled
   */
  handleTileClick(tileX, tileY, mouseX, mouseY, button) {
    // Default behavior: move selected ant to tile center
    if (typeof antManager !== 'undefined' && antManager.selectedAnt && button === 'LEFT') {
      const { centerX, centerY } = this.pixelToTile(mouseX, mouseY);
      
      // Set global mouse position to tile center for tile-based movement
      window.mouseX = centerX;
      window.mouseY = centerY;
      
      antManager.moveSelectedAnt(false); // Keep ant selected
      return true;
    }

    return false;
  }

  // --- Debug and Utility ---

  /**
   * Enable/disable debug logging
   * @param {boolean} enabled - Whether to enable debug mode
   */
  setDebugEnabled(enabled) {
    this.debugEnabled = enabled;
  }

  /**
   * Get debug information about the tile g_map
   * @returns {Object} Debug information
   */
  getDebugInfo() {
    const occupiedTiles = this.tileMap.size;
    const totalObjects = Array.from(this.tileMap.values())
      .reduce((sum, objects) => sum + objects.length, 0);

    return {
      occupiedTiles,
      totalObjects,
      uiElements: this.uiElements.length,
      gridSize: `${this.gridWidth}x${this.gridHeight}`,
      tileSize: this.tileSize
    };
  }

  /**
   * Clear all objects from the tile g_map
   */
  clear() {
    this.tileMap.clear();
    this.uiElements = [];
  }

  /**
   * Public method to add an object to the correct tile based on its position.
   * @param {Object} object - The game object to add.
   * @param {string} type - Optional type/category for future use.
   */
  addObject(object, type) {
    if (!object) return;
    let pos = object.getPosition ? object.getPosition() : (object.sprite ? object.sprite.pos : null);
    if (!pos) return;
    const { tileX, tileY } = this.pixelToTile(pos.x, pos.y);
    this.addObjectToTile(object, tileX, tileY);
  }
}

// Export for Node.js testing
if (typeof module !== "undefined" && module.exports) {
  module.exports = TileInteractionManager;
}
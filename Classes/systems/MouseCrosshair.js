/**
 * MouseCrosshair - Visual indicator showing mouse position and entity detection
 * Renders a crosshair at the mouse cursor that lights up when hovering over entities
 */
class MouseCrosshair {
  constructor() {
    this.size = 20; // Crosshair size in pixels
    this.lineWeight = 2;
    this.normalColor = [255, 255, 255, 150]; // White with transparency
    this.highlightColor = [0, 255, 0, 200]; // Green when over entity
    this.isOverEntity = false;
    this.enabled = true;
  }

  /**
   * Update crosshair state - checks if mouse is over any entity
   */
  update() {
    if (!this.enabled) return;

    this.isOverEntity = false;

    // Check if mouse is over any entity using AntManager
    if (typeof g_antManager !== 'undefined' && g_antManager && g_antManager.ants) {
      const mouseWorldPos = this._getMouseWorldPosition();
      
      for (const ant of g_antManager.ants) {
        if (this._isMouseOverEntity(ant, mouseWorldPos)) {
          this.isOverEntity = true;
          break;
        }
      }
    }

    // Also check other entities if available
    if (!this.isOverEntity && typeof g_entityManager !== 'undefined' && g_entityManager) {
      const mouseWorldPos = this._getMouseWorldPosition();
      const entities = g_entityManager.getAllEntities ? g_entityManager.getAllEntities() : [];
      
      for (const entity of entities) {
        if (this._isMouseOverEntity(entity, mouseWorldPos)) {
          this.isOverEntity = true;
          break;
        }
      }
    }
  }

  /**
   * Render the crosshair at mouse position
   */
  render() {
    if (!this.enabled) return;

    const color = this.isOverEntity ? this.highlightColor : this.normalColor;
    
    push();
    stroke(...color);
    strokeWeight(this.lineWeight);
    noFill();

    // Draw crosshair lines
    const halfSize = this.size / 2;
    
    // Horizontal line
    line(mouseX - halfSize, mouseY, mouseX + halfSize, mouseY);
    
    // Vertical line
    line(mouseX, mouseY - halfSize, mouseX, mouseY + halfSize);
    
    // Draw center circle
    strokeWeight(1);
    circle(mouseX, mouseY, 4);
    
    // Draw outer circle when over entity
    if (this.isOverEntity) {
      strokeWeight(2);
      circle(mouseX, mouseY, this.size);
    }

    pop();
  }

  /**
   * Get mouse position in world coordinates
   * @returns {Object} {x, y} world coordinates
   * @private
   */
  _getMouseWorldPosition() {
    if (typeof g_activeMap !== 'undefined' && g_activeMap && g_activeMap.renderConversion) {
      const tilePos = g_activeMap.renderConversion.convCanvasToPos([mouseX, mouseY]);
      return {
        x: tilePos[0] * TILE_SIZE,
        y: tilePos[1] * TILE_SIZE
      };
    }
    return { x: mouseX, y: mouseY };
  }

  /**
   * Check if mouse is over an entity
   * @param {Object} entity - Entity to check
   * @param {Object} mouseWorldPos - Mouse position in world coordinates
   * @returns {boolean} True if mouse is over entity
   * @private
   */
  _isMouseOverEntity(entity, mouseWorldPos) {
    if (!entity) return false;

    // Get entity position and size
    const pos = entity.getPosition ? entity.getPosition() : 
                (entity._sprite && entity._sprite.pos) ? entity._sprite.pos : 
                { x: entity.posX || 0, y: entity.posY || 0 };
    
    const size = entity.getSize ? entity.getSize() : 
                 (entity._sprite && entity._sprite.size) ? entity._sprite.size : 
                 { x: entity.sizeX || 32, y: entity.sizeY || 32 };

    // Check if mouse is within entity bounds
    return mouseWorldPos.x >= pos.x && 
           mouseWorldPos.x <= pos.x + size.x &&
           mouseWorldPos.y >= pos.y && 
           mouseWorldPos.y <= pos.y + size.y;
  }

  /**
   * Enable/disable crosshair
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Toggle crosshair
   */
  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  /**
   * Set crosshair size
   */
  setSize(size) {
    this.size = size;
  }

  /**
   * Set crosshair colors
   */
  setColors(normalColor, highlightColor) {
    if (normalColor) this.normalColor = normalColor;
    if (highlightColor) this.highlightColor = highlightColor;
  }
}

// Create global instance
if (typeof window !== 'undefined') {
  window.g_mouseCrosshair = new MouseCrosshair();
  
  // Console commands
  window.toggleMouseCrosshair = function() {
    const state = window.g_mouseCrosshair.toggle();
    return state;
  };
  
  window.setMouseCrosshairSize = function(size) {
    window.g_mouseCrosshair.setSize(size);
  };
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MouseCrosshair;
}
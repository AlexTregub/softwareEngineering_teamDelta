/**
 * @fileoverview Resource Paint Brush System
 * Interactive tool for painting resources on the game map
 * 
 * @author Software Engineering Team Delta
 * @version 1.0.0
 */

/**
 * ResourceBrush - Interactive tool for painting resources on the map
 */
class ResourceBrush extends BrushBase {
  constructor() {
    super();
    this.spawnCooldown = 100; // override default if needed
    this.showResourceChangeEffect = false;

    // Resource types available for painting - harmonize with BrushBase.availableTypes
    this.availableTypes = [
      { type: 'greenLeaf', name: 'Green Leaf', color: [0, 255, 0], factory: Resource.createGreenLeaf },
      { type: 'mapleLeaf', name: 'Maple Leaf', color: [255, 100, 0], factory: Resource.createMapleLeaf },
      { type: 'stick', name: 'Stick', color: [139, 69, 19], factory: Resource.createStick },
      { type: 'stone', name: 'Stone', color: [128, 128, 128], factory: Resource.createStone }
    ];

    this.currentIndex = 0;
    this.currentType = this.availableTypes[0];

    // Hook base onTypeChanged to show a transient visual
    this.onTypeChanged = (newType) => {
      this.showResourceChangeEffect = true;
      setTimeout(() => { this.showResourceChangeEffect = false; }, 1000);
    };

  }

  /**
   * Toggle the brush on/off
   * @returns {boolean} True if now active, false if deactivated
   */
  toggle() {
    this.isActive = !this.isActive;
    
    if (this.isActive) {
      const name = (this.currentType && this.currentType.name) ? this.currentType.name : 'Resource';
    } else {
    }
    
    return this.isActive;
  }

  // cycleType() provided by BrushBase

  setResourceType(resourceType) {
    const newType = this.setType(resourceType);
    if (newType) {
    } else {
      console.warn(`⚠️ Unknown resource type: ${resourceType}`);
    }
  }

  /**
   * Update the brush (called every frame)
   */
  update() {
    super.update();
  }

  /**
   * Handle mouse pressed events
   * @param {number} mouseX - Mouse X position
   * @param {number} mouseY - Mouse Y position
   * @param {string} button - Mouse button ('LEFT', 'RIGHT', 'CENTER')
   * @returns {boolean} True if event was handled
   */
  onMousePressed(mouseX, mouseY, button) {
    return super.onMousePressed(mouseX, mouseY, button);
  }

  /**
   * Handle mouse released events
   * @param {number} mouseX - Mouse X position
   * @param {number} mouseY - Mouse Y position
   * @param {string} button - Mouse button ('LEFT', 'RIGHT', 'CENTER')
   * @returns {boolean} True if event was handled
   */
  onMouseReleased(mouseX, mouseY, button) {
    return super.onMouseReleased(mouseX, mouseY, button);
  }

  /**
   * Paint a resource at the specified location
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  performAction(x, y) {
    // Check cooldown
    const now = Date.now();
    if (now - this.lastSpawnTime < this.spawnCooldown) {
      return;
    }

    try {
      // Add some randomness within brush area
      const offsetX = (Math.random() - 0.5) * this.brushSize;
      const offsetY = (Math.random() - 0.5) * this.brushSize;
      const finalX = x + offsetX;
      const finalY = y + offsetY;

  // Create the resource using the factory method
  const type = this.currentType || this.availableTypes[this.currentIndex];
  const resource = (type && typeof type.factory === 'function') ? type.factory(finalX, finalY) : null;
      
        if (resource) {
        // Add to resource manager
        if (g_resourceManager && typeof g_resourceManager.addResource === 'function') {
          const added = g_resourceManager.addResource(resource);
          if (added) {
            const paintedName = (type && type.name) ? type.name : 'Resource';
            this.lastSpawnTime = now;
          } else {
            console.warn('⚠️ Could not add resource - at capacity');
          }
        } else {
          console.warn('⚠️ Resource manager not available');
        }
      }
    } catch (error) {
      console.error('❌ Error painting resource:', error);
    }
  }

  /**
   * Render the brush cursor and visual feedback
   */
  render() {
    if (!this.isActive) return;

    push();

    const x = this.cursorPosition.x;
    const y = this.cursorPosition.y;
    
    // Pulsing brush area
    const pulseSize = this.brushSize + Math.sin(this.pulseAnimation) * 5;
    
    // Brush area circle
  const ct = this.currentType || this.availableTypes[this.currentIndex];
  stroke(...(ct.color || [255,255,255]), 150);
    strokeWeight(2);
    noFill();
    ellipse(x, y, pulseSize * 2, pulseSize * 2);
    
    // Inner dot
  fill(...(ct.color || [255,255,255]), 200);
    noStroke();
    ellipse(x, y, 8, 8);
    
  // Crosshair
  stroke(...(ct.color || [255,255,255]), 180);
    strokeWeight(1);
    const crossSize = 12;
    line(x - crossSize, y, x + crossSize, y);
    line(x, y - crossSize, x, y + crossSize);
    
    // Resource type indicator
    fill(0, 0, 0, 150);
    noStroke();
  const textWidth = (ct.name ? ct.name.length : 8) * 8;
    rect(x - textWidth/2 - 5, y - 35, textWidth + 10, 20, 3);
    
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(12);
  text(ct.name || 'Type', x, y - 25);
    
    // Show resource change effect
    if (this.showResourceChangeEffect) {
      fill(255, 255, 0, 150);
      noStroke();
      rect(x - textWidth/2 - 8, y - 38, textWidth + 16, 26, 5);
      
      fill(0, 0, 0);
      textAlign(CENTER, CENTER);
      textSize(12);
  text(`→ ${ct.name || 'Type'} ←`, x, y - 25);
    }
    
    // Instructions
    fill(255, 255, 255, 200);
    textAlign(LEFT, TOP);
    textSize(10);
  text('Left Click: Paint  |  Right Click: Change Type', x + 20, y + 20);

    pop();
  }

  /**
   * Get current brush state for debugging
   * @returns {Object} Debug information
   */
  getDebugInfo() {
    return {
      isActive: this.isActive,
      currentResource: (this.currentType && this.currentType.name) ? this.currentType.name : null,
      brushSize: this.brushSize,
      spawnCooldown: this.spawnCooldown,
      availableTypes: (this.availableTypes || []).map(r => r.name)
    };
  }
}

// Global instance variable
let g_resourceBrush = null;

/**
 * Initialize the resource brush system
 * @returns {ResourceBrush} The brush instance
 */
function initializeResourceBrush() {
  if (!g_resourceBrush) {
    g_resourceBrush = new ResourceBrush();
  }
  return g_resourceBrush;
}

// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
  // Make classes available globally
  window.ResourceBrush = ResourceBrush;
  window.initializeResourceBrush = initializeResourceBrush;
  window.g_resourceBrush = initializeResourceBrush();
  
  // Add global console commands for testing
  window.testResourceBrush = function() {
    
    if (!window.g_resourceBrush) {
      console.error('❌ Resource Brush not initialized');
      return false;
    }
    
    window.g_resourceBrush.toggle();
    
    return true;
  };
  
  window.checkResourceBrushState = function() {
    if (!window.g_resourceBrush) {
      console.error('❌ Resource Brush not initialized');
      return null;
    }
    
    const state = window.g_resourceBrush.getDebugInfo();
    return state;
  };
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ResourceBrush, initializeResourceBrush };
}
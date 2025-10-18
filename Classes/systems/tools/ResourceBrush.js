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
class ResourceBrush {
  constructor() {
    this.isActive = false;
    this.brushSize = 30;
    this.spawnCooldown = 100; // milliseconds between spawns
    this.lastSpawnTime = 0;
    
    // Visual feedback
    this.cursorPosition = { x: 0, y: 0 };
    this.pulseAnimation = 0;
    this.pulseSpeed = 0.05;
    
    // Resource types available for painting
    this.availableResources = [
      { type: 'greenLeaf', name: 'Green Leaf', color: [0, 255, 0], factory: Resource.createGreenLeaf },
      { type: 'mapleLeaf', name: 'Maple Leaf', color: [255, 100, 0], factory: Resource.createMapleLeaf },
      { type: 'stick', name: 'Stick', color: [139, 69, 19], factory: Resource.createStick },
      { type: 'stone', name: 'Stone', color: [128, 128, 128], factory: Resource.createStone }
    ];
    
    // Current selected resource type
    this.currentResourceIndex = 0;
    this.currentResource = this.availableResources[0];
    
    console.log('🎨 Resource Paint Brush initialized');
  }

  /**
   * Toggle the brush on/off
   * @returns {boolean} True if now active, false if deactivated
   */
  toggle() {
    this.isActive = !this.isActive;
    
    if (this.isActive) {
      console.log(`🎨 Resource brush activated - painting ${this.currentResource.name}`);
    } else {
      console.log('🎨 Resource brush deactivated');
    }
    
    return this.isActive;
  }

  /**
   * Cycle through available resource types
   */
  cycleResourceType() {
    this.currentResourceIndex = (this.currentResourceIndex + 1) % this.availableResources.length;
    this.currentResource = this.availableResources[this.currentResourceIndex];
    console.log(`🔄 Switched to painting: ${this.currentResource.name}`);
  }

  /**
   * Set specific resource type
   * @param {string} resourceType - Type of resource to paint
   */
  setResourceType(resourceType) {
    const resourceIndex = this.availableResources.findIndex(r => r.type === resourceType);
    if (resourceIndex !== -1) {
      this.currentResourceIndex = resourceIndex;
      this.currentResource = this.availableResources[resourceIndex];
      console.log(`🎯 Set resource type to: ${this.currentResource.name}`);
    } else {
      console.warn(`⚠️ Unknown resource type: ${resourceType}`);
    }
  }

  /**
   * Update the brush (called every frame)
   */
  update() {
    if (!this.isActive) return;

    // Update cursor position
    if (typeof mouseX !== 'undefined' && typeof mouseY !== 'undefined') {
      this.cursorPosition.x = mouseX;
      this.cursorPosition.y = mouseY;
    }

    // Update pulse animation
    this.pulseAnimation += this.pulseSpeed;
    if (this.pulseAnimation > Math.PI * 2) {
      this.pulseAnimation = 0;
    }
  }

  /**
   * Handle mouse pressed events
   * @param {number} mouseX - Mouse X position
   * @param {number} mouseY - Mouse Y position
   * @param {string} button - Mouse button ('LEFT', 'RIGHT', 'CENTER')
   * @returns {boolean} True if event was handled
   */
  onMousePressed(mouseX, mouseY, button) {
    if (!this.isActive) return false;

    if (button === 'LEFT') {
      this.paintResource(mouseX, mouseY);
      return true;
    } else if (button === 'RIGHT') {
      this.cycleResourceType();
      return true;
    }

    return false;
  }

  /**
   * Handle mouse released events
   * @param {number} mouseX - Mouse X position
   * @param {number} mouseY - Mouse Y position
   * @param {string} button - Mouse button ('LEFT', 'RIGHT', 'CENTER')
   * @returns {boolean} True if event was handled
   */
  onMouseReleased(mouseX, mouseY, button) {
    if (!this.isActive) return false;
    return false; // No special handling for mouse release
  }

  /**
   * Paint a resource at the specified location
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  paintResource(x, y) {
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
      const resource = this.currentResource.factory(finalX, finalY);
      
      if (resource) {
        // Add to resource manager
        if (g_resourceManager && typeof g_resourceManager.addResource === 'function') {
          const added = g_resourceManager.addResource(resource);
          if (added) {
            console.log(`🎨 Painted ${this.currentResource.name} at (${Math.round(finalX)}, ${Math.round(finalY)})`);
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
    stroke(...this.currentResource.color, 150);
    strokeWeight(2);
    noFill();
    ellipse(x, y, pulseSize * 2, pulseSize * 2);
    
    // Inner dot
    fill(...this.currentResource.color, 200);
    noStroke();
    ellipse(x, y, 8, 8);
    
    // Crosshair
    stroke(...this.currentResource.color, 180);
    strokeWeight(1);
    const crossSize = 12;
    line(x - crossSize, y, x + crossSize, y);
    line(x, y - crossSize, x, y + crossSize);
    
    // Resource type indicator
    fill(0, 0, 0, 150);
    noStroke();
    const textWidth = this.currentResource.name.length * 8;
    rect(x - textWidth/2 - 5, y - 35, textWidth + 10, 20, 3);
    
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(12);
    text(this.currentResource.name, x, y - 25);
    
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
      currentResource: this.currentResource.name,
      brushSize: this.brushSize,
      spawnCooldown: this.spawnCooldown,
      availableTypes: this.availableResources.map(r => r.name)
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
    console.log('🎨 Resource Brush system initialized');
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
    console.log('🧪 Testing Resource Brush...');
    
    if (!window.g_resourceBrush) {
      console.error('❌ Resource Brush not initialized');
      return false;
    }
    
    window.g_resourceBrush.toggle();
    console.log('✅ Resource Brush activated for testing');
    console.log('📊 Brush state:', window.g_resourceBrush.getDebugInfo());
    
    return true;
  };
  
  window.checkResourceBrushState = function() {
    if (!window.g_resourceBrush) {
      console.error('❌ Resource Brush not initialized');
      return null;
    }
    
    const state = window.g_resourceBrush.getDebugInfo();
    console.log('🎨 Resource Brush state:', state);
    return state;
  };
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ResourceBrush, initializeResourceBrush };
}
/**
 * AntView.js
 * 
 * Ant-specific rendering view extending EntityView.
 * Handles all ant visual elements: resource indicators, health bars,
 * job sprites, state indicators, coordinate conversions.
 * 
 * TDD Implementation: Phase 2 - Ant MVC Conversion
 * Test Coverage: 40+ tests ensuring complete visual parity with ant class
 */

const EntityView = require('./EntityView');

// Sprite cache for performance
const spriteCache = {};

// Default sprite placeholder
let defaultAntSprite = null;

class AntView extends EntityView {
  constructor(model) {
    super(model);
    this.sprite = this._loadDefaultSprite();
  }
  
  /**
   * Load default ant sprite
   * @private
   */
  _loadDefaultSprite() {
    if (!defaultAntSprite) {
      defaultAntSprite = { width: 32, height: 32 }; // Placeholder in Node.js
    }
    return defaultAntSprite;
  }
  
  /**
   * Complete render method - renders all ant visual elements
   */
  render() {
    if (!this.model.isActive()) {
      return;
    }
    
    // Isolate rendering context
    if (typeof push === 'function') push();
    
    // Base entity rendering (sprite, selection highlight)
    super.render();
    
    // Ant-specific rendering
    this.renderHealthBar();
    this.renderResourceIndicator();
    
    if (this.model.isBoxHovered()) {
      this.renderBoxHover();
    }
    
    if (typeof pop === 'function') pop();
  }
  
  /**
   * Render resource count indicator above ant
   */
  renderResourceIndicator() {
    const resourceManager = this.model.getResourceManager();
    if (!resourceManager) return;
    
    const resourceCount = resourceManager.getResourceCount();
    if (resourceCount <= 0) return;
    
    const pos = this.model.getPosition();
    const size = this.model.getSize();
    
    // Calculate screen position
    let screenX = pos.x + size.x / 2;
    let screenY = pos.y - 12;
    
    // Use terrain coordinate conversion if available
    if (typeof g_activeMap !== 'undefined' && g_activeMap && 
        g_activeMap.renderConversion && typeof TILE_SIZE !== 'undefined') {
      const tileX = pos.x / TILE_SIZE;
      const tileY = pos.y / TILE_SIZE;
      
      const screenPos = g_activeMap.renderConversion.convPosToCanvas([tileX, tileY]);
      screenX = screenPos[0] + size.x / 2;
      screenY = screenPos[1] - 12;
    }
    
    // Render yellow text
    fill(255, 255, 0);
    textAlign(CENTER);
    text(resourceCount, screenX, screenY);
  }
  
  /**
   * Render health bar
   */
  renderHealthBar() {
    // Delegate to health controller if available
    const healthController = this.model._healthController;
    if (healthController && typeof healthController.render === 'function') {
      healthController.render();
      return;
    }
    
    // Fallback rendering
    const health = this.model.getHealth();
    const maxHealth = this.model.getMaxHealth();
    if (health >= maxHealth) return; // Don't show bar at full health
    
    const pos = this.model.getPosition();
    const size = this.model.getSize();
    
    const barWidth = size.x;
    const barHeight = 4;
    const barX = pos.x;
    const barY = pos.y - 8;
    
    // Background (black)
    fill(0);
    noStroke();
    rect(barX, barY, barWidth, barHeight);
    
    // Foreground (health percentage)
    const healthPercent = health / maxHealth;
    const foregroundWidth = barWidth * healthPercent;
    
    // Color based on health percentage
    if (healthPercent > 0.6) {
      fill(0, 255, 0); // Green
    } else if (healthPercent > 0.3) {
      fill(255, 255, 0); // Yellow
    } else {
      fill(255, 0, 0); // Red
    }
    
    rect(barX, barY, foregroundWidth, barHeight);
  }
  
  /**
   * Render box hover highlight
   */
  renderBoxHover() {
    if (!this.model.isBoxHovered()) return;
    
    const pos = this.model.getPosition();
    const size = this.model.getSize();
    
    // Highlight border
    stroke(100, 200, 255); // Light blue
    noFill();
    rect(pos.x, pos.y, size.x, size.y);
  }
  
  /**
   * Get job-specific sprite
   * @returns {Object} Sprite for current job
   */
  getJobSprite() {
    const jobName = this.model.getJobName();
    
    // Check cache first
    if (spriteCache[jobName]) {
      return spriteCache[jobName];
    }
    
    // Load job-specific sprite (placeholder in Node.js)
    const sprite = this._loadJobSprite(jobName);
    spriteCache[jobName] = sprite;
    
    return sprite;
  }
  
  /**
   * Load job-specific sprite
   * @private
   */
  _loadJobSprite(jobName) {
    // In Node.js, return placeholder
    // In browser, would use loadImage()
    return { 
      width: 32, 
      height: 32, 
      jobName: jobName 
    };
  }
  
  /**
   * Get state indicator text
   * @returns {string} Current state description
   */
  getStateIndicator() {
    const stateMachine = this.model.getStateMachine();
    if (!stateMachine) return 'unknown';
    
    const currentState = stateMachine.getCurrentState();
    return currentState || 'idle';
  }
  
  /**
   * Convert world coordinates to screen coordinates
   * @param {number} worldX - World X coordinate
   * @param {number} worldY - World Y coordinate
   * @returns {Object} Screen coordinates {x, y}
   */
  worldToScreen(worldX, worldY) {
    // Use terrain coordinate system if available
    if (typeof g_activeMap !== 'undefined' && g_activeMap && 
        g_activeMap.renderConversion && typeof TILE_SIZE !== 'undefined') {
      const tileX = worldX / TILE_SIZE;
      const tileY = worldY / TILE_SIZE;
      
      const screenPos = g_activeMap.renderConversion.convPosToCanvas([tileX, tileY]);
      return { x: screenPos[0], y: screenPos[1] };
    }
    
    // Fallback: no conversion
    return { x: worldX, y: worldY };
  }
  
  /**
   * Convert screen coordinates to world coordinates
   * @param {number} screenX - Screen X coordinate
   * @param {number} screenY - Screen Y coordinate
   * @returns {Object} World coordinates {x, y}
   */
  screenToWorld(screenX, screenY) {
    // Use terrain coordinate system if available
    if (typeof g_activeMap !== 'undefined' && g_activeMap && 
        g_activeMap.renderConversion && typeof TILE_SIZE !== 'undefined') {
      const tilePos = g_activeMap.renderConversion.convCanvasToPos([screenX, screenY]);
      return { 
        x: tilePos[0] * TILE_SIZE, 
        y: tilePos[1] * TILE_SIZE 
      };
    }
    
    // Fallback: no conversion
    return { x: screenX, y: screenY };
  }
}

// Node.js export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AntView;
}

// Browser global export
if (typeof window !== 'undefined') {
  window.AntView = AntView;
}

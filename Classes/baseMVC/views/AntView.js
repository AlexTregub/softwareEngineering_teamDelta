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

// Node.js: Load EntityView
if (typeof require !== 'undefined' && typeof module !== 'undefined' && module.exports) {
  const EntityView = require('./EntityView');
  global.EntityView = EntityView;
}

// Sprite cache for performance
const spriteCache = {};

// Default sprite placeholder for Node.js testing
let defaultAntSprite = null;

class AntView extends EntityView {
  constructor(model, options = {}) {
    super(model, options);  // Pass options to EntityView (includes camera)
    const jobName = model.getJobName();
    const faction = model.getFaction();
    this.sprite = this._loadSpriteForJob(jobName, faction);
    this._lastJobName = jobName;
    this._lastFaction = faction;
  }
  
  /**
   * Load sprite based on job and faction
   * @private
   */
  _loadSpriteForJob(jobName, faction) {
    const spriteImage = AntSprites.getSprite(jobName, faction);
    // Return object with img property for EntityView compatibility
    const spriteObject = { img: spriteImage, width: 32, height: 32 };
    return spriteObject;
  }
  
  /**
   * Update sprite if job or faction changed
   */
  updateSprite() {
    const currentJob = this.model.getJobName();
    const currentFaction = this.model.getFaction();
    
    // Only reload sprite if job or faction changed
    if (currentJob !== this._lastJobName || currentFaction !== this._lastFaction) {
      this.sprite = this._loadSpriteForJob(currentJob, currentFaction);
      this._lastJobName = currentJob;
      this._lastFaction = currentFaction;
    }
  }
  
  /**
   * Complete render method - renders all ant visual elements
   */
  render() {
    if (!this.model.isActive()) {
      return;
    }
    
    // Update sprite if job/faction changed
    this.updateSprite();
    
    // Isolate rendering context
    push();
    
    // Base entity rendering (sprite, selection highlight)
    super.render();
    
    // Ant-specific rendering
    this.renderHealthBar();
    this.renderResourceIndicator();
    
    if (this.model.isBoxHovered()) {
      this.renderBoxHover();
    }
    
    pop();
  }
  
  /**
   * Render resource count indicator above ant
   * Uses model's getScreenPosition() for proper grid alignment
   */
  renderResourceIndicator() {
    const resourceManager = this.model.getResourceManager();
    if (!resourceManager) return;
    
    const resourceCount = resourceManager.getResourceCount();
    if (resourceCount <= 0) return;
    
    // Use screen position (already converted from grid coordinates)
    const screenPos = this.model.getScreenPosition ? this.model.getScreenPosition() : this.model.getPosition();
    const size = this.model.getSize();
    
    // Position text above the ant
    const textX = screenPos.x + size.x / 2;
    const textY = screenPos.y - 12;
    
    // Render yellow text
    fill(255, 255, 0);
    textAlign(CENTER);
    text(resourceCount, textX, textY);
  }
  
  /**
   * Render health bar
   */
  renderHealthBar() {
    const healthController = this.model.getHealthController();
    
    if (!healthController) {
      console.error('HealthController missing for ant', this.model.getId(), '- This is a BUG, not a fallback scenario');
      return;
    }
    
    if (typeof healthController.render !== 'function') {
      console.error('HealthController.render() not a function for ant', this.model.getId());
      return;
    }
    
    healthController.render();
  }
  
  /**
   * Render box hover highlight
   */
  renderBoxHover() {
    if (!this.model.isBoxHovered()) return;
    
    // Use screen position (already converted from grid coordinates)
    const screenPos = this.model.getScreenPosition ? this.model.getScreenPosition() : this.model.getPosition();
    const size = this.model.getSize();
    
    // Highlight border
    stroke(100, 200, 255); // Light blue
    noFill();
    rect(screenPos.x, screenPos.y, size.x, size.y);
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
   * Uses camera from EntityView
   * @param {number} worldX - World X coordinate
   * @param {number} worldY - World Y coordinate
   * @returns {Object} Screen coordinates {x, y}
   */
  worldToScreen(worldX, worldY) {
    // Use camera from parent EntityView
    if (this.camera && typeof this.camera.worldToScreen === 'function') {
      return this.camera.worldToScreen(worldX, worldY);
    }
    console.error('Camera not available for worldToScreen conversion - This is a BUG');
    throw new Error('Camera required for coordinate conversion');
  }
  
  /**
   * Convert screen coordinates to world coordinates
   * Uses camera from EntityView
   * @param {number} screenX - Screen X coordinate
   * @param {number} screenY - Screen Y coordinate
   * @returns {Object} World coordinates {x, y}
   */
  screenToWorld(screenX, screenY) {
    // Use camera from parent EntityView
    if (this.camera && typeof this.camera.screenToWorld === 'function') {
      return this.camera.screenToWorld(screenX, screenY);
    }
    console.error('Camera not available for screenToWorld conversion - This is a BUG');
    throw new Error('Camera required for coordinate conversion');
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

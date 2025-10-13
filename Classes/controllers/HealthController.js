/**
 * @fileoverview HealthController - Manages health rendering and display for entities
 * @module HealthController
 * @author Software Engineering Team Delta
 * @version 1.0.0
 */

/**
 * HealthController - Controls health display and management for entities
 * Renders health bars above entities when health is not at maximum
 */
class HealthController {
  constructor(entity) {
    this.entity = entity;
    
    // Health bar configuration
    this.config = {
      barWidth: null, // Will be set to entity width
      barHeight: 4,
      offsetY: 8, // Distance above entity
      backgroundColor: [255, 0, 0], // Red background
      foregroundColor: [0, 255, 0], // Green foreground
      borderColor: [255, 255, 255], // White border
      borderWidth: 1,
      showWhenFull: false, // Only show when health < max
      fadeInDuration: 500, // ms
      fadeOutDuration: 1000, // ms
      displayDuration: 3000 // ms to show after damage
    };
    
    // Animation state
    this.lastDamageTime = 0;
    this.isVisible = false;
    this.alpha = 0;
    this.targetAlpha = 0;
  }

  /**
   * Update the health controller (called each frame)
   */
  update() {
    if (!this.entity) return;

    const currentTime = Date.now();
    const health = this.entity.health || 0;
    const maxHealth = this.entity.maxHealth || 100;
    
    // Determine if health bar should be visible
    const shouldShow = health < maxHealth || this.config.showWhenFull;
    const recentDamage = (currentTime - this.lastDamageTime) < this.config.displayDuration;
    
    if (shouldShow && (health < maxHealth || recentDamage)) {
      this.targetAlpha = 1.0;
      this.isVisible = true;
    } else {
      this.targetAlpha = 0.0;
      if (this.alpha <= 0.1) {
        this.isVisible = false;
      }
    }
    
    // Animate alpha
    if (this.alpha < this.targetAlpha) {
      this.alpha = Math.min(this.targetAlpha, this.alpha + (1.0 / 30)); // Fade in over ~30 frames
    } else if (this.alpha > this.targetAlpha) {
      this.alpha = Math.max(this.targetAlpha, this.alpha - (1.0 / 60)); // Fade out over ~60 frames
    }
  }

  /**
   * Render the health bar
   */
  render() {
    if (!this.isVisible || !this.entity || typeof fill === 'undefined') {
      return;
    }

    const health = this.entity.health || 0;
    const maxHealth = this.entity.maxHealth || 100;
    
    if (health >= maxHealth && !this.config.showWhenFull) {
      return;
    }

    const pos = this.entity.getPosition ? this.entity.getPosition() : { x: this.entity.posX || 0, y: this.entity.posY || 0 };
    const size = this.entity.getSize ? this.entity.getSize() : { x: this.entity.sizeX || 20, y: this.entity.sizeY || 20 };
    
    // Set bar width to entity width if not configured
    const barWidth = this.config.barWidth || size.x;
    const barHeight = this.config.barHeight;
    
    // Calculate position (centered above entity)
    const barX = pos.x + (size.x - barWidth) / 2;
    const barY = pos.y - this.config.offsetY - barHeight;
    
    // Calculate health percentage
    const healthPercent = Math.max(0, Math.min(1, health / maxHealth));
    
    // Save current drawing state
    push();
    
    // Apply alpha for fade effect
    const alpha = this.alpha * 255;
    
    // Draw border
    if (this.config.borderWidth > 0) {
      stroke(this.config.borderColor[0], this.config.borderColor[1], this.config.borderColor[2], alpha);
      strokeWeight(this.config.borderWidth);
      noFill();
      rect(barX - this.config.borderWidth, barY - this.config.borderWidth, 
           barWidth + this.config.borderWidth * 2, barHeight + this.config.borderWidth * 2);
    }
    
    // Draw background
    fill(this.config.backgroundColor[0], this.config.backgroundColor[1], this.config.backgroundColor[2], alpha);
    noStroke();
    rect(barX, barY, barWidth, barHeight);
    
    // Draw health foreground
    if (healthPercent > 0) {
      fill(this.config.foregroundColor[0], this.config.foregroundColor[1], this.config.foregroundColor[2], alpha);
      rect(barX, barY, barWidth * healthPercent, barHeight);
    }
    
    // Restore drawing state
    pop();
  }

  /**
   * Notify that the entity took damage (triggers display)
   */
  onDamage() {
    this.lastDamageTime = Date.now();
    this.targetAlpha = 1.0;
    this.isVisible = true;
  }

  /**
   * Set health bar configuration
   * @param {Object} newConfig - Configuration options
   */
  setConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current health bar configuration
   * @returns {Object} Current configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Force show/hide the health bar
   * @param {boolean} visible - Whether to show the health bar
   */
  setVisible(visible) {
    this.targetAlpha = visible ? 1.0 : 0.0;
    if (visible) {
      this.isVisible = true;
      this.lastDamageTime = Date.now();
    }
  }

  /**
   * Check if health bar is currently visible
   * @returns {boolean} True if visible
   */
  getVisible() {
    return this.isVisible && this.alpha > 0.1;
  }

  /**
   * Get debug information
   * @returns {Object} Debug info
   */
  getDebugInfo() {
    if (!this.entity) return {};
    
    return {
      controllerType: 'HealthController',
      isVisible: this.isVisible,
      alpha: this.alpha,
      targetAlpha: this.targetAlpha,
      health: this.entity.health || 0,
      maxHealth: this.entity.maxHealth || 100,
      healthPercent: Math.round(((this.entity.health || 0) / (this.entity.maxHealth || 100)) * 100),
      lastDamageTime: this.lastDamageTime,
      timeSinceDamage: Date.now() - this.lastDamageTime
    };
  }

  /**
   * Cleanup controller
   */
  destroy() {
    this.entity = null;
  }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HealthController;
}

// Make available globally for browser
if (typeof window !== 'undefined') {
  window.HealthController = HealthController;
}
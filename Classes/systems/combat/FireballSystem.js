/**
 * @fileoverview Fireball System for Queen Ant
 * Creates and manages fireball projectiles that deal damage to ants
 * 
 * @author Software Engineering Team Delta
 * @version 1.0.0
 */

/**
 * Fireball - Projectile that travels and deals damage on impact
 */
class Fireball {
  constructor(startX, startY, targetX, targetY, damage = 25) {
    this.x = startX;
    this.y = startY;
    this.targetX = targetX;
    this.targetY = targetY;
    this.damage = damage;
    
    // Calculate direction and speed
    const dx = targetX - startX;
    const dy = targetY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    this.speed = 300; // pixels per second
    this.velocityX = (dx / distance) * this.speed;
    this.velocityY = (dy / distance) * this.speed;
    
    // Visual properties
    this.size = 12;
    this.color = [255, 100, 0, 255]; // Orange
    this.trailColor = [255, 150, 0, 150]; // Lighter orange trail
    this.glowColor = [255, 200, 100, 100]; // Yellow glow
    
    // Animation properties
    this.animation = 0;
    this.animationSpeed = 0.3;
    this.isActive = true;
    this.hasExploded = false;
    this.hasError = false; // Error tracking for cleanup
    
    // Trail system
    this.trail = [];
    this.maxTrailLength = 8;
    
    // Collision detection
    this.collisionRadius = 15;
    
    logNormal(`🔥 Fireball created from (${Math.round(startX)}, ${Math.round(startY)}) to (${Math.round(targetX)}, ${Math.round(targetY)})`);
  }

  /**
   * Update fireball position and check for collisions
   * @param {number} deltaTime - Time since last update in seconds
   */
  update(deltaTime) {
    if (!this.isActive || this.hasExploded) return;

    try {
      // Validate deltaTime
      if (typeof deltaTime !== 'number' || deltaTime <= 0 || !isFinite(deltaTime)) {
        deltaTime = 1 / 60; // Fallback to 60 FPS
      }

      // Update animation
      this.animation += this.animationSpeed;
      if (this.animation > Math.PI * 2) {
        this.animation = 0;
      }

      // Add current position to trail
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > this.maxTrailLength) {
        this.trail.shift();
      }

      // Move fireball
      this.x += this.velocityX * deltaTime;
      this.y += this.velocityY * deltaTime;

      // Check if fireball has reached target area or gone off screen
      const distanceToTarget = Math.sqrt(
        (this.x - this.targetX) ** 2 + (this.y - this.targetY) ** 2
      );

      if (distanceToTarget < 20 || this.isOffScreen()) {
        this.explode();
        return;
      }

      // Check for ant collisions
      this.checkAntCollisions();
    } catch (error) {
      console.error('❌ Error in Fireball.update():', error);
      this.hasError = true;
      this.explode(); // Safely remove the problematic fireball
    }
  }

  /**
   * Check if fireball is off screen
   * @returns {boolean} True if off screen
   */
  isOffScreen() {
    const margin = 50;
    return (
      this.x < -margin || 
      this.x > (typeof width !== 'undefined' ? width : 800) + margin ||
      this.y < -margin || 
      this.y > (typeof height !== 'undefined' ? height : 800) + margin
    );
  }

  /**
   * Check for collisions with ants
   */
  checkAntCollisions() {
    if (typeof ants === 'undefined' || !Array.isArray(ants)) return;

    for (const ant of ants) {
      if (!ant || !ant.isActive || ant.health <= 0) continue;

      const antPos = ant.getPosition();
      const distance = Math.sqrt(
        (this.x - antPos.x) ** 2 + (this.y - antPos.y) ** 2
      );

      if (distance <= this.collisionRadius) {
        this.hitAnt(ant);
        return;
      }
    }
  }

  /**
   * Handle hitting an ant
   * @param {Object} ant - The ant that was hit
   */
  hitAnt(ant) {
    logNormal(`🔥 Fireball hit ant ${ant._antIndex || 'unknown'}!`);
    
    // Deal damage to the ant
    if (typeof ant.takeDamage === 'function') {
      ant.takeDamage(this.damage);
      logNormal(`💥 Dealt ${this.damage} damage to ant. Health: ${ant.health}/${ant._maxHealth}`);
    }

    // Create explosion effect
    this.explode();

    // Show damage number if render controller exists
    if (ant._renderController && typeof ant._renderController.showDamageNumber === 'function') {
      ant._renderController.showDamageNumber(this.damage, [255, 100, 0]);
    }
  }

  /**
   * Explode the fireball
   */
  explode() {
    this.hasExploded = true;
    this.isActive = false;
    logNormal(`💥 Fireball exploded at (${Math.round(this.x)}, ${Math.round(this.y)})`);
    
    // Could add particle effects here later
  }

  /**
   * Render the fireball
   */
  render() {
    if (!this.isActive) return;

    // Convert world coordinates to screen coordinates
    let screenX = this.x;
    let screenY = this.y;
    
    if (typeof g_activeMap !== 'undefined' && g_activeMap && g_activeMap.renderConversion && typeof TILE_SIZE !== 'undefined') {
      const tileX = this.x / TILE_SIZE;
      const tileY = this.y / TILE_SIZE;
      const screenPos = g_activeMap.renderConversion.convPosToCanvas([tileX, tileY]);
      screenX = screenPos[0];
      screenY = screenPos[1];
    }

    push();

    // Draw trail (needs to convert each trail point)
    this.renderTrail();

    // Draw glow effect
    this.renderGlow(screenX, screenY);

    // Draw main fireball
    this.renderFireball(screenX, screenY);

    pop();
  }

  /**
   * Render the fireball trail
   */
  renderTrail() {
    for (let i = 0; i < this.trail.length; i++) {
      const trailPoint = this.trail[i];
      const alpha = (i / this.trail.length) * this.trailColor[3];
      
      // Convert trail point to screen coordinates
      let screenX = trailPoint.x;
      let screenY = trailPoint.y;
      
      if (typeof g_activeMap !== 'undefined' && g_activeMap && g_activeMap.renderConversion && typeof TILE_SIZE !== 'undefined') {
        const tileX = trailPoint.x / TILE_SIZE;
        const tileY = trailPoint.y / TILE_SIZE;
        const screenPos = g_activeMap.renderConversion.convPosToCanvas([tileX, tileY]);
        screenX = screenPos[0];
        screenY = screenPos[1];
      }
      
      fill(this.trailColor[0], this.trailColor[1], this.trailColor[2], alpha);
      noStroke();
      
      const trailSize = (i / this.trail.length) * this.size * 0.8;
      ellipse(screenX, screenY, trailSize, trailSize);
    }
  }

  /**
   * Render the glow effect
   */
  renderGlow(screenX, screenY) {
    const glowSize = this.size * 2.5 + Math.sin(this.animation) * 3;
    fill(this.glowColor[0], this.glowColor[1], this.glowColor[2], this.glowColor[3]);
    noStroke();
    ellipse(screenX, screenY, glowSize, glowSize);
  }

  /**
   * Render the main fireball
   */
  renderFireball(screenX, screenY) {
    const fireballSize = this.size + Math.sin(this.animation) * 2;
    
    // Outer fire layer
    fill(this.color[0], this.color[1], this.color[2], this.color[3]);
    noStroke();
    ellipse(screenX, screenY, fireballSize, fireballSize);
    
    // Inner core
    fill(255, 255, 100, 200); // Bright yellow core
    ellipse(screenX, screenY, fireballSize * 0.6, fireballSize * 0.6);
    
    // Hot center
    fill(255, 255, 255, 150); // White hot center
    ellipse(screenX, screenY, fireballSize * 0.3, fireballSize * 0.3);
  }

  /**
   * Get debug information
   * @returns {Object} Debug info
   */
  getDebugInfo() {
    return {
      position: { x: this.x, y: this.y },
      target: { x: this.targetX, y: this.targetY },
      velocity: { x: this.velocityX, y: this.velocityY },
      damage: this.damage,
      isActive: this.isActive,
      hasExploded: this.hasExploded,
      trailLength: this.trail.length
    };
  }
}

/**
 * FireballManager - Manages multiple fireballs
 */
class FireballManager {
  constructor() {
    this.fireballs = [];
    this.lastUpdateTime = null; // Track time for deltaTime calculation
  }

  /**
   * Create a new fireball
   * @param {number} startX - Starting X position
   * @param {number} startY - Starting Y position
   * @param {number} targetX - Target X position
   * @param {number} targetY - Target Y position
   * @param {number} damage - Damage to deal
   * @returns {Fireball} The created fireball
   */
  createFireball(startX, startY, targetX, targetY, damage = 25) {
    const fireball = new Fireball(startX, startY, targetX, targetY, damage);
    this.fireballs.push(fireball);
    return fireball;
  }

  /**
   * Update all fireballs
   */
  update() {
    try {
      // Calculate deltaTime - p5.js doesn't provide deltaTime by default
      const currentTime = millis();
      const dt = this.lastUpdateTime ? (currentTime - this.lastUpdateTime) / 1000 : (1 / 60);
      this.lastUpdateTime = currentTime;
      
      // Clamp deltaTime to prevent huge jumps (e.g., when debugging or tab switching)
      const clampedDt = Math.min(dt, 1 / 30); // Max 30 FPS minimum
      
      // Update all active fireballs
      for (const fireball of this.fireballs) {
        if (fireball && fireball.isActive) {
          fireball.update(clampedDt);
        }
      }

      // Remove inactive fireballs
      this.fireballs = this.fireballs.filter(fireball => fireball && fireball.isActive);
    } catch (error) {
      console.error('❌ Error in FireballManager.update():', error);
      // Clear problematic fireballs to prevent further errors
      this.fireballs = this.fireballs.filter(fireball => fireball && fireball.isActive && !fireball.hasError);
    }
  }

  /**
   * Render all fireballs
   */
  render() {
    for (const fireball of this.fireballs) {
      fireball.render();
    }
  }

  /**
   * Clear all fireballs
   */
  clear() {
    this.fireballs = [];
  }

  /**
   * Get count of active fireballs
   * @returns {number} Number of active fireballs
   */
  getActiveCount() {
    return this.fireballs.filter(f => f.isActive).length;
  }
}

// Create global instance
let g_fireballManager = null;

/**
 * Initialize the fireball system
 */
function initializeFireballSystem() {
  if (!g_fireballManager) {
    g_fireballManager = new FireballManager();
    logNormal('🔥 Fireball system initialized');
  }
  return g_fireballManager;
}

// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
  // Make classes available globally
  window.Fireball = Fireball;
  window.FireballManager = FireballManager;
  window.initializeFireballSystem = initializeFireballSystem;
  window.g_fireballManager = initializeFireballSystem();
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Fireball, FireballManager, initializeFireballSystem };
}
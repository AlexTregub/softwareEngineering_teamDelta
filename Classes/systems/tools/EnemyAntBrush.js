/**
 * @fileoverview Enemy Ant Brush Tool
 * Allows painting enemy ants onto the game world with visual feedback
 * 
 * @author Software Engineering Team Delta
 * @version 1.0.0
 */

/**
 * EnemyAntBrush - Tool for painting enemy ants with mouse interaction
 */
class EnemyAntBrush extends BrushBase {
  constructor() {
    super();
    this.brushSize = 30; // Radius of brush cursor
    this.spawnCooldown = 50; // Milliseconds between spawns to prevent spam
    this.lastSpawnTime = 0;
    this.brushColor = [255, 69, 0, 100]; // Orange with transparency
    this.brushOutlineColor = [255, 69, 0, 255]; // Solid orange outline
    this.isMousePressed = false;

    // Visual feedback properties
    this.pulseAnimation = 0;
    this.pulseSpeed = 0.1;
  }

  /**
   * Toggle brush active state
   * @returns {boolean} New active state
   */
  toggle() {
    this.isActive = !this.isActive;
    return this.isActive;
  }

  /**
   * Activate the brush
   */
  activate() {
    this.isActive = true;
  }

  /**
   * Deactivate the brush
   */
  deactivate() {
    this.isActive = false;
  }

  /**
   * Update the brush (called every frame)
   */
  update() {
    if (!this.isActive) return;
    super.update();
    // Update pulse animation for visual feedback (super.update handles pulseAnimation too but keep local scaling)
    this.pulseAnimation += this.pulseSpeed;
    if (this.pulseAnimation > Math.PI * 2) this.pulseAnimation = 0;

    // Handle continuous painting while mouse is held down
    if (this.isMousePressed && typeof mouseX !== 'undefined' && typeof mouseY !== 'undefined') {
      this.trySpawnAnt(mouseX, mouseY);
    }
  }

  /**
   * Render the brush cursor and visual feedback
   */
  render() {
    if (!this.isActive || typeof mouseX === 'undefined' || typeof mouseY === 'undefined') return;

    // Save current drawing settings
    push();

    // Calculate pulsing effect
    const pulseScale = 1 + Math.sin(this.pulseAnimation) * 0.1;
    const currentBrushSize = this.brushSize * pulseScale;

    // Draw brush fill
    fill(this.brushColor[0], this.brushColor[1], this.brushColor[2], this.brushColor[3]);
    noStroke();
    ellipse(mouseX, mouseY, currentBrushSize * 2, currentBrushSize * 2);

    // Draw brush outline
    stroke(this.brushOutlineColor[0], this.brushOutlineColor[1], this.brushOutlineColor[2], this.brushOutlineColor[3]);
    strokeWeight(2);
    noFill();
    ellipse(mouseX, mouseY, currentBrushSize * 2, currentBrushSize * 2);

    // Draw crosshair in center
    stroke(this.brushOutlineColor[0], this.brushOutlineColor[1], this.brushOutlineColor[2], 200);
    strokeWeight(1);
    line(mouseX - 5, mouseY, mouseX + 5, mouseY);
    line(mouseX, mouseY - 5, mouseX, mouseY + 5);

    // Draw brush info text
    fill(255, 255, 255, 200);
    textAlign(LEFT, TOP);
    textSize(10);
    text('Enemy Ant Brush', mouseX + currentBrushSize + 5, mouseY - 15);
    text(`Size: ${Math.round(currentBrushSize)}px`, mouseX + currentBrushSize + 5, mouseY - 5);

    // Restore drawing settings
    pop();
  }

  /**
   * Handle mouse press events
   * @param {number} mx - Mouse X coordinate
   * @param {number} my - Mouse Y coordinate
   * @param {string} button - Mouse button ('LEFT', 'RIGHT', 'CENTER')
   * @returns {boolean} True if event was handled
   */
  onMousePressed(mx, my, button = 'LEFT') {
    if (!this.isActive) return false;

    if (button === 'LEFT') {
      this.isMousePressed = true;
      this.trySpawnAnt(mx, my);
      return true; // Consume the event
    }
    
    return false;
  }

  /**
   * Handle mouse release events
   * @param {number} mx - Mouse X coordinate
   * @param {number} my - Mouse Y coordinate
   * @param {string} button - Mouse button ('LEFT', 'RIGHT', 'CENTER')
   * @returns {boolean} True if event was handled
   */
  onMouseReleased(mx, my, button = 'LEFT') {
    if (!this.isActive) return false;

    if (button === 'LEFT') {
      this.isMousePressed = false;
      return true; // Consume the event
    }
    
    return false;
  }

  /**
   * Try to spawn an enemy ant at the specified location
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {boolean} True if ant was spawned
   */
  trySpawnAnt(x, y) {
    const now = Date.now();
    if (now - this.lastSpawnTime < this.spawnCooldown) {
      return false; // Still in cooldown
    }

    // Add some randomness to spawn position within brush area
    const randomOffset = this.brushSize * 0.8;
    const spawnX = x + (Math.random() - 0.5) * randomOffset;
    const spawnY = y + (Math.random() - 0.5) * randomOffset;

    // Try to spawn ant using AntUtilities
    let spawned = false;
    if (typeof AntUtilities !== 'undefined' && typeof AntUtilities.spawnAnt === 'function') {
      const enemyAnt = AntUtilities.spawnAnt(spawnX, spawnY, "Warrior", "enemy");
      if (enemyAnt) {
        spawned = true;
      }
    }

    // Fallback to command system
    if (!spawned && typeof executeCommand === 'function') {
      try {
        const initialAntCount = typeof ants !== 'undefined' ? ants.length : 0;
        executeCommand(`spawn 1 ant enemy`);
        const newAntCount = typeof ants !== 'undefined' ? ants.length : 0;
        if (newAntCount > initialAntCount) {
          // Move the newly spawned ant to the brush position
          const newAnt = ants[ants.length - 1];
          if (newAnt && newAnt.setPosition) {
            newAnt.setPosition(spawnX, spawnY);
          }
          spawned = true;
        }
      } catch (error) {
        console.warn('⚠️ Brush spawn via command failed:', error.message);
      }
    }

    if (spawned) {
      this.lastSpawnTime = now;
    }

    return spawned;
  }

  /**
   * Set brush size
   * @param {number} size - New brush size in pixels
   */
  setBrushSize(size) {
    this.brushSize = Math.max(10, Math.min(100, size)); // Clamp between 10-100
  }

  /**
   * Get current brush settings for debugging
   * @returns {Object} Brush settings
   */
  getDebugInfo() {
    return {
      isActive: this.isActive,
      brushSize: this.brushSize,
      spawnCooldown: this.spawnCooldown,
      isMousePressed: this.isMousePressed,
      lastSpawnTime: this.lastSpawnTime
    };
  }
}

// Create global instance
let g_enemyAntBrush = null;

/**
 * Initialize the enemy ant brush system
 */
function initializeEnemyAntBrush() {
  if (!g_enemyAntBrush) {
    g_enemyAntBrush = new EnemyAntBrush();
  }
  return g_enemyAntBrush;
}

// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
  // Make classes available globally
  window.EnemyAntBrush = EnemyAntBrush;
  window.initializeEnemyAntBrush = initializeEnemyAntBrush;
  window.g_enemyAntBrush = initializeEnemyAntBrush();
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { EnemyAntBrush, initializeEnemyAntBrush };
}
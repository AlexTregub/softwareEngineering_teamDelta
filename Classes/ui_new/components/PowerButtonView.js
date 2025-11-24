/**
 * PowerButtonView
 * @module ui_new/components/PowerButtonView
 * 
 * MVC View (Presentation Layer) - Rendering only, NO state mutations
 * 
 * RENDERS:
 * - Button sprite
 * - Lock icon overlay (when locked)
 * - Grey tint (when locked/cooldown)
 * - Cooldown radial progress (counterclockwise from 12 o'clock)
 * 
 * DOES NOT:
 * - Mutate model state (read-only)
 * - Update game logic (Controller responsibility)
 * - Query Queen (Controller responsibility)
 * - Emit EventBus signals (Controller responsibility)
 */

class PowerButtonView {
  /**
   * Create a power button view
   * @param {PowerButtonModel} model - Data model
   * @param {Object} p5Instance - p5.js instance
   * @param {Object} [options] - View options
   * @param {number} [options.x=0] - X position
   * @param {number} [options.y=0] - Y position
   * @param {number} [options.size=64] - Button size (pixels)
   */
  constructor(model, p5Instance, options = {}) {
    this.model = model;
    this.p5 = p5Instance;
    
    // Position and size
    this.x = options.x || 0;
    this.y = options.y || 0;
    this.size = options.size || 64;
    
    // Visual constants
    this.LOCK_ICON_SIZE = 32;
    this.RADIAL_STROKE_WEIGHT = 4;
    this.TINT_COLOR = { r: 100, g: 100, h: 100, a: 180 };
    this.RADIAL_COLOR = { r: 255, g: 100, b: 100, a: 200 };
    
    // Load sprite
    this.sprite = null;
    this.lockIcon = null;
    this._loadAssets();
  }

  /**
   * Load sprite and lock icon assets
   * @private
   */
  _loadAssets() {
    const spritePath = this.model.getSpritePath();
    
    if (typeof this.p5.loadImage === 'function') {
      this.sprite = this.p5.loadImage(spritePath);
    }
    
    // Load lock icon (generic padlock)
    // For testing, we'll render a simple rect/ellipse as lock icon
    // In production, load actual lock.png asset
  }

  /**
   * Render the power button
   * Read-only - does NOT mutate model
   */
  render() {
    const isLocked = this.model.getIsLocked();
    const cooldownProgress = this.model.getCooldownProgress();
    const isCooldown = cooldownProgress > 0;
    
    this.p5.push();
    
    // Apply tint if locked or on cooldown
    if (isLocked || isCooldown) {
      this.p5.tint(
        this.TINT_COLOR.r,
        this.TINT_COLOR.g,
        this.TINT_COLOR.h,
        this.TINT_COLOR.a
      );
    }
    
    // Render button sprite
    this._renderSprite();
    
    // Remove tint after sprite
    if (isLocked || isCooldown) {
      this.p5.noTint();
    }
    
    // Render lock overlay if locked
    if (isLocked) {
      this._renderLockOverlay();
    }
    
    // Render cooldown radial if on cooldown
    if (isCooldown) {
      this._renderCooldownRadial(cooldownProgress);
    }
    
    this.p5.pop();
  }

  /**
   * Render button sprite
   * @private
   */
  _renderSprite() {
    this.p5.imageMode(this.p5.CENTER);
    
    if (this.sprite) {
      this.p5.image(this.sprite, this.x, this.y, this.size, this.size);
    } else {
      // Fallback: render placeholder rect
      this.p5.fill(100);
      this.p5.stroke(200);
      this.p5.strokeWeight(2);
      this.p5.rect(
        this.x - this.size / 2,
        this.y - this.size / 2,
        this.size,
        this.size
      );
    }
  }

  /**
   * Render lock icon overlay
   * @private
   */
  _renderLockOverlay() {
    this.p5.push();
    
    if (this.lockIcon) {
      // Render lock icon image
      this.p5.imageMode(this.p5.CENTER);
      this.p5.image(
        this.lockIcon,
        this.x,
        this.y,
        this.LOCK_ICON_SIZE,
        this.LOCK_ICON_SIZE
      );
    } else {
      // Fallback: render simple lock shape
      // Padlock body (rect)
      this.p5.fill(50, 50, 50, 220);
      this.p5.noStroke();
      this.p5.rect(
        this.x - this.LOCK_ICON_SIZE / 4,
        this.y - this.LOCK_ICON_SIZE / 8,
        this.LOCK_ICON_SIZE / 2,
        this.LOCK_ICON_SIZE / 2,
        4 // Rounded corners
      );
      
      // Padlock shackle (arc)
      this.p5.noFill();
      this.p5.stroke(50, 50, 50, 220);
      this.p5.strokeWeight(3);
      this.p5.arc(
        this.x,
        this.y - this.LOCK_ICON_SIZE / 8,
        this.LOCK_ICON_SIZE / 3,
        this.LOCK_ICON_SIZE / 3,
        this.p5.PI,
        0
      );
    }
    
    this.p5.pop();
  }

  /**
   * Render cooldown radial progress indicator
   * Counterclockwise from 12 o'clock (270° = -PI/2)
   * @private
   * @param {number} progress - Cooldown progress (0-1)
   */
  _renderCooldownRadial(progress) {
    this.p5.push();
    
    // Set angle mode to radians
    this.p5.angleMode(this.p5.RADIANS);
    
    // Configure radial appearance
    this.p5.noFill();
    this.p5.stroke(
      this.RADIAL_COLOR.r,
      this.RADIAL_COLOR.g,
      this.RADIAL_COLOR.b,
      this.RADIAL_COLOR.a
    );
    this.p5.strokeWeight(this.RADIAL_STROKE_WEIGHT);
    
    // Calculate arc angles
    // Start at 12 o'clock: -PI/2 (or 3*PI/2)
    // Sweep counterclockwise by progress * 2*PI
    const startAngle = -this.p5.HALF_PI; // 12 o'clock
    const sweepAngle = progress * this.p5.TWO_PI;
    const endAngle = startAngle - sweepAngle; // Counterclockwise (subtract)
    
    // Draw arc (outer circle)
    this.p5.arc(
      this.x,
      this.y,
      this.size + 8, // Slightly larger than button
      this.size + 8,
      endAngle,
      startAngle
    );
    
    this.p5.pop();
  }

  /**
   * Get button position
   * @returns {Object} Position {x, y}
   */
  getPosition() {
    return { x: this.x, y: this.y };
  }

  /**
   * Get button size
   * @returns {number} Size in pixels
   */
  getSize() {
    return this.size;
  }

  /**
   * Check if point is inside button bounds (for hit testing)
   * @param {number} px - Point X
   * @param {number} py - Point Y
   * @returns {boolean} True if inside button
   */
  isPointInside(px, py) {
    const halfSize = this.size / 2;
    return (
      px >= this.x - halfSize &&
      px <= this.x + halfSize &&
      py >= this.y - halfSize &&
      py <= this.y + halfSize
    );
  }
}

// Export for Node.js (testing) - check module.exports FIRST
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PowerButtonView;
}

// Make available globally for browser
if (typeof window !== 'undefined') {
  window.PowerButtonView = PowerButtonView;
}

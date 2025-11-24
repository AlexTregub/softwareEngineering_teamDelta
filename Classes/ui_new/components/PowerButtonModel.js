/**
 * PowerButtonModel
 * @module ui_new/components/PowerButtonModel
 * 
 * MVC Model (Data Layer) - Pure data storage for power button state
 * 
 * STORES:
 * - Power name (string)
 * - Lock status (boolean)
 * - Cooldown progress (0-1)
 * - Sprite path (string)
 * 
 * DOES NOT:
 * - Render (View responsibility)
 * - Update game logic (Controller responsibility)
 * - Query Queen (Controller responsibility)
 * - Emit EventBus signals (Controller responsibility)
 */

class PowerButtonModel {
  /**
   * Create a power button data model
   * @param {Object} options - Configuration options
   * @param {string} options.powerName - Name of the power (e.g., 'lightning', 'fireball')
   * @param {boolean} [options.isLocked=true] - Whether power is locked
   * @param {number} [options.cooldownProgress=0] - Cooldown progress (0=ready, 1=full cooldown)
   * @param {string} [options.spritePath] - Custom sprite path (auto-generated if not provided)
   */
  constructor(options = {}) {
    // Validate and store power name
    this._powerName = options.powerName || 'unknown';
    
    // Lock status (default: locked)
    this._isLocked = options.isLocked !== undefined ? Boolean(options.isLocked) : true;
    
    // Cooldown progress (0 = ready, 1 = full cooldown)
    this._cooldownProgress = this._clampProgress(options.cooldownProgress !== undefined ? options.cooldownProgress : 0);
    
    // Sprite path (auto-generate if not provided)
    this._spritePath = options.spritePath || this._generateDefaultSpritePath(this._powerName);
  }

  // ==================== GETTERS (Read-Only Access) ====================

  /**
   * Get power name
   * @returns {string} Power name
   */
  getPowerName() {
    return this._powerName;
  }

  /**
   * Get lock status
   * @returns {boolean} True if locked, false if unlocked
   */
  getIsLocked() {
    return this._isLocked;
  }

  /**
   * Get cooldown progress
   * @returns {number} Cooldown progress (0-1 range)
   */
  getCooldownProgress() {
    return this._cooldownProgress;
  }

  /**
   * Get sprite path
   * @returns {string} Path to button sprite image
   */
  getSpritePath() {
    return this._spritePath;
  }

  // ==================== SETTERS (Data Mutation) ====================

  /**
   * Set lock status
   * @param {boolean} isLocked - New lock status
   */
  setIsLocked(isLocked) {
    this._isLocked = Boolean(isLocked);
  }

  /**
   * Set cooldown progress
   * @param {number} progress - Cooldown progress (clamped to 0-1)
   */
  setCooldownProgress(progress) {
    this._cooldownProgress = this._clampProgress(progress);
  }

  /**
   * Set sprite path
   * @param {string} path - New sprite path
   */
  setSpritePath(path) {
    if (typeof path === 'string' && path.length > 0) {
      this._spritePath = path;
    }
  }

  // ==================== PRIVATE HELPERS ====================

  /**
   * Clamp progress value to 0-1 range
   * @private
   * @param {number} value - Value to clamp
   * @returns {number} Clamped value
   */
  _clampProgress(value) {
    if (typeof value !== 'number' || isNaN(value)) {
      return 0;
    }
    return Math.max(0, Math.min(1, value));
  }

  /**
   * Generate default sprite path based on power name
   * @private
   * @param {string} powerName - Power name
   * @returns {string} Default sprite path
   */
  _generateDefaultSpritePath(powerName) {
    const sanitizedName = powerName.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `Images/powers/${sanitizedName}_power_button.png`;
  }
}

// Export for Node.js (testing)
if (typeof module !== 'undefined' && module.exports && typeof window === 'undefined') {
  module.exports = PowerButtonModel;
}

// Make available globally for browser
if (typeof window !== 'undefined') {
  window.PowerButtonModel = PowerButtonModel;
}

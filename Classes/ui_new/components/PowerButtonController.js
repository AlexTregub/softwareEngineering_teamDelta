/**
 * PowerButtonController
 * @module ui_new/components/PowerButtonController
 * 
 * MVC Controller (Orchestration Layer) - Coordinates model/view, system integration
 * 
 * ORCHESTRATES:
 * - EventBus listeners (cooldown events)
 * - Queen unlock status queries
 * - Cooldown progress updates
 * - Click handling and power activation
 * 
 * DOES NOT:
 * - Render (View responsibility)
 * - Store data (Model responsibility)
 */

class PowerButtonController {
  /**
   * Create a power button controller
   * @param {PowerButtonModel} model - Data model
   * @param {PowerButtonView} view - Presentation view
   */
  constructor(model, view) {
    this.model = model;
    this.view = view;
    
    // Controller state
    this.enabled = true;
    this.isHovered = false;
    
    // Cooldown tracking
    this.cooldownStartTime = 0;
    this.cooldownDuration = 0;
    
    // Register EventBus listeners
    this._registerEventListeners();
  }

  /**
   * Register EventBus listeners for cooldown events
   * @private
   */
  _registerEventListeners() {
    if (typeof window.eventBus === 'undefined') {
      console.warn('eventBus not available - PowerButtonController running without event integration');
      return;
    }

    // Listen for cooldown start events
    window.eventBus.on('power:cooldown:start', (data) => {
      if (data.powerName === this.model.getPowerName()) {
        this.startCooldown(data.duration);
      }
    });

    // Listen for cooldown end events
    window.eventBus.on('power:cooldown:end', (data) => {
      if (data.powerName === this.model.getPowerName()) {
        this.endCooldown();
      }
    });
  }

  /**
   * Update controller state (called every frame)
   */
  update() {
    if (!this.enabled) return;

    // Update lock status from Queen
    this.updateLockStatus();

    // Update cooldown progress
    this._updateCooldown();
  }

  /**
   * Query Queen for power unlock status and update model
   */
  updateLockStatus() {
    const queen = typeof queenAnt !== 'undefined' ? queenAnt : 
                  (typeof window !== 'undefined' && window.queenAnt ? window.queenAnt : null);
    
    if (!queen || typeof queen.isPowerUnlocked !== 'function') {
      // Queen not available - keep existing lock status
      return;
    }

    const isUnlocked = queen.isPowerUnlocked(this.model.getPowerName());
    this.model.setIsLocked(!isUnlocked);
  }

  /**
   * Start cooldown timer
   * @param {number} duration - Cooldown duration in milliseconds
   */
  startCooldown(duration) {
    const getCurrentTime = () => {
      if (typeof millis === 'function') return millis();
      if (typeof window !== 'undefined' && typeof window.millis === 'function') return window.millis();
      return Date.now();
    };

    this.cooldownStartTime = getCurrentTime();
    this.cooldownDuration = duration;
    this.model.setCooldownProgress(1.0); // Start at full cooldown
  }

  /**
   * End cooldown timer
   */
  endCooldown() {
    this.cooldownStartTime = 0;
    this.cooldownDuration = 0;
    this.model.setCooldownProgress(0);
  }

  /**
   * Update cooldown progress based on elapsed time
   * @private
   */
  _updateCooldown() {
    if (this.cooldownStartTime === 0 || this.cooldownDuration === 0) {
      return; // No active cooldown
    }

    const getCurrentTime = () => {
      if (typeof millis === 'function') return millis();
      if (typeof window !== 'undefined' && typeof window.millis === 'function') return window.millis();
      return Date.now();
    };

    const currentTime = getCurrentTime();
    const elapsed = currentTime - this.cooldownStartTime;
    const progress = 1.0 - (elapsed / this.cooldownDuration);

    if (progress <= 0) {
      // Cooldown complete
      this.endCooldown();
      
      // Emit cooldown end event
      if (typeof window.eventBus !== 'undefined') {
        window.eventBus.emit('power:cooldown:end', {
          powerName: this.model.getPowerName(),
          timestamp: currentTime
        });
      }
    } else {
      // Update progress (1.0 = full cooldown, 0.0 = ready)
      this.model.setCooldownProgress(progress);
    }
  }

  /**
   * Handle click on button
   * @param {number} x - Click X position (screen coordinates)
   * @param {number} y - Click Y position (screen coordinates)
   * @returns {boolean} True if click was handled and power activated
   */
  handleClick(x, y) {
    // Check if click is inside button bounds
    if (!this.view.isPointInside(x, y)) {
      return false;
    }

    console.log(`🔘 Button hit: ${this.model.getPowerName()}, locked: ${this.model.getIsLocked()}, cooldown: ${this.model.getCooldownProgress()}`);

    // Check if power can be activated
    if (this.model.getIsLocked()) {
      console.log(`🔒 Power ${this.model.getPowerName()} is locked`);
      return false; // Locked
    }

    if (this.model.getCooldownProgress() > 0) {
      console.log(`⏳ Power ${this.model.getPowerName()} on cooldown: ${this.model.getCooldownProgress()}`);
      return false; // On cooldown
    }

    // Activate power
    console.log(`⚡ Activating power: ${this.model.getPowerName()}`);
    this._activatePower();
    return true;
  }

  /**
   * Activate the power (toggle brush or emit event)
   * @private
   */
  _activatePower() {
    const powerName = this.model.getPowerName();
    
    // Deactivate all other power brushes first (only one brush active at a time)
    this._deactivateOtherBrushes(powerName);
    
    // Lightning power - toggle lightning aim brush
    if (powerName === 'lightning') {
      if (typeof window.g_lightningAimBrush === 'undefined' || !window.g_lightningAimBrush) {
        // Initialize brush if not present
        if (typeof window.initializeLightningAimBrush === 'function') {
          window.g_lightningAimBrush = window.initializeLightningAimBrush();
          
          // Register with RenderManager so it actually renders
          if (typeof RenderManager !== 'undefined' && 
              typeof window.g_lightningAimBrush.render === 'function' &&
              !RenderManager._registeredDrawables.lightningAimBrush) {
            RenderManager.addDrawableToLayer(
              RenderManager.layers.UI_GAME, 
              window.g_lightningAimBrush.render.bind(window.g_lightningAimBrush)
            );
            RenderManager._registeredDrawables.lightningAimBrush = true;
            console.log('✅ Lightning aim brush registered with RenderManager');
          }
        } else {
          console.warn('Cannot activate lightning - g_lightningAimBrush not available');
          return;
        }
      }
      
      // Toggle the brush
      window.g_lightningAimBrush.toggle();
      console.log(`⚡ Lightning aim brush toggled: ${window.g_lightningAimBrush.isActive ? 'ACTIVE' : 'INACTIVE'}`);
      return;
    }
    
    // Fireball power - toggle fireball aim brush
    if (powerName === 'fireball') {
      if (typeof window.g_fireballAimBrush === 'undefined' || !window.g_fireballAimBrush) {
        // Initialize brush if not present
        if (typeof window.initializeFireballAimBrush === 'function') {
          window.g_fireballAimBrush = window.initializeFireballAimBrush();
          
          // Register with RenderManager so it actually renders
          if (typeof RenderManager !== 'undefined' && 
              typeof window.g_fireballAimBrush.render === 'function' &&
              !RenderManager._registeredDrawables.fireballAimBrush) {
            RenderManager.addDrawableToLayer(
              RenderManager.layers.UI_GAME, 
              window.g_fireballAimBrush.render.bind(window.g_fireballAimBrush)
            );
            RenderManager._registeredDrawables.fireballAimBrush = true;
            console.log('✅ Fireball aim brush registered with RenderManager');
          }
        } else {
          console.warn('Cannot activate fireball - g_fireballAimBrush not available');
          return;
        }
      }
      
      // Toggle the brush
      window.g_fireballAimBrush.toggle();
      console.log(`🔥 Fireball aim brush toggled: ${window.g_fireballAimBrush.isActive ? 'ACTIVE' : 'INACTIVE'}`);
      return;
    }
    
    // Fallback: emit event to PowerManager for other powers
    if (typeof window.eventBus !== 'undefined') {
      window.eventBus.emit('power:activated', {
        powerName: powerName,
        timestamp: typeof millis === 'function' ? millis() : Date.now()
      });
    } else {
      console.warn('Cannot activate power - eventBus not available');
    }
  }

  /**
   * Deactivate all power brushes except the specified one
   * @param {string} exceptPowerName - Name of the power to keep active
   * @private
   */
  _deactivateOtherBrushes(exceptPowerName) {
    // Deactivate lightning brush if not the one being activated
    if (exceptPowerName !== 'lightning' && 
        typeof window.g_lightningAimBrush !== 'undefined' && 
        window.g_lightningAimBrush && 
        window.g_lightningAimBrush.isActive) {
      window.g_lightningAimBrush.deactivate();
      console.log('⚡ Lightning brush deactivated (another power selected)');
    }
    
    // Deactivate fireball brush if not the one being activated
    if (exceptPowerName !== 'fireball' && 
        typeof window.g_fireballAimBrush !== 'undefined' && 
        window.g_fireballAimBrush && 
        window.g_fireballAimBrush.isActive) {
      window.g_fireballAimBrush.deactivate();
      console.log('🔥 Fireball brush deactivated (another power selected)');
    }
    
    // Add more brushes here as needed
  }

  /**
   * Set hover state
   * @param {boolean} hovered - True if mouse is over button
   */
  setHovered(hovered) {
    this.isHovered = Boolean(hovered);
  }

  /**
   * Get hover state
   * @returns {boolean} True if mouse is over button
   */
  getIsHovered() {
    return this.isHovered;
  }

  /**
   * Enable/disable controller
   * @param {boolean} enabled - True to enable, false to disable
   */
  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
  }

  /**
   * Cleanup resources (unregister event listeners)
   */
  cleanup() {
    if (typeof window.eventBus === 'undefined') return;

    window.eventBus.off('power:cooldown:start');
    window.eventBus.off('power:cooldown:end');
  }

  /**
   * Get button position (delegate to view)
   * @returns {Object} Position {x, y}
   */
  getPosition() {
    return this.view.getPosition();
  }

  /**
   * Get button size (delegate to view)
   * @returns {number} Size in pixels
   */
  getSize() {
    return this.view.getSize();
  }
}

// Export for Node.js (testing) - check module.exports FIRST
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PowerButtonController;
}

// Make available globally for browser
if (typeof window !== 'undefined') {
  window.PowerButtonController = PowerButtonController;
}

/**
 * RenderController - Standardizes rendering, highlighting, and visual effects
 * Provides consistent visual representation across all entities
 */
class RenderController {
  constructor(entity) {
    this._entity = entity;
    this._effects = [];
    this._animations = {};
    
    // Highlight states
    this._highlightState = null;
    this._highlightColor = null;
    this._highlightIntensity = 1.0;
    
    // Animation properties
    this._bobOffset = Math.random() * Math.PI * 2; // Random bob start
    this._pulseOffset = Math.random() * Math.PI * 2; // Random pulse start
    
    // Rendering settings
    this._smoothing = false; // Pixel art style by default
    this._debugMode = false;
    
    // Visual effect types
    this.HIGHLIGHT_TYPES = {
      SELECTED: {
        color: [0, 255, 0], // Green
        strokeWeight: 3,
        style: "outline"
      },
      HOVER: {
        color: [255, 255, 0, 200], // White with transparency
        strokeWeight: 2,
        style: "outline"
      },
      BOX_HOVERED: {
        color: [0, 255, 50, 100], // Green with transparence
        strokeWeight: 2,
        style: "outline"
      },
      COMBAT: {
        color: [255, 0, 0], // Red
        strokeWeight: 3,
        style: "pulse"
      },
      FRIENDLY: {
        color: [0, 255, 0], // Green
        strokeWeight: 2,
        style: "outline"
      },
      ENEMY: {
        color: [255, 0, 0], // Red
        strokeWeight: 2,
        style: "outline"
      },
      RESOURCE: {
        color: [255, 165, 0], // Orange
        strokeWeight: 2,
        style: "bob"
      }
    };

    // State indicators
    this.STATE_INDICATORS = {
      MOVING: { color: [0, 255, 0], symbol: "→" },
      GATHERING: { color: [255, 165, 0], symbol: "⛏" },
      BUILDING: { color: [139, 69, 19], symbol: "🔨" },
      ATTACKING: { color: [255, 0, 0], symbol: "⚔" },
      FOLLOWING: { color: [0, 0, 255], symbol: "👥" },
      FLEEING: { color: [255, 255, 0], symbol: "💨" },
      IDLE: { color: [128, 128, 128], symbol: "💤" }
    };
  }

  // --- Public API ---

  /**
   * Update render controller - called every frame
   */
  update() {
    // Update visual effects
    this.updateEffects();
    
    // Update animations (bob, pulse, etc.)
    this._updateAnimations();
  }

  /**
   * Update animation offsets for smooth visual effects
   */
  _updateAnimations() {
    // Update bob and pulse offsets for smooth animation
    this._bobOffset += 0.1;
    this._pulseOffset += 0.08;
    
    // Keep offsets in reasonable range
    if (this._bobOffset > Math.PI * 4) this._bobOffset -= Math.PI * 4;
    if (this._pulseOffset > Math.PI * 4) this._pulseOffset -= Math.PI * 4;
  }

  // --- Helper Methods ---

  /**
   * Check if p5.js rendering functions are available
   * @returns {boolean} True if p5.js functions are accessible
   */
  _isP5Available() {
    return typeof stroke === 'function' && 
           typeof fill === 'function' && 
           typeof rect === 'function' &&
           typeof strokeWeight === 'function' &&
           typeof noFill === 'function' &&
           typeof noStroke === 'function';
  }

  /**
   * Safe wrapper for p5.js function calls
   * @param {function} renderFunction - Function containing p5.js calls
   */
  _safeRender(renderFunction) {
    if (!this._isP5Available()) {
      console.warn('RenderController: p5.js functions not available, skipping render');
      return;
    }
    try {
      renderFunction();
    } catch (error) {
      console.error('RenderController: Render error:', error);
    }
  }

  // --- Public API ---

  /**
   * Main render method - call this every frame
   */
  render() {
    this._safeRender(() => {
      // Set smoothing preference
      if (this._smoothing) {
        smooth();
      } else {
        noSmooth();
      }

      // Render the main entity
      this.renderEntity();
      
      // Render movement indicators
      this.renderMovementIndicators();
      
      // Render highlighting
      this.renderHighlighting();
      
      // Render state indicators
      this.renderStateIndicators();
      
      // Render debug information
      if (this._debugMode) {
        this.renderDebugInfo();
      }
      
      // Update and render effects
      this.updateEffects();
      this.renderEffects();

      // Reset smoothing
      if (this._smoothing) {
        smooth();
      }
    });
  }

  /**
   * Set highlight state
   * @param {string} type - Highlight type (SELECTED, HOVER, etc.)
   * @param {number} intensity - Highlight intensity (0-1)
   */
  setHighlight(type, intensity = 1.0) {
    this._highlightState = type;
    this._highlightIntensity = Math.max(0, Math.min(1, intensity));
    
    if (type && this.HIGHLIGHT_TYPES[type]) {
      this._highlightColor = this.HIGHLIGHT_TYPES[type].color;
    } else {
      this._highlightColor = null;
    }
  }

  /**
   * Clear highlight
   */
  clearHighlight() {
    this._highlightState = null;
    this._highlightColor = null;
    this._highlightIntensity = 1.0;
  }

  /**
   * Add visual effect
   * @param {Object} effect - Effect configuration
   */
  addEffect(effect) {
    const effectId = this.generateEffectId();
    const enhancedEffect = {
      id: effectId,
      createdAt: Date.now(),
      duration: effect.duration || 1000,
      ...effect
    };
    
    this._effects.push(enhancedEffect);
    return effectId;
  }

  /**
   * Remove effect by ID
   * @param {string} effectId - Effect ID
   */
  removeEffect(effectId) {
    this._effects = this._effects.filter(effect => effect.id !== effectId);
  }

  /**
   * Clear all effects
   */
  clearEffects() {
    this._effects = [];
  }

  /**
   * Toggle debug rendering
   * @param {boolean} enabled - Debug mode enabled
   */
  setDebugMode(enabled) {
    this._debugMode = enabled;
  }

  /**
   * Set smoothing preference
   * @param {boolean} enabled - Smoothing enabled
   */
  setSmoothing(enabled) {
    this._smoothing = enabled;
  }

  // --- Convenience Methods ---

  /**
   * Highlight entity as selected
   */
  highlightSelected() {
    this.setHighlight("SELECTED");
  }

  /**
   * Highlight entity as hovered
   */
  highlightHover() {
    this.setHighlight("HOVER");
  }

  /**
   * Highlight entity as box hovered
   */
  highlightBoxHover() {
    this.setHighlight("BOX_HOVERED");
  }

  /**
   * Highlight entity in combat
   */
  highlightCombat() {
    this.setHighlight("COMBAT");
  }

  /**
   * Add damage number effect
   * @param {number} damage - Damage amount
   * @param {Array} color - Text color [r, g, b]
   */
  showDamageNumber(damage, color = [255, 0, 0]) {
    const pos = this.getEntityCenter();
    this.addEffect({
      type: "DAMAGE_NUMBER",
      text: `-${damage}`,
      position: { x: pos.x, y: pos.y - 10 },
      color: color,
      velocity: { x: 0, y: -2 },
      duration: 1500,
      fadeOut: true
    });
  }

  /**
   * Add heal number effect
   * @param {number} heal - Heal amount
   */
  showHealNumber(heal) {
    this.showDamageNumber(heal, [0, 255, 0]);
  }

  /**
   * Add floating text effect
   * @param {string} text - Text to display
   * @param {Array} color - Text color
   */
  showFloatingText(text, color = [255, 255, 255]) {
    const pos = this.getEntityCenter();
    this.addEffect({
      type: "FLOATING_TEXT",
      text: text,
      position: { x: pos.x, y: pos.y - 20 },
      color: color,
      velocity: { x: 0, y: -1 },
      duration: 2000,
      fadeOut: true
    });
  }

  // --- Private Rendering Methods ---

  /**
   * Render the main entity (sprite)
   */
  renderEntity() {
    // Render using entity's sprite if available
    if (this._entity._sprite && this._entity._sprite.render) {
      this._entity._sprite.render();
    } else {
      // Fallback rendering
      this.renderFallbackEntity();
    }
  }

  /**
   * Fallback entity rendering if no sprite system
   */
  renderFallbackEntity() {
    const pos = this.getEntityPosition();
    const size = this.getEntitySize();
    
    this._safeRender(() => {
      fill(100, 100, 100); // Gray default
      noStroke();
      rect(pos.x, pos.y, size.x, size.y);
    });
  }

  /**
   * Render movement indicators (lines to target, etc.)
   */
  renderMovementIndicators() {
    // Show line to movement target
    if (this._entity._movementController) {
      const target = this._entity._movementController.getTarget();
      const isMoving = this._entity._movementController.getIsMoving();
      
      if (isMoving && target) {
        const pos = this.getEntityCenter();
        const size = this.getEntitySize();
        
        this._safeRender(() => {
          stroke(255, 255, 255, 150);
          strokeWeight(2);
          line(
            pos.x, pos.y,
            target.x + size.x / 2, target.y + size.y / 2
          );
          noStroke();
        });
      }
    } else if (this._entity._isMoving && this._entity._stats && this._entity._stats.pendingPos) {
      // Fallback to old system
      const pos = this.getEntityPosition();
      const size = this.getEntitySize();
      const target = this._entity._stats.pendingPos.statValue;
      
      this._safeRender(() => {
        stroke(255);
        strokeWeight(2);
        line(
          pos.x + size.x / 2, pos.y + size.y / 2,
          target.x + size.x / 2, target.y + size.y / 2
        );
        noStroke();
      });
    }
  }

  /**
   * Render highlighting around entity
   */
  renderHighlighting() {
    if (!this._highlightState || !this._highlightColor) return;

    const highlightType = this.HIGHLIGHT_TYPES[this._highlightState];
    if (!highlightType) return;

    const pos = this.getEntityPosition();
    const size = this.getEntitySize();
    
    // Apply intensity to color
    const color = [...this._highlightColor];
    if (color.length === 4) {
      color[3] *= this._highlightIntensity;
    } else {
      color.push(255 * this._highlightIntensity);
    }

    switch (highlightType.style) {
      case "outline":
        this.renderOutlineHighlight(pos, size, color, highlightType.strokeWeight);
        break;
      case "pulse":
        this.renderPulseHighlight(pos, size, color, highlightType.strokeWeight);
        break;
      case "bob":
        this.renderBobHighlight(pos, size, color, highlightType.strokeWeight);
        break;
    }
  }

  /**
   * Render outline highlight
   */
  renderOutlineHighlight(pos, size, color, strokeWeightValue) {
    // Ensure p5.js functions are available
    if (typeof stroke !== 'function' || typeof strokeWeight !== 'function') {
      console.warn('RenderController: p5.js functions not available');
      return;
    }
    
    stroke(...color);
    strokeWeight(strokeWeightValue);
    noFill();
    rect(pos.x - strokeWeightValue, pos.y - strokeWeightValue, 
         size.x + strokeWeightValue * 2, size.y + strokeWeightValue * 2);
    noStroke();
  }

  /**
   * Render pulsing highlight
   */
  renderPulseHighlight(pos, size, color, strokeWeight) {
    const time = Date.now() * 0.005 + this._pulseOffset;
    const pulse = Math.sin(time) * 0.3 + 0.7; // 0.4 to 1.0
    
    const pulsedColor = [...color];
    if (pulsedColor.length === 4) {
      pulsedColor[3] *= pulse;
    } else {
      pulsedColor.push(255 * pulse);
    }
    
    this.renderOutlineHighlight(pos, size, pulsedColor, strokeWeight * pulse);
  }

  /**
   * Render bobbing highlight
   */
  renderBobHighlight(pos, size, color, strokeWeight) {
    const time = Date.now() * 0.003 + this._bobOffset;
    const bob = Math.sin(time) * 2; // ±2 pixels
    
    const bobbedPos = { x: pos.x, y: pos.y + bob };
    this.renderOutlineHighlight(bobbedPos, size, color, strokeWeight);
  }

  /**
   * Render state indicators (icons, text)
   */
  renderStateIndicators() {
    if (!this._entity._stateMachine) return;

    const currentState = this._entity._stateMachine.primaryState;
    if (!currentState || currentState === "IDLE") return;

    const indicator = this.STATE_INDICATORS[currentState];
    if (!indicator) return;

    const pos = this.getEntityPosition();
    const size = this.getEntitySize();
    
    // Position indicator above entity
    const indicatorX = pos.x + size.x / 2;
    const indicatorY = pos.y - 15;

    this._safeRender(() => {
      // Draw background circle
      fill(0, 0, 0, 100);
      noStroke();
      ellipse(indicatorX, indicatorY, 16, 16);

      // Draw state indicator
      fill(...indicator.color);
      textAlign(CENTER, CENTER);
      textSize(10);
      text(indicator.symbol, indicatorX, indicatorY);
    });
  }

  /**
   * Render debug information
   */
  renderDebugInfo() {
    if (!this._debugMode) return;

    // Delegate to shared DebugRenderer if available
    try {
      if (typeof DebugRenderer !== 'undefined' && DebugRenderer && typeof DebugRenderer.renderEntityDebug === 'function') {
        DebugRenderer.renderEntityDebug(this._entity);
        return;
      }

      // Fallback to legacy behavior if DebugRenderer not available
      const pos = this.getEntityPosition();
      const size = this.getEntitySize();
      
      this._safeRender(() => {
        // Debug text background
        fill(0, 0, 0, 150);
        noStroke();
        rect(pos.x, pos.y + size.y + 5, 120, 60);

        // Debug text
        fill(255);
        textAlign(LEFT, TOP);
        textSize(8);
        
        let debugY = pos.y + size.y + 10;
        const lineHeight = 10;
        
        // Entity info
        text(`ID: ${this._entity._antIndex || "unknown"}`, pos.x + 2, debugY);
        debugY += lineHeight;
        
        // Position
        text(`Pos: (${Math.round(pos.x)}, ${Math.round(pos.y)})`, pos.x + 2, debugY);
        debugY += lineHeight;
        
        // State
        if (this._entity._stateMachine) {
          const state = this._entity._stateMachine.primaryState || "UNKNOWN";
          text(`State: ${state}`, pos.x + 2, debugY);
          debugY += lineHeight;
        }
        
        // Movement
        const isMoving = this._entity._movementController ? 
          this._entity._movementController.getIsMoving() : 
          this._entity._isMoving;
        text(`Moving: ${isMoving ? "YES" : "NO"}`, pos.x + 2, debugY);
      });
      debugY += lineHeight;
      
      // Tasks
      if (this._entity._taskManager) {
        const taskCount = this._entity._taskManager.getQueueLength();
        text(`Tasks: ${taskCount}`, pos.x + 2, debugY);
      }
    } catch (e) {
      console.warn('RenderController.renderDebugInfo fallback failed', e);
    }
  }

  /**
   * Update all active effects
   */
  updateEffects() {
    const now = Date.now();
    
    this._effects = this._effects.filter(effect => {
      const age = now - effect.createdAt;
      
      // Remove expired effects
      if (age > effect.duration) {
        return false;
      }
      
      // Update effect properties
      if (effect.velocity) {
        effect.position.x += effect.velocity.x;
        effect.position.y += effect.velocity.y;
      }
      
      // Update fade out
      if (effect.fadeOut) {
        effect.alpha = 1.0 - (age / effect.duration);
      }
      
      return true;
    });
  }

  /**
   * Render all active effects
   */
  renderEffects() {
    this._effects.forEach(effect => {
      switch (effect.type) {
        case "DAMAGE_NUMBER":
        case "FLOATING_TEXT":
          this.renderTextEffect(effect);
          break;
        case "PARTICLE":
          this.renderParticleEffect(effect);
          break;
        // Add more effect types as needed
      }
    });
  }

  /**
   * Render text effect (damage numbers, floating text)
   */
  renderTextEffect(effect) {
    const alpha = effect.alpha !== undefined ? effect.alpha : 1.0;
    const color = [...effect.color];
    
    if (color.length === 3) {
      color.push(255 * alpha);
    } else {
      color[3] *= alpha;
    }
    
    fill(...color);
    textAlign(CENTER, CENTER);
    textSize(effect.size || 12);
    text(effect.text, effect.position.x, effect.position.y);
  }

  /**
   * Render particle effect
   */
  renderParticleEffect(effect) {
    const alpha = effect.alpha !== undefined ? effect.alpha : 1.0;
    const color = [...effect.color];
    
    if (color.length === 3) {
      color.push(255 * alpha);
    } else {
      color[3] *= alpha;
    }
    
    fill(...color);
    noStroke();
    ellipse(effect.position.x, effect.position.y, effect.size || 4, effect.size || 4);
  }

  // --- Helper Methods ---

  /**
   * Get entity position
   * @returns {Object} - Position {x, y}
   */
  getEntityPosition() {
    if (this._entity.getPosition && typeof this._entity.getPosition === 'function') {
      return this._entity.getPosition();
    }
    
    if (this._entity._sprite && this._entity._sprite.pos) {
      return this._entity._sprite.pos;
    }
    
    if (this._entity.posX !== undefined && this._entity.posY !== undefined) {
      return { x: this._entity.posX, y: this._entity.posY };
    }
    
    return { x: 0, y: 0 };
  }

  /**
   * Get entity size
   * @returns {Object} - Size {x, y}
   */
  getEntitySize() {
    if (this._entity.getSize && typeof this._entity.getSize === 'function') {
      return this._entity.getSize();
    }
    
    if (this._entity._sprite && this._entity._sprite.size) {
      return this._entity._sprite.size;
    }
    
    if (this._entity.sizeX !== undefined && this._entity.sizeY !== undefined) {
      return { x: this._entity.sizeX, y: this._entity.sizeY };
    }
    
    return { x: 20, y: 20 }; // Default size
  }

  /**
   * Get entity center position
   * @returns {Object} - Center position {x, y}
   */
  getEntityCenter() {
    const pos = this.getEntityPosition();
    const size = this.getEntitySize();
    
    return {
      x: pos.x + size.x / 2,
      y: pos.y + size.y / 2
    };
  }

  /**
   * Generate unique effect ID
   * @returns {string}
   */
  generateEffectId() {
    return `effect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get debug information
   * @returns {Object} - Debug info
   */
  getDebugInfo() {
    return {
      highlightState: this._highlightState,
      effectCount: this._effects.length,
      debugMode: this._debugMode,
      smoothing: this._smoothing,
      position: this.getEntityPosition(),
      size: this.getEntitySize(),
      center: this.getEntityCenter()
    };
  }

  // --- Selenium Testing Getters ---

  /**
   * Get current highlight state (for Selenium validation)
   * @returns {string|null} Current highlight type
   */
  getHighlightState() {
    return this._highlightState;
  }

  /**
   * Get highlight color (for Selenium validation)
   * @returns {Array|null} Current highlight color [r, g, b, a]
   */
  getHighlightColor() {
    return this._highlightColor ? [...this._highlightColor] : null;
  }

  /**
   * Get highlight intensity (for Selenium validation)
   * @returns {number} Current highlight intensity (0-1)
   */
  getHighlightIntensity() {
    return this._highlightIntensity;
  }

  /**
   * Check if highlight is active (for Selenium validation)
   * @returns {boolean} True if any highlight is active
   */
  isHighlighted() {
    return this._highlightState !== null;
  }

  /**
   * Get available highlight types (for Selenium validation)
   * @returns {Array<string>} Array of available highlight type names
   */
  getAvailableHighlights() {
    return Object.keys(this.HIGHLIGHT_TYPES);
  }

  /**
   * Get available state indicators (for Selenium validation)
   * @returns {Array<string>} Array of available state names
   */
  getAvailableStates() {
    return Object.keys(this.STATE_INDICATORS);
  }

  /**
   * Get current entity state from state machine (for Selenium validation)
   * @returns {string|null} Current entity state
   */
  getCurrentEntityState() {
    if (!this._entity || !this._entity._stateMachine) return null;
    return this._entity._stateMachine.primaryState || null;
  }

  /**
   * Check if state indicator is showing (for Selenium validation)
   * @returns {boolean} True if state indicator should be visible
   */
  isStateIndicatorVisible() {
    const currentState = this.getCurrentEntityState();
    return currentState && currentState !== "IDLE" && this.STATE_INDICATORS[currentState];
  }

  /**
   * Get expected state indicator symbol (for Selenium validation)
   * @returns {string|null} Expected symbol for current state
   */
  getExpectedStateSymbol() {
    const currentState = this.getCurrentEntityState();
    if (!currentState || !this.STATE_INDICATORS[currentState]) return null;
    return this.STATE_INDICATORS[currentState].symbol;
  }

  /**
   * Get visual effects count (for Selenium validation)
   * @returns {number} Number of active visual effects
   */
  getEffectsCount() {
    return this._effects.length;
  }

  /**
   * Get render controller validation data (for Selenium validation)
   * @returns {Object} Complete validation data for testing
   */
  getValidationData() {
    return {
      highlightState: this._highlightState,
      highlightColor: this._highlightColor ? [...this._highlightColor] : null,
      highlightIntensity: this._highlightIntensity,
      isHighlighted: this.isHighlighted(),
      entityState: this.getCurrentEntityState(),
      isStateIndicatorVisible: this.isStateIndicatorVisible(),
      expectedStateSymbol: this.getExpectedStateSymbol(),
      effectsCount: this._effects.length,
      availableHighlights: this.getAvailableHighlights(),
      availableStates: this.getAvailableStates(),
      position: this.getEntityPosition(),
      size: this.getEntitySize(),
      timestamp: new Date().toISOString()
    };
  }
}

// Export for Node.js testing
if (typeof module !== "undefined" && module.exports) {
  module.exports = RenderController;
}

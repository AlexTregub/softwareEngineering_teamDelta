/**
 * PowerButtonPanel
 * @module ui_new/components/PowerButtonPanel
 * 
 * Manages a panel of power buttons with background styling
 * Integrates PowerButton MVC triads (Model-View-Controller)
 * 
 * Features:
 * - Background panel (ResourceCountDisplay style)
 * - Multiple power buttons (horizontal layout)
 * - EventBus integration for cooldowns
 * - Queen unlock status synchronization
 */

class PowerButtonPanel {
  /**
   * Create a power button panel
   * @param {Object} p5Instance - p5.js instance
   * @param {Object} [options={}] - Configuration options
   * @param {number} [options.x] - X position (auto-centers if not provided)
   * @param {number} [options.y=60] - Y position
   * @param {string[]} [options.powers] - Array of power names to display
   * @param {number} [options.buttonSize=64] - Button size in pixels
   * @param {number} [options.buttonSpacing=20] - Spacing between buttons
   * @param {string} [options.bgColor='rgba(0, 0, 0, 0.7)'] - Background color
   */
  constructor(p5Instance, options = {}) {
    this.p5 = p5Instance;
    
    // Coordinate converter for normalized UI positioning
    this.coordConverter = new UICoordinateConverter(p5Instance);
    
    // Configuration
    this.buttonSize = options.buttonSize || 64;
    this.buttonSpacing = options.buttonSpacing || 20;
    this.padding = 16;
    this.bgColor = options.bgColor || 'rgba(0, 0, 0, 0.7)';
    
    // Powers to display (default: all unlockable powers)
    this.powerNames = options.powers || ['lightning', 'fireball', 'finalFlash'];
    
    // Calculate panel dimensions
    this.width = this._calculateWidth();
    this.height = this.buttonSize + (this.padding * 2);
    
    // Position in normalized coordinates (default: top-right, slightly inset)
    // Normalized coords: (-1,-1) = BL, (0,0) = center, (1,1) = TR
    const normalizedX = options.normalizedX !== undefined ? options.normalizedX : 0.7;
    const normalizedY = options.normalizedY !== undefined ? options.normalizedY : 0.8;
    
    // Convert normalized to screen coordinates
    const screenPos = this.coordConverter.normalizedToScreen(normalizedX, normalizedY);
    this.x = screenPos.x - this.width / 2; // Center panel on position
    this.y = screenPos.y - this.height / 2;
    
    // Create button MVC triads
    this.buttons = [];
    this._createButtons();
    
    // Update state
    this.enabled = true;
    
    // DEBUG: Log panel creation details
    console.log('🎨 PowerButtonPanel created:');
    console.log(`   Position: (${this.x.toFixed(1)}, ${this.y.toFixed(1)})`);
    console.log(`   Size: ${this.width}x${this.height}`);
    console.log(`   Normalized coords: (${normalizedX}, ${normalizedY})`);
    console.log(`   Buttons: ${this.buttons.length}`);
    this.buttons.forEach((btn, idx) => {
      console.log(`     ${idx}. ${btn.powerName}: (${btn.view.x.toFixed(1)}, ${btn.view.y.toFixed(1)}) size=${btn.view.size}`);
    });
  }

  /**
   * Calculate panel width based on button count
   * @private
   * @returns {number} Panel width
   */
  _calculateWidth() {
    const buttonCount = this.powerNames.length;
    const totalButtonWidth = buttonCount * this.buttonSize;
    const totalSpacing = (buttonCount - 1) * this.buttonSpacing;
    return totalButtonWidth + totalSpacing + (this.padding * 2);
  }

  /**
   * Create power button MVC triads
   * @private
   */
  _createButtons() {
    // Check if dependencies are loaded (check both window and global for test compatibility)
    const PowerButtonModelClass = typeof PowerButtonModel !== 'undefined' ? PowerButtonModel : 
                                   (typeof window !== 'undefined' && window.PowerButtonModel);
    const PowerButtonViewClass = typeof PowerButtonView !== 'undefined' ? PowerButtonView :
                                  (typeof window !== 'undefined' && window.PowerButtonView);
    const PowerButtonControllerClass = typeof PowerButtonController !== 'undefined' ? PowerButtonController :
                                        (typeof window !== 'undefined' && window.PowerButtonController);
    
    if (!PowerButtonModelClass || !PowerButtonViewClass || !PowerButtonControllerClass) {
      console.error('PowerButton MVC classes not loaded');
      return;
    }

    const startX = this.x + this.padding;
    const centerY = this.y + this.height / 2;

    this.powerNames.forEach((powerName, index) => {
      // Calculate button position
      const buttonX = startX + (index * (this.buttonSize + this.buttonSpacing)) + (this.buttonSize / 2);
      const buttonY = centerY;

      // Create MVC triad
      const model = new PowerButtonModelClass({
        powerName: powerName,
        isLocked: true, // Start locked, controller will update from Queen
        cooldownProgress: 0
      });

      const view = new PowerButtonViewClass(model, this.p5, {
        x: buttonX,
        y: buttonY,
        size: this.buttonSize
      });

      const controller = new PowerButtonControllerClass(model, view);

      this.buttons.push({
        powerName: powerName,
        model: model,
        view: view,
        controller: controller
      });
    });
  }

  /**
   * Update all button controllers
   */
  update() {
    if (!this.enabled) return;

    this.buttons.forEach(button => {
      button.controller.update();
    });
  }

  /**
   * Render panel and all buttons
   */
  render() {
    if (!this.enabled) return;

    // Render background panel
    this._renderBackground();

    // Render all buttons
    this.buttons.forEach(button => {
      button.view.render();
    });
  }

  /**
   * Render panel background
   * @private
   */
  _renderBackground() {
    this.p5.push();
    
    // Background
    this.p5.fill(this.bgColor);
    this.p5.noStroke();
    this.p5.rect(this.x, this.y, this.width, this.height, 8); // Rounded corners
    
    // Border (optional subtle outline)
    this.p5.noFill();
    this.p5.stroke(255, 255, 255, 50);
    this.p5.strokeWeight(1);
    this.p5.rect(this.x, this.y, this.width, this.height, 8);
    
    this.p5.pop();
  }

  /**
   * Handle click on panel
   * @param {number} x - Click X position (screen coordinates)
   * @param {number} y - Click Y position (screen coordinates)
   * @returns {boolean} True if click was handled
   */
  handleClick(x, y) {
    console.log(`🖱️ PowerButtonPanel.handleClick at (${x}, ${y})`);
    
    if (!this.enabled) {
      console.log('   ❌ Panel disabled');
      return false;
    }

    // Check if click is inside panel bounds
    if (!this._isPointInPanel(x, y)) {
      console.log(`   ❌ Outside panel bounds (${this.x}-${this.x + this.width}, ${this.y}-${this.y + this.height})`);
      return false;
    }

    console.log(`   ✅ Inside panel bounds`);

    // Check each button
    for (const button of this.buttons) {
      const btnX = button.view.x;
      const btnY = button.view.y;
      const btnSize = button.view.size;
      const inButton = button.view.isPointInside(x, y);
      
      console.log(`   Testing ${button.powerName}: (${btnX.toFixed(1)}, ${btnY.toFixed(1)}) size=${btnSize}, hit=${inButton}`);
      
      if (button.controller.handleClick(x, y)) {
        console.log(`   ✅ Button ${button.powerName} handled click!`);
        return true; // Button handled click
      }
    }

    console.log('   ⚠️ Click inside panel but no button responded');
    return false;
  }

  /**
   * Check if point is inside panel bounds
   * @private
   * @param {number} px - Point X
   * @param {number} py - Point Y
   * @returns {boolean} True if inside panel
   */
  _isPointInPanel(px, py) {
    return px >= this.x && px <= this.x + this.width &&
           py >= this.y && py <= this.y + this.height;
  }

  /**
   * Get button by power name
   * @param {string} powerName - Power name
   * @returns {Object|null} Button triad or null
   */
  getButton(powerName) {
    return this.buttons.find(b => b.powerName === powerName) || null;
  }

  /**
   * Enable/disable panel
   * @param {boolean} enabled - True to enable, false to disable
   */
  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.buttons.forEach(button => {
      if (button.controller.cleanup) {
        button.controller.cleanup();
      }
    });
  }

  /**
   * Register panel with RenderManager (for interactive layer)
   */
  registerInteractive() {
    if (typeof RenderManager === 'undefined') {
      console.warn('RenderManager not available');
      return;
    }

    console.log('📝 Registering PowerButtonPanel as interactive drawable...');

    RenderManager.addInteractiveDrawable(RenderManager.layers.UI_GAME, {
      id: 'power-button-panel',
      hitTest: (pointer) => {
        if (typeof GameState !== 'undefined' && GameState.getState && GameState.getState() !== 'PLAYING') {
          return false;
        }
        const x = pointer.screen ? pointer.screen.x : pointer.x;
        const y = pointer.screen ? pointer.screen.y : pointer.y;
        
        // Check if mouse is over any button and update hover states
        let anyButtonHovered = false;
        this.buttons.forEach(button => {
          const isOver = button.view.isPointInside(x, y);
          button.controller.setHovered(isOver);
          if (isOver) {
            anyButtonHovered = true;
            button.view.renderHoverHighlight = true;
          } else {
            button.view.renderHoverHighlight = false;
          }
        });
        
        // Return true if hovering over panel or any button
        const hit = this._isPointInPanel(x, y) || anyButtonHovered;
        return hit;
      },
      onPointerDown: (pointer) => {
        if (typeof GameState !== 'undefined' && GameState.getState && GameState.getState() !== 'PLAYING') {
          return false;
        }
        const x = pointer.screen ? pointer.screen.x : pointer.x;
        const y = pointer.screen ? pointer.screen.y : pointer.y;
        console.log(`👆 PowerButtonPanel.onPointerDown at (${x}, ${y})`);
        return this.handleClick(x, y);
      }
    });

    console.log('✅ PowerButtonPanel registered as interactive drawable');
  }
}

// Export for Node.js (testing) - check module.exports FIRST
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PowerButtonPanel;
}

// Make available globally for browser
if (typeof window !== 'undefined') {
  window.PowerButtonPanel = PowerButtonPanel;
}

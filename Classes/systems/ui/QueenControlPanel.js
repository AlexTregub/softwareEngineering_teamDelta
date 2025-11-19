/**
 * @fileoverview Queen Control Panel
 * Displays special controls when the queen ant is selected
 * 
 * RENDER LAYER INTEGRATION:
 * - Panel UI: Rendered through DraggablePanelManager (automatic)
 * - Visual Effects: Rendered through RenderLayerManager.renderQueenControlPanel() on UI_GAME layer
 * - Targeting cursor and range indicators are rendered on the UI_GAME layer for proper layering
 * 
 * @author Software Engineering Team Delta
 * @version 1.0.0
 */

/**
 * QueenControlPanel - Special panel for queen ant abilities
 */
class QueenControlPanel {
  constructor() {
    this.isVisible = false;
    this.selectedQueen = null;
    this.panelId = 'queen-powers-panel';
    this.panel = null;
    
    // Panel properties
    this.position = { x: 20, y: 380 };
    this.size = { width: 160, height: 120 };
    this.title = 'Queen Powers';
    
    // Fireball properties
    this.fireballDamage = 30;
    this.fireballCooldown = 1000; // milliseconds
    this.lastFireballTime = 0;
    
    // Visual feedback
    this.targetingMode = false;
    this.targetCursor = { x: 0, y: 0, visible: false };
    
    // Power cycling state
    this.currentPowerIndex = -1;
    this.allPowers = [
      {
        name: 'Fireball',
        key: 'fireball',
        activate: () => {
          this.activateFireballTargeting();
        }
      },
      {
        name: 'Lightning',
        key: 'lightning',
        activate: () => {
          // Initialize lightning brush if needed
          if (typeof window.g_lightningAimBrush === 'undefined' || !window.g_lightningAimBrush) {
            if (typeof window.initializeLightningAimBrush === 'function') {
              window.g_lightningAimBrush = window.initializeLightningAimBrush();
              
              // Register the render function with RenderLayerManager
              if (typeof RenderManager !== 'undefined' && RenderManager && 
                  typeof RenderManager.addDrawableToLayer === 'function' &&
                  typeof window.g_lightningAimBrush.render === 'function') {
                RenderManager.addDrawableToLayer(
                  RenderManager.layers.UI_GAME, 
                  window.g_lightningAimBrush.render.bind(window.g_lightningAimBrush)
                );
              }
            } else {
              console.warn('⚠️ Lightning Aim Brush system not available');
              return;
            }
          }
          
          // Activate lightning aim brush
          if (window.g_lightningAimBrush) {
            // If already active, don't toggle off - just ensure it's on
            if (!window.g_lightningAimBrush.isActive) {
              window.g_lightningAimBrush.toggle();
            }
          }
        }
      },
      {
        name: 'Blackhole',
        key: 'blackhole',
        activate: () => {
        }
      },
      {
        name: 'Sludge',
        key: 'sludge',
        activate: () => {
        }
      },
      {
        name: 'Tidal Wave',
        key: 'tidalWave',
        activate: () => {
        }
      },
      {
        name: 'Final Flash',
        key: 'finalFlash',
        activate: () => {
          // Initialize lightning brush if needed
          if (typeof window.g_flashAimBrush === 'undefined' || !window.g_flashAimBrush) {
            if (typeof window.initializeFlashAimBrush === 'function') {
              window.g_flashAimBrush = window.initializeFlashAimBrush();
              
              // Register the render function with RenderLayerManager
              if (typeof RenderManager !== 'undefined' && RenderManager && 
                  typeof RenderManager.addDrawableToLayer === 'function' &&
                  typeof window.g_flashAimBrush.render === 'function') {
                RenderManager.addDrawableToLayer(
                  RenderManager.layers.UI_GAME, 
                  window.g_flashAimBrush.render.bind(window.g_flashAimBrush)
                );
              }
            } else {
              console.warn('⚠️ final flash Aim Brush system not available');
              return;
            }
          }
          
          // Activate lightning aim brush
          if (window.g_flashAimBrush) {
            this.updatePowerState({
              isActive: window.g_flashAimBrush.isActive,
              hasRender: typeof window.g_flashAimBrush.render === 'function'
            });
            
            // If already active, don't toggle off - just ensure it's on
            if (!window.g_flashAimBrush.isActive) {
              window.g_flashAimBrush.toggle();
            }
            this.updatePowerState({
              isActive: window.g_flashAimBrush.isActive
            });
          }
        }
      }
    ];
    
    // Interaction timer - keeps panel visible for 3 seconds after last interaction
    this.lastInteractionTime = 0;
    this.interactionDelay = 3000; // 3 seconds in milliseconds
  }

  /**
   * Show the panel for the selected queen
   * @param {Object} queen - The selected queen ant
   */
  show(queen) {
    if (!queen) return;
    
    this.selectedQueen = queen;
    this.isVisible = true;
    this.lastInteractionTime = Date.now(); // Reset interaction timer
    
    // Create or update the draggable panel
    this.createPanel();
    
  }

  /**
   * Hide the panel
   */
  hide() {
    this.isVisible = false;
    this.selectedQueen = null;
    this.targetingMode = false;
    this.targetCursor.visible = false;
    
    // Remove the panel if it exists
    if (this.panel && window.draggablePanelManager) {
      window.draggablePanelManager.removePanel(this.panelId);
      this.panel = null;
    }
    
  }

  /**
   * Create the draggable panel with power controls
   */
  createPanel() {
    if (!window.draggablePanelManager) return;

    // Remove existing panel if it exists
    if (this.panel) {
      window.draggablePanelManager.removePanel(this.panelId);
      this.panel = null;
    }

    // ButtonStyles might not be available yet, so use inline styles
    const successStyle = window.ButtonStyles ? 
      { ...window.ButtonStyles.SUCCESS, backgroundColor: '#32CD32', color: '#FFFFFF' } :
      { backgroundColor: '#32CD32', color: '#FFFFFF' };
    
    const infoStyle = window.ButtonStyles ? 
      { ...window.ButtonStyles.INFO, backgroundColor: '#555555', color: '#999999' } :
      { backgroundColor: '#555555', color: '#999999' };

    // Create new panel with power controls - addPanel creates the DraggablePanel internally
    this.panel = window.draggablePanelManager.addPanel({
      id: this.panelId,
      title: this.title,
      position: this.position,
      size: this.size,
      buttons: {
        layout: 'vertical',
        spacing: 6,
        buttonWidth: 140,
        buttonHeight: 28,
        items: [
          {
            caption: 'Place Dropoff',
            onClick: () => this.handlePlaceDropoff(),
            style: successStyle
          },
          {
            caption: 'Power: None',
            onClick: () => this.activateCurrentPower(),
            style: infoStyle // Greyed out by default
          }
        ]
      }
    });
    
    // Update power button state based on unlocked powers
    this.updatePowerButtonState();
  }

  /**
   * Activate fireball targeting mode
   */
  activateFireballTargeting() {
    if (!this.selectedQueen) return;
    
    // Check cooldown
    const now = Date.now();
    if (now - this.lastFireballTime < this.fireballCooldown) {
      const remainingTime = Math.ceil((this.fireballCooldown - (now - this.lastFireballTime)) / 1000);
      return;
    }
    
    this.targetingMode = true;
    this.targetCursor.visible = true;
  }

  /**
   * Cancel targeting mode
   */
  cancelTargeting() {
    this.targetingMode = false;
    this.targetCursor.visible = false;
  }

  /**
   * Handle Place Dropoff button click
   */
  handlePlaceDropoff() {
    // Reset interaction timer
    this.lastInteractionTime = Date.now();
    
    // Activate dropoff placement mode
    if (typeof window.g_dropoffTilePlacementMode !== 'undefined') {
      window.g_dropoffTilePlacementMode = true;
    } else if (typeof window.activateDropoffPlacement === 'function') {
      window.activateDropoffPlacement();
    } else {
      // Fallback: set global flag
      window.g_dropoffTilePlacementMode = true;
    }
  }

  /**
   * Update the Power button state based on unlocked powers
   */
  updatePowerButtonState() {
    if (!this.selectedQueen || !this.panel) return;
    
    const button = this.findButtonByCaption('Power:', true);
    if (!button) return;

    const unlockedPowers = this.getUnlockedPowers();

    if (unlockedPowers.length > 0) {
      // Enable button with bright colors
      button.backgroundColor = '#1E90FF';
      button.textColor = '#FFFFFF';
      
      // Set to first power if none selected
      if (this.currentPowerIndex < 0 || this.currentPowerIndex >= unlockedPowers.length) {
        this.currentPowerIndex = 0;
      }
      
      // Update button caption with current power
      const currentPower = unlockedPowers[this.currentPowerIndex];
      button.caption = `Power: ${currentPower.name}`;
    } else {
      // Grey out button
      button.backgroundColor = '#555555';
      button.textColor = '#999999';
      button.caption = 'Power: None';
      this.currentPowerIndex = -1;
    }
  }

  /**
   * Get unlocked powers for the selected queen
   * @returns {Array} Array of unlocked power objects
   */
  getUnlockedPowers() {
    if (!this.selectedQueen) return [];
    
    return this.allPowers.filter(p => 
      this.selectedQueen.isPowerUnlocked && this.selectedQueen.isPowerUnlocked(p.key)
    );
  }

  /**
   * Cycle to next power (used by mouse wheel and right-click)
   * @param {number} direction - 1 for next, -1 for previous
   */
  cyclePower(direction = 1) {
    if (!this.selectedQueen) return;

    // Reset interaction timer
    this.lastInteractionTime = Date.now();

    const unlockedPowers = this.getUnlockedPowers();
    if (unlockedPowers.length === 0) {
      return;
    }

    // Cycle to next/previous power
    this.currentPowerIndex = (this.currentPowerIndex + direction) % unlockedPowers.length;
    if (this.currentPowerIndex < 0) {
      this.currentPowerIndex = unlockedPowers.length - 1;
    }

    // Update button caption
    this.updatePowerButtonState();

    const currentPower = unlockedPowers[this.currentPowerIndex];
  }

  /**
   * Activate the currently selected power
   */
  activateCurrentPower() {
    if (!this.selectedQueen) return;

    // Reset interaction timer
    this.lastInteractionTime = Date.now();

    const unlockedPowers = this.getUnlockedPowers();
    if (unlockedPowers.length === 0) {
      return;
    }

    if (this.currentPowerIndex < 0 || this.currentPowerIndex >= unlockedPowers.length) {
      this.currentPowerIndex = 0;
    }

    const currentPower = unlockedPowers[this.currentPowerIndex];
    
    // Activate the power
    currentPower.activate();
  }

  /**
   * Handle mouse wheel scroll for power cycling
   * @param {number} delta - Scroll delta (positive = scroll up, negative = scroll down)
   * @returns {boolean} True if scroll was handled
   */
  handleMouseWheel(delta) {
    if (!this.isVisible || !this.selectedQueen) return false;

    const unlockedPowers = this.getUnlockedPowers();
    if (unlockedPowers.length === 0) return false;

    // Scroll up = next power, scroll down = previous power
    this.cyclePower(delta > 0 ? 1 : -1);
    return true;
  }

  /**
   * Handle right-click for power cycling
   * @returns {boolean} True if right-click was handled
   */
  handleRightClick() {
    if (!this.isVisible || !this.selectedQueen) return false;

    const unlockedPowers = this.getUnlockedPowers();
    if (unlockedPowers.length === 0) return false;

    // Right-click cycles to next power
    this.cyclePower(1);
    return true;
  }

  /**
   * Find a button by caption (supports partial matching)
   * @param {string} caption - Button caption to search for
   * @param {boolean} partialMatch - Allow partial matching
   * @returns {Object|null} Button object or null
   */
  findButtonByCaption(caption, partialMatch = false) {
    if (!this.panel || !this.panel.buttons) return null;

    return this.panel.buttons.find(btn => {
      if (partialMatch) {
        return btn.caption && btn.caption.includes(caption);
      }
      return btn.caption === caption;
    });
  }

  /**
   * Handle mouse click for fireball targeting
   * @param {number} mouseX - Mouse X position
   * @param {number} mouseY - Mouse Y position
   * @returns {boolean} True if click was handled
   */
  handleMouseClick(mouseX, mouseY) {
    if (!this.targetingMode || !this.selectedQueen) return false;

    // Reset interaction timer
    this.lastInteractionTime = Date.now();

    // Fire fireball at clicked location
    this.fireFireball(mouseX, mouseY);
    return true;
  }

  /**
   * Fire a fireball from queen to target location
   * @param {number} targetScreenX - Target screen X position
   * @param {number} targetScreenY - Target screen Y position
   */
  fireFireball(targetScreenX, targetScreenY) {
    if (!this.selectedQueen || !window.g_fireballManager) {
      console.warn('⚠️ Cannot fire fireball - missing queen or fireball system');
      return;
    }

    // Get queen position in world coordinates
    const queenPosWorld = this.selectedQueen.getPosition();
    
    // Convert screen coordinates to world coordinates for the target
    let targetWorldX = targetScreenX;
    let targetWorldY = targetScreenY;
    
    if (typeof g_activeMap !== 'undefined' && g_activeMap && g_activeMap.renderConversion && typeof TILE_SIZE !== 'undefined') {
      // Convert screen position back to tile coordinates
      const tilePos = g_activeMap.renderConversion.convCanvasToPos([targetScreenX, targetScreenY]);
      // Convert tile coordinates to world pixels (subtract 0.5 to reverse the centering)
      targetWorldX = (tilePos[0] - 0.5) * TILE_SIZE;
      targetWorldY = (tilePos[1] - 0.5) * TILE_SIZE;
    }
    
    // Create fireball using world coordinates
    window.g_fireballManager.createFireball(
      queenPosWorld.x, 
      queenPosWorld.y, 
      targetWorldX, 
      targetWorldY, 
      this.fireballDamage
    );

    // Update cooldown
    this.lastFireballTime = Date.now();

    // Exit targeting mode
    this.cancelTargeting();

  }

  /**
   * Update the panel
   */
  update() {
    if (!this.isVisible) return;

    // Update target cursor position
    if (this.targetingMode && typeof mouseX !== 'undefined' && typeof mouseY !== 'undefined') {
      this.targetCursor.x = mouseX;
      this.targetCursor.y = mouseY;
    }

    // Check if queen is still alive (always hide if dead)
    if (
      this.selectedQueen &&
      typeof this.selectedQueen.health !== 'undefined' &&
      this.selectedQueen.health <= 0
    ) {
      this.hide();
      return;
    }

    // Check if queen is deselected, but use the interaction timer
    if (
      this.selectedQueen &&
      typeof this.selectedQueen.isSelected !== 'undefined' &&
      !this.selectedQueen.isSelected
    ) {
      // Check if interaction delay has passed
      const timeSinceInteraction = Date.now() - this.lastInteractionTime;
      if (timeSinceInteraction >= this.interactionDelay) {
        this.hide();
      }
      // Otherwise, keep panel visible even though queen is deselected
    }
  }

  /**
   * Render targeting cursor and other visual effects
   * This method should be called from the UI_GAME render layer
   */
  render() {
    if (!this.isVisible) return;

    // Render targeting cursor
    if (this.targetingMode && this.targetCursor.visible) {
      this.renderTargetingCursor();
    }

    // Render range indicator around queen
    if (this.targetingMode && this.selectedQueen) {
      this.renderFireballRange();
    }
  }

  /**
   * Render the targeting cursor
   */
  renderTargetingCursor() {
    push();
    
    const x = this.targetCursor.x;
    const y = this.targetCursor.y;
    const size = 20 + Math.sin(millis() * 0.01) * 3;
    
    // Crosshair
    stroke(255, 100, 0, 200);
    strokeWeight(2);
    line(x - size, y, x + size, y);
    line(x, y - size, x, y + size);
    
    // Outer circle
    noFill();
    stroke(255, 100, 0, 150);
    strokeWeight(1);
    ellipse(x, y, size * 2, size * 2);
    
    // Inner dot
    fill(255, 255, 0, 200);
    noStroke();
    ellipse(x, y, 4, 4);
    
    pop();
  }

  /**
   * Render fireball range indicator around queen
   */
  renderFireballRange() {
    if (!this.selectedQueen) return;
    
    push();
    
    const range = 300; // Fireball range
    
    // Use Entity's getScreenPosition for proper coordinate conversion
    const screenPos = this.selectedQueen.getScreenPosition();
    
    noFill();
    stroke(255, 100, 0, 80);
    strokeWeight(1);
    ellipse(screenPos.x, screenPos.y, range * 2, range * 2);
    
    pop();
  }

  /**
   * Check if queen is selected
   * @returns {boolean} True if visible
   */
  isQueenSelected() {
    return this.isVisible && this.selectedQueen !== null;
  }

  /**
   * Get debug information
   * @returns {Object} Debug info
   */
  getDebugInfo() {
    return {
      isVisible: this.isVisible,
      hasSelectedQueen: this.selectedQueen !== null,
      targetingMode: this.targetingMode,
      fireballCooldown: this.fireballCooldown,
      lastFireballTime: this.lastFireballTime,
      timeUntilNextFireball: Math.max(0, this.fireballCooldown - (Date.now() - this.lastFireballTime))
    };
  }
}

// Create global instance
let g_queenControlPanel = null;

/**
 * Initialize the queen control panel system
 */
function initializeQueenControlPanel() {
  if (!g_queenControlPanel) {
    g_queenControlPanel = new QueenControlPanel();
  }
  return g_queenControlPanel;
}

/**
 * Check if a queen is selected and show/hide panel accordingly
 */
function updateQueenPanelVisibility() {
  if (!g_queenControlPanel) return;

  // Check if any queen is selected
  let selectedQueen = null;
  
  if (typeof ants !== 'undefined' && Array.isArray(ants)) {
    selectedQueen = ants.find(ant => 
      ant && 
      ant.isSelected && 
      (ant.jobName === 'Queen' || ant.job === 'Queen' || (ant.constructor && ant.constructor.name === 'QueenAnt')) &&
      ant.health > 0
    );
  }
  
  // Also check playerQueen global
  if (!selectedQueen && typeof playerQueen !== 'undefined' && playerQueen && playerQueen.isSelected) {
    selectedQueen = playerQueen;
  }

  // Show panel if queen is selected
  if (selectedQueen && !g_queenControlPanel.isVisible) {
    g_queenControlPanel.show(selectedQueen);
  } else if (selectedQueen && g_queenControlPanel.isVisible) {
    // Queen still selected - update selected queen reference and reset timer
    g_queenControlPanel.selectedQueen = selectedQueen;
    g_queenControlPanel.lastInteractionTime = Date.now();
    g_queenControlPanel.updatePowerButtonState();
  }
  // Note: Don't hide here if queen is deselected - let update() handle it with the 3-second delay
}

// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
  // Make classes available globally
  window.QueenControlPanel = QueenControlPanel;
  window.initializeQueenControlPanel = initializeQueenControlPanel;
  window.updateQueenPanelVisibility = updateQueenPanelVisibility;
  window.g_queenControlPanel = initializeQueenControlPanel();
  
  // Add global console command to force show queen panel (for testing)
  window.testQueenPanel = function() {
    
    if (!window.g_queenControlPanel) {
      console.error('❌ Queen Control Panel not initialized');
      return false;
    }
    
    // Find any queen ant to test with
    let testQueen = null;
    if (typeof ants !== 'undefined' && Array.isArray(ants)) {
      testQueen = ants.find(ant => ant && ant.jobName === 'Queen');
    }
    
    if (!testQueen) {
      console.warn('⚠️ No queen ant found for testing');
      return false;
    }
    
    // Force select the queen and show panel
    testQueen.isSelected = true;
    window.g_queenControlPanel.show(testQueen);
    
    
    return true;
  };
  
  // Add global console command to check queen panel state
  window.checkQueenPanelState = function() {
    if (!window.g_queenControlPanel) {
      console.error('❌ Queen Control Panel not initialized');
      return null;
    }
    
    const state = window.g_queenControlPanel.getDebugInfo();
    return state;
  };
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { QueenControlPanel, initializeQueenControlPanel, updateQueenPanelVisibility };
}
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
  }

  /**
   * Show the panel for the selected queen
   * @param {Object} queen - The selected queen ant
   */
  show(queen) {
    if (!queen) return;
    
    this.selectedQueen = queen;
    this.isVisible = true;
    
    // Create or update the draggable panel
    this.createPanel();
    
    console.log('👑 Queen Control Panel shown');
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
    
    console.log('👑 Queen Control Panel hidden');
  }

  /**
   * Create the draggable panel with power controls
   */
  createPanel() {
    if (!window.draggablePanelManager || !window.DraggablePanel) return;

    // Remove existing panel if it exists
    if (this.panel) {
      window.draggablePanelManager.removePanel(this.panelId);
    }

    // ButtonStyles might not be available yet, so use inline styles
    const successStyle = window.ButtonStyles ? 
      { ...window.ButtonStyles.SUCCESS, backgroundColor: '#32CD32', color: '#FFFFFF' } :
      { backgroundColor: '#32CD32', color: '#FFFFFF' };
    
    const infoStyle = window.ButtonStyles ? 
      { ...window.ButtonStyles.INFO, backgroundColor: '#555555', color: '#999999' } :
      { backgroundColor: '#555555', color: '#999999' };

    // Create new panel with power controls
    this.panel = new window.DraggablePanel({
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
            caption: 'Use Power',
            onClick: () => this.cyclePower(),
            style: infoStyle // Greyed out by default
          }
        ]
      }
    });

    // Add panel to manager
    window.draggablePanelManager.addPanel(this.panel);
    
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
      console.log(`🔥 Fireball on cooldown for ${remainingTime} more seconds`);
      return;
    }
    
    this.targetingMode = true;
    this.targetCursor.visible = true;
    console.log('🎯 Fireball targeting activated - click to fire!');
  }

  /**
   * Cancel targeting mode
   */
  cancelTargeting() {
    this.targetingMode = false;
    this.targetCursor.visible = false;
    console.log('🎯 Fireball targeting cancelled');
  }

  /**
   * Handle Place Dropoff button click
   */
  handlePlaceDropoff() {
    // Activate dropoff placement mode
    if (typeof window.g_dropoffTilePlacementMode !== 'undefined') {
      window.g_dropoffTilePlacementMode = true;
      console.log("🎯 Place Dropoff: click a tile to place, press ESC to cancel.");
    } else if (typeof window.activateDropoffPlacement === 'function') {
      window.activateDropoffPlacement();
    } else {
      console.log("🎯 Place Dropoff: click a tile to place, press ESC to cancel.");
      // Fallback: set global flag
      window.g_dropoffTilePlacementMode = true;
    }
  }

  /**
   * Update the Use Power button state based on unlocked powers
   */
  updatePowerButtonState() {
    if (!this.selectedQueen || !this.panel) return;
    
    const button = this.findButtonByCaption('Use Power', true);
    if (!button) return;

    const unlockedPowers = this.selectedQueen.getUnlockedPowers ? 
      this.selectedQueen.getUnlockedPowers() : [];

    if (unlockedPowers.length > 0) {
      // Enable button with bright colors
      button.style.backgroundColor = '#1E90FF';
      button.style.color = '#FFFFFF';
      button.caption = 'Use Power: None';
    } else {
      // Grey out button
      button.style.backgroundColor = '#555555';
      button.style.color = '#999999';
      button.caption = 'Use Power';
      
      // Reset current power if no powers unlocked
      if (button.style.backgroundColor === '#555555' || button.caption === 'Use Power') {
        this.currentPowerIndex = -1;
        button.caption = 'Use Power';
      }
    }
  }

  /**
   * Cycle through unlocked powers and activate the selected one
   */
  cyclePower() {
    if (!this.selectedQueen) return;

    const button = this.findButtonByCaption('Use Power', true); // partial match
    if (!button) return;

    // Define all powers with their activation logic
    const allPowers = [
      {
        name: 'Fireball',
        key: 'fireball',
        activate: () => {
          console.log('🔥 Fireball activated!');
          this.activateFireballTargeting();
        }
      },
      {
        name: 'Lightning',
        key: 'lightning',
        activate: () => {
          console.log('⚡ Lightning activated!');
          if (typeof window.activateLightning === 'function') {
            window.activateLightning();
          } else {
            console.log('⚡ Lightning system: Click to strike enemies');
          }
        }
      },
      {
        name: 'Blackhole',
        key: 'blackhole',
        activate: () => {
          console.log('🌀 Blackhole power - not yet implemented');
        }
      },
      {
        name: 'Sludge',
        key: 'sludge',
        activate: () => {
          console.log('☠️ Sludge power - not yet implemented');
        }
      },
      {
        name: 'Tidal Wave',
        key: 'tidalWave',
        activate: () => {
          console.log('🌊 Tidal Wave power - not yet implemented');
        }
      }
    ];

    // Filter to only unlocked powers
    const unlockedPowers = allPowers.filter(p => 
      this.selectedQueen.isPowerUnlocked && this.selectedQueen.isPowerUnlocked(p.key)
    );

    if (unlockedPowers.length === 0) {
      console.log('❌ No powers unlocked yet! Use the cheats panel to unlock powers.');
      return;
    }

    // Cycle to next power
    this.currentPowerIndex = (this.currentPowerIndex + 1) % unlockedPowers.length;
    const currentPower = unlockedPowers[this.currentPowerIndex];

    // Update button caption
    button.caption = `Use Power: ${currentPower.name}`;

    // Activate the power
    currentPower.activate();

    console.log(`👑 Queen power cycled to: ${currentPower.name}`);
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

    // Fire fireball at clicked location
    this.fireFireball(mouseX, mouseY);
    return true;
  }

  /**
   * Fire a fireball from queen to target location
   * @param {number} targetX - Target X position
   * @param {number} targetY - Target Y position
   */
  fireFireball(targetX, targetY) {
    if (!this.selectedQueen || !window.g_fireballManager) {
      console.warn('⚠️ Cannot fire fireball - missing queen or fireball system');
      return;
    }

    // Get queen position
    const queenPos = this.selectedQueen.getPosition();
    
    // Create fireball
    window.g_fireballManager.createFireball(
      queenPos.x, 
      queenPos.y, 
      targetX, 
      targetY, 
      this.fireballDamage
    );

    // Update cooldown
    this.lastFireballTime = Date.now();

    // Exit targeting mode
    this.cancelTargeting();

    console.log(`🔥 Queen fired fireball from (${Math.round(queenPos.x)}, ${Math.round(queenPos.y)}) to (${Math.round(targetX)}, ${Math.round(targetY)})`);
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

    // Check if queen is still selected and alive
    if (
      this.selectedQueen &&
      typeof this.selectedQueen.isSelected !== 'undefined' &&
      typeof this.selectedQueen.health !== 'undefined' &&
      (!this.selectedQueen.isSelected || this.selectedQueen.health <= 0)
    ) {
      this.hide();
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
    
    const queenPos = this.selectedQueen.getPosition();
    const range = 300; // Fireball range
    
    noFill();
    stroke(255, 100, 0, 80);
    strokeWeight(1);
    ellipse(queenPos.x, queenPos.y, range * 2, range * 2);
    
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
    console.log('👑 Queen Control Panel system initialized');
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

  // Show or hide panel based on selection
  if (selectedQueen && !g_queenControlPanel.isVisible) {
    g_queenControlPanel.show(selectedQueen);
  } else if (!selectedQueen && g_queenControlPanel.isVisible) {
    g_queenControlPanel.hide();
  } else if (selectedQueen && g_queenControlPanel.isVisible) {
    // Queen still selected - update power button state in case powers changed
    g_queenControlPanel.updatePowerButtonState();
  }
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
    console.log('🧪 Testing Queen Control Panel...');
    
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
    
    console.log('✅ Queen Control Panel forced visible for testing');
    console.log('📊 Panel state:', window.g_queenControlPanel.getDebugInfo());
    
    return true;
  };
  
  // Add global console command to check queen panel state
  window.checkQueenPanelState = function() {
    if (!window.g_queenControlPanel) {
      console.error('❌ Queen Control Panel not initialized');
      return null;
    }
    
    const state = window.g_queenControlPanel.getDebugInfo();
    console.log('👑 Queen Control Panel state:', state);
    return state;
  };
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { QueenControlPanel, initializeQueenControlPanel, updateQueenPanelVisibility };
}
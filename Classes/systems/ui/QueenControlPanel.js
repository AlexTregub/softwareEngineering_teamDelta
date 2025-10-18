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
    this.panelId = 'queen-control-panel';
    this.panel = null;
    
    // Panel properties
    this.position = { x: 20, y: 150 };
    this.size = { width: 180, height: 120 };
    this.title = 'Queen Commands';
    
    // Fireball properties
    this.fireballDamage = 30;
    this.fireballCooldown = 1000; // milliseconds
    this.lastFireballTime = 0;
    
    // Visual feedback
    this.targetingMode = false;
    this.targetCursor = { x: 0, y: 0, visible: false };
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
   * Create the draggable panel
   */
  createPanel() {
    if (!window.draggablePanelManager || !window.DraggablePanel) return;

    // Remove existing panel if it exists
    if (this.panel) {
      window.draggablePanelManager.removePanel(this.panelId);
    }

    // Create new panel
    this.panel = new window.DraggablePanel({
      id: this.panelId,
      title: this.title,
      position: this.position,
      size: this.size,
      buttons: {
        layout: 'vertical',
        spacing: 8,
        buttonWidth: 150,
        buttonHeight: 28,
        items: [
          {
            caption: 'Fireball Attack',
            onClick: () => this.activateFireballTargeting(),
            style: { 
              backgroundColor: '#FF4500', 
              color: '#FFFFFF',
              border: '2px solid #FF6500'
            }
          },
          {
            caption: 'Cancel Targeting',
            onClick: () => this.cancelTargeting(),
            style: { 
              backgroundColor: '#666666', 
              color: '#FFFFFF',
              border: '2px solid #888888'
            }
          }
        ]
      }
    });

    // Add panel to manager
    window.draggablePanelManager.addPanel(this.panel);
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
    if (this.selectedQueen && (!this.selectedQueen.isSelected || this.selectedQueen.health <= 0)) {
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
      ant.jobName === 'Queen' && 
      ant.health > 0
    );
  }

  // Show or hide panel based on selection
  if (selectedQueen && !g_queenControlPanel.isVisible) {
    g_queenControlPanel.show(selectedQueen);
  } else if (!selectedQueen && g_queenControlPanel.isVisible) {
    g_queenControlPanel.hide();
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
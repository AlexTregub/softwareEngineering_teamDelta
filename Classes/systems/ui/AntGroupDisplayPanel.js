/**
 * @fileoverview AntGroupDisplayPanel - UI component for displaying ant control groups
 * @module AntGroupDisplayPanel
 * @author Software Engineering Team Delta  
 * @version 1.0.0
 * @see {@link test/integration/antGroupDisplayPanel.integration.test.js} Integration tests
 */

/**
 * Creates and manages the ant group display panel UI.
 * Integrates with DraggablePanelManager to show group information in bottom-left corner.
 * Provides clickable group buttons for selection and visual feedback.
 * 
 * @class AntGroupDisplayPanel
 * @example
 * const panelController = new AntGroupDisplayPanel(groupManager, draggablePanelManager);
 * panelController.initialize();
 * 
 * // In your draw loop:
 * panelController.update();
 * panelController.render();
 */
class AntGroupDisplayPanel {
  /**
   * Creates a new AntGroupDisplayPanel instance.
   * 
   * @param {AntGroupManager} groupManager - The group manager instance
   * @param {DraggablePanelManager} panelManager - The panel manager instance
   */
  constructor(groupManager, panelManager) {
    this.groupManager = groupManager;
    this.panelManager = panelManager;
    
    /** @type {string} Panel ID for DraggablePanelManager */
    this.panelId = 'ant-groups-display';
    
    /** @type {boolean} Whether the panel has been initialized */
    this.initialized = false;
    
    /** @type {Object} Panel configuration */
    this.config = {
      position: { x: 20, y: window.innerHeight - 180 }, // Bottom-left
      size: { width: 200, height: 150 },
      title: 'Ant Groups',
      style: {
        backgroundColor: [40, 40, 40, 200],
        borderColor: [100, 100, 100, 255],
        borderWidth: 2,
        titleColor: [255, 255, 255, 255],
        textColor: [200, 200, 200, 255]
      }
    };

    /** @type {Array<Object>} Clickable group buttons */
    this.groupButtons = [];
    
    /** @type {Object} Mouse interaction tracking */
    this.mouseState = {
      lastClickTime: 0,
      clickCooldown: 200 // ms
    };

    /** @type {Object} Visual styling */
    this.styling = {
      buttonSize: 24,
      buttonSpacing: 4,
      buttonsPerRow: 5,
      groupColors: {
        empty: [80, 80, 80, 150],
        filled: [60, 120, 180, 200],
        selected: [100, 200, 100, 220],
        partiallySelected: [200, 150, 100, 200],
        hover: [120, 140, 200, 240]
      }
    };

    /** @type {number} Hover state tracking */
    this.hoveredButton = -1;
  }

  /**
   * Initialize the group display panel.
   * Creates the panel in DraggablePanelManager and sets up event handling.
   * 
   * @returns {boolean} True if initialization succeeded
   */
  initialize() {
    if (this.initialized) {
      console.warn('AntGroupDisplayPanel already initialized');
      return true;
    }

    if (!this.groupManager || !this.panelManager) {
      console.error('AntGroupDisplayPanel: Required managers not provided');
      return false;
    }

    try {
      // Create the panel in DraggablePanelManager
      const panel = this.panelManager.addPanel({
        id: this.panelId,
        title: this.config.title,
        position: this.config.position,
        size: this.config.size,
        style: this.config.style,
        visible: true
      });

      if (!panel) {
        console.error('Failed to create ant groups panel');
        return false;
      }

      // Initialize group buttons
      this.createGroupButtons();

      this.initialized = true;
      console.log('✅ AntGroupDisplayPanel initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize AntGroupDisplayPanel:', error);
      return false;
    }
  }

  /**
   * Create clickable buttons for each group.
   * @private
   */
  createGroupButtons() {
    this.groupButtons = [];
    
    for (let i = 1; i <= 9; i++) {
      const row = Math.floor((i - 1) / this.styling.buttonsPerRow);
      const col = (i - 1) % this.styling.buttonsPerRow;
      
      const button = {
        groupNumber: i,
        x: 10 + col * (this.styling.buttonSize + this.styling.buttonSpacing),
        y: 30 + row * (this.styling.buttonSize + this.styling.buttonSpacing),
        width: this.styling.buttonSize,
        height: this.styling.buttonSize,
        enabled: true
      };
      
      this.groupButtons.push(button);
    }
  }

  /**
   * Update the panel state and handle interactions.
   * Should be called in the main update loop.
   * 
   * @param {number} mouseX - Current mouse X position
   * @param {number} mouseY - Current mouse Y position  
   * @param {boolean} mousePressed - Whether mouse is pressed
   * @returns {boolean} True if panel handled the interaction
   */
  update(mouseX = 0, mouseY = 0, mousePressed = false) {
    if (!this.initialized || !this.isVisible()) {
      return false;
    }

    // Update hover state
    this.updateHoverState(mouseX, mouseY);

    // Handle click interactions
    if (mousePressed && this.canHandleClick()) {
      return this.handleClick(mouseX, mouseY);
    }

    return false;
  }

  /**
   * Render the group display panel.
   * Should be called in the main render loop.
   */
  render() {
    if (!this.initialized || !this.isVisible()) {
      return;
    }

    // Get panel from manager for rendering context
    const panel = this.panelManager.getPanel(this.panelId);
    if (!panel) return;

    // The DraggablePanel handles the main panel rendering
    // We just need to provide the content renderer
    panel.render((panelContext) => {
      this.renderPanelContent(panelContext);
    });
  }

  /**
   * Render the content inside the panel.
   * @private
   * @param {Object} panelContext - Panel rendering context
   */
  renderPanelContent(panelContext) {
    if (!panelContext || typeof fill === 'undefined') return;

    // Get current group data
    const groupDisplay = this.groupManager.getGroupDisplay();
    const groupData = this.createGroupDataMap(groupDisplay);

    // Render group buttons
    this.renderGroupButtons(groupData, panelContext);

    // Render status text
    this.renderStatusText(groupDisplay, panelContext);
  }

  /**
   * Create a map of group data for quick lookup.
   * @private
   */
  createGroupDataMap(groupDisplay) {
    const groupData = {};
    for (const group of groupDisplay) {
      groupData[group.number] = group;
    }
    return groupData;
  }

  /**
   * Render the group buttons.
   * @private
   */
  renderGroupButtons(groupData, panelContext) {
    // Set up rendering context
    push();
    
    for (let i = 0; i < this.groupButtons.length; i++) {
      const button = this.groupButtons[i];
      const group = groupData[button.groupNumber];
      
      // Determine button color
      let buttonColor = this.styling.groupColors.empty;
      
      if (group) {
        if (group.allSelected) {
          buttonColor = this.styling.groupColors.selected;
        } else if (group.someSelected) {
          buttonColor = this.styling.groupColors.partiallySelected;
        } else {
          buttonColor = this.styling.groupColors.filled;
        }
      }

      // Apply hover effect
      if (this.hoveredButton === i) {
        buttonColor = this.styling.groupColors.hover;
      }

      // Render button background
      fill(buttonColor[0], buttonColor[1], buttonColor[2], buttonColor[3]);
      stroke(100);
      strokeWeight(1);
      rect(button.x, button.y, button.width, button.height, 3);

      // Render group number
      fill(255);
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(12);
      text(
        button.groupNumber.toString(), 
        button.x + button.width / 2, 
        button.y + button.height / 2
      );

      // Render ant count if group has ants
      if (group && group.count > 0) {
        fill(200, 255, 200);
        textSize(8);
        text(
          group.count.toString(),
          button.x + button.width - 4,
          button.y + 4
        );
      }
    }
    
    pop();
  }

  /**
   * Render status text below buttons.
   * @private
   */
  renderStatusText(groupDisplay, panelContext) {
    if (typeof fill === 'undefined') return;

    const totalGroups = groupDisplay.length;
    const totalAnts = groupDisplay.reduce((sum, group) => sum + group.count, 0);

    push();
    fill(this.config.style.textColor[0], this.config.style.textColor[1], 
         this.config.style.textColor[2], this.config.style.textColor[3]);
    noStroke();
    textAlign(LEFT, TOP);
    textSize(10);
    
    const statusY = 30 + Math.ceil(9 / this.styling.buttonsPerRow) * 
                    (this.styling.buttonSize + this.styling.buttonSpacing) + 5;
    
    text(`Groups: ${totalGroups}`, 10, statusY);
    text(`Ants: ${totalAnts}`, 10, statusY + 12);
    
    // Show hotkey hint
    fill(150, 150, 150);
    textSize(8);
    text('Ctrl+# assign, # select', 10, statusY + 26);
    
    pop();
  }

  /**
   * Update hover state based on mouse position.
   * @private
   */
  updateHoverState(mouseX, mouseY) {
    if (!this.isVisible()) {
      this.hoveredButton = -1;
      return;
    }

    const panel = this.panelManager.getPanel(this.panelId);
    if (!panel) {
      this.hoveredButton = -1;
      return;
    }

    // Convert mouse coordinates to panel-relative coordinates
    const panelPos = panel.getPosition();
    const relativeX = mouseX - panelPos.x;
    const relativeY = mouseY - panelPos.y;

    // Check if mouse is over any button
    this.hoveredButton = -1;
    for (let i = 0; i < this.groupButtons.length; i++) {
      const button = this.groupButtons[i];
      
      if (relativeX >= button.x && relativeX <= button.x + button.width &&
          relativeY >= button.y && relativeY <= button.y + button.height) {
        this.hoveredButton = i;
        break;
      }
    }
  }

  /**
   * Handle click interactions on group buttons.
   * @private
   */
  handleClick(mouseX, mouseY) {
    if (this.hoveredButton === -1) return false;

    const now = Date.now();
    if (now - this.mouseState.lastClickTime < this.mouseState.clickCooldown) {
      return false; // Prevent rapid clicking
    }

    const button = this.groupButtons[this.hoveredButton];
    if (!button || !button.enabled) return false;

    try {
      // Select the clicked group
      const success = this.groupManager.selectGroup(button.groupNumber);
      
      if (success) {
        console.log(`🖱️ Group ${button.groupNumber} selected via UI click`);
        this.mouseState.lastClickTime = now;
        return true;
      }
    } catch (error) {
      console.error(`Error clicking group ${button.groupNumber}:`, error);
    }

    return false;
  }

  /**
   * Check if panel can handle clicks right now.
   * @private
   */
  canHandleClick() {
    const now = Date.now();
    return now - this.mouseState.lastClickTime >= this.mouseState.clickCooldown;
  }

  /**
   * Check if the panel is currently visible.
   * 
   * @returns {boolean} True if panel is visible
   */
  isVisible() {
    if (!this.initialized) return false;
    
    const panel = this.panelManager.getPanel(this.panelId);
    return panel ? panel.isVisible() : false;
  }

  /**
   * Show the panel.
   * 
   * @returns {boolean} True if panel was shown
   */
  show() {
    if (!this.initialized) return false;
    return this.panelManager.showPanel(this.panelId);
  }

  /**
   * Hide the panel.
   * 
   * @returns {boolean} True if panel was hidden
   */
  hide() {
    if (!this.initialized) return false;
    return this.panelManager.hidePanel(this.panelId);
  }

  /**
   * Toggle panel visibility.
   * 
   * @returns {boolean} New visibility state
   */
  toggle() {
    if (!this.initialized) return false;
    const newState = this.panelManager.togglePanel(this.panelId);
    return newState !== null ? newState : false;
  }

  /**
   * Update panel position.
   * 
   * @param {number} x - New X position
   * @param {number} y - New Y position
   * @returns {boolean} True if position was updated
   */
  setPosition(x, y) {
    if (!this.initialized) return false;
    
    const panel = this.panelManager.getPanel(this.panelId);
    if (panel && typeof panel.setPosition === 'function') {
      panel.setPosition(x, y);
      this.config.position.x = x;
      this.config.position.y = y;
      return true;
    }
    
    return false;
  }

  /**
   * Get current panel position.
   * 
   * @returns {Object|null} Position {x, y} or null if not available
   */
  getPosition() {
    if (!this.initialized) return null;
    
    const panel = this.panelManager.getPanel(this.panelId);
    return panel ? panel.getPosition() : null;
  }

  /**
   * Configure visual styling.
   * 
   * @param {Object} newStyling - Styling configuration to merge
   * @example
   * panel.configureStyling({
   *   buttonSize: 30,
   *   groupColors: { selected: [255, 100, 100, 255] }
   * });
   */
  configureStyling(newStyling) {
    if (typeof newStyling === 'object' && newStyling !== null) {
      // Deep merge styling configuration
      this.styling = this.deepMerge(this.styling, newStyling);
      
      // Recreate buttons with new styling
      if (this.initialized) {
        this.createGroupButtons();
      }
      
      console.log('✅ AntGroupDisplayPanel styling updated');
    }
  }

  /**
   * Deep merge objects.
   * @private
   */
  deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  /**
   * Get diagnostic information for debugging.
   * 
   * @returns {Object} Diagnostic information
   */
  getDiagnosticInfo() {
    const panel = this.panelManager.getPanel(this.panelId);
    
    return {
      initialized: this.initialized,
      panelExists: panel !== null,
      isVisible: this.isVisible(),
      position: this.getPosition(),
      hoveredButton: this.hoveredButton,
      buttonCount: this.groupButtons.length,
      lastClickTime: this.mouseState.lastClickTime,
      panelId: this.panelId
    };
  }

  /**
   * Cleanup and destroy the panel.
   * 
   * @returns {boolean} True if cleanup succeeded
   */
  destroy() {
    if (!this.initialized) return true;
    
    try {
      // Remove panel from manager
      const removed = this.panelManager.removePanel(this.panelId);
      
      if (removed) {
        this.initialized = false;
        this.groupButtons = [];
        this.hoveredButton = -1;
        console.log('✅ AntGroupDisplayPanel destroyed');
        return true;
      } else {
        console.warn('⚠️ Failed to remove panel from manager');
        return false;
      }
    } catch (error) {
      console.error('❌ Error destroying AntGroupDisplayPanel:', error);
      return false;
    }
  }
}

// Export for browser environments
if (typeof window !== 'undefined') {
  window.AntGroupDisplayPanel = AntGroupDisplayPanel;
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AntGroupDisplayPanel;
}
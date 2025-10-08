/**
 * @fileoverview PlayerFactionSetup.js
 * Draggable panel system for player faction configuration at game start
 * Allows players to name their faction and choose colors
 * 
 * @author Software Engineering Team Delta
 * @version 2.0.0
 */

/**
 * @typedef {Object} PlayerFactionData
 * @property {string} name - Faction name
 * @property {Object} color - Faction color
 * @property {number} color.r - Red component (0-255)
 * @property {number} color.g - Green component (0-255)
 * @property {number} color.b - Blue component (0-255)
 * @property {Object} position - Faction starting position
 * @property {number} position.x - X coordinate
 * @property {number} position.y - Y coordinate
 */

/**
 * @typedef {Object} ColorSliders
 * @property {number} r - Red slider value (0-255)
 * @property {number} g - Green slider value (0-255)
 * @property {number} b - Blue slider value (0-255)
 */

/**
 * PlayerFactionSetup - Interactive draggable panel for faction creation
 * Provides a multi-step wizard interface for players to:
 * 1. Enter faction name
 * 2. Select faction colors
 * 3. Preview their choices
 * 4. Create the faction and start the game
 * 
 * @class PlayerFactionSetup
 * @example
 * // Create and show faction setup
 * const factionSetup = new PlayerFactionSetup();
 * factionSetup.show();
 * 
 * // In your game loop
 * factionSetup.update();
 * factionSetup.render();
 */
class PlayerFactionSetup {
  /**
   * Creates a new PlayerFactionSetup instance
   * Initializes the draggable panel with multi-step faction creation workflow
   * 
   * @constructor
   */
  constructor() {
    this.isComplete = false;
    this.currentStep = 'name'; // 'name', 'color', 'preview', 'complete'
    
    // Player faction data
    this.playerData = {
      name: '',
      color: { r: 100, g: 150, b: 255 }, // Default blue
      position: { x: 400, y: 400 } // Will be set based on spawn point
    };
    
    // UI state
    this.nameInput = '';
    this.colorSliders = {
      r: 100,
      g: 150,
      b: 255
    };
    
    // Create draggable panel
    this.panel = new DraggablePanel({
      id: 'faction-setup-panel',
      title: 'Faction Setup - Choose Your Identity',
      position: { x: 200, y: 150 },
      size: { width: 420, height: 650 },
      style: {
        backgroundColor: [30, 30, 40, 240],
        borderColor: [100, 150, 200, 255],
        titleColor: [255, 255, 255, 255],
        textColor: [200, 200, 200, 255],
        fontSize: 14,
        titleFontSize: 16,
        padding: 15,
        cornerRadius: 10
      },
      behavior: {
        draggable: true,
        persistent: false, // Don't save position - reset each time
        constrainToScreen: true,
        snapToEdges: false
      },
      buttons: {
        layout: 'vertical',
        spacing: 10,
        buttonWidth: 120,
        buttonHeight: 35,
        items: [] // Will be populated based on current step
      }
    });
    
    // Input handling
    this.activeInput = null;
    this.keyBuffer = '';
    this.lastKeyTime = 0;
    
    this.setupStepButtons();
    
    console.log('🏴 PlayerFactionSetup initialized as draggable panel');
  }
  
  // ===== PUBLIC API =====
  
  /**
   * Show the faction setup panel (only during faction setup state)
   * Resets to the first step and generates a random faction name if none exists
   * 
   * @returns {boolean} True if panel was shown successfully, false if not in correct game state
   * @example
   * // Show the faction setup when starting a new game
   * if (factionSetup.show()) {
   *   console.log('Faction setup opened');
   * } else {
   *   console.log('Cannot show faction setup in current game state');
   * }
   */
  show() {
    // Only show if we're in the faction setup state
    if (typeof GameState !== 'undefined' && !GameState.isInFactionSetup()) {
      console.warn('🏴 Cannot show faction setup outside of FACTION_SETUP state. Current state:', GameState.getState());
      return false;
    }
    
    this.currentStep = 'name';
    this.isComplete = false;
    
    // Show the panel
    this.panel.show();
    
    // Set default name suggestion
    if (!this.nameInput) {
      this.nameInput = this.generateRandomFactionName();
    }
    
    // Activate name input automatically
    this.activeInput = 'name';
    
    this.setupStepButtons();
    
    console.log('🏴 Player faction setup panel opened');
    return true;
  }
  
  /**
   * Hide the faction setup panel
   */
  hide() {
    this.panel.hide();
    console.log('🏴 Player faction setup panel hidden');
  }
  
  /**
   * Check if panel is visible
   */
  isVisible() {
    return this.panel.isVisible();
  }
  
  /**
   * Setup buttons for current step
   */
  setupStepButtons() {
    // Clear existing buttons
    this.panel.clearButtons();
    
    switch (this.currentStep) {
      case 'name':
        
        this.panel.addButton({
          caption: 'Generate Random',
          onClick: () => {
            this.nameInput = this.generateRandomFactionName();
            this.setupStepButtons(); // Refresh to show new name
          },
          style: { backgroundColor: '#4CAF50', color: '#FFFFFF' }
        });
        this.panel.addButton({
          caption: 'Next →',
          onClick: () => this.nextStep(),
          style: { backgroundColor: '#2196F3', color: '#FFFFFF' }
        });
        break;
        
      case 'color':
        this.panel.addButton({
          caption: 'Reset Colors',
          onClick: () => {
            this.colorSliders.r = 100;
            this.colorSliders.g = 150;
            this.colorSliders.b = 255;
            this.setupStepButtons();
          },
          style: { backgroundColor: '#FF9800', color: '#FFFFFF' }
        });
        this.panel.addButton({
          caption: '← Back',
          onClick: () => this.previousStep(),
          style: { backgroundColor: '#607D8B', color: '#FFFFFF' }
        });
        this.panel.addButton({
          caption: 'Next →',
          onClick: () => this.nextStep(),
          style: { backgroundColor: '#2196F3', color: '#FFFFFF' }
        });
        break;
        
      case 'preview':
        this.panel.addButton({
          caption: '← Back',
          onClick: () => this.previousStep(),
          style: { backgroundColor: '#607D8B', color: '#FFFFFF' }
        });
        this.panel.addButton({
          caption: 'Create Faction!',
          onClick: () => this.complete(),
          style: { backgroundColor: '#4CAF50', color: '#FFFFFF', fontSize: 16 }
        });
        break;
    }
  }
  
  /**
   * Update the faction setup system
   * Handles fade transitions, game state management, and panel interactions
   * Should be called every frame when the faction setup is active
   * 
   * @example
   * // In your main game loop
   * function draw() {
   *   if (GameState.isInFactionSetup()) {
   *     factionSetup.update();
   *   }
   * }
   */
  update() {
    if (GameState.isFadingTransition()) {
      const fadeComplete = GameState.updateFade(3);
  
      if (fadeComplete) {
        if (GameState.fadeDirection === "out") {
          // Fade-out done → switch state to PLAYING
          GameState.setState("PLAYING", true); // skip callbacks if needed
          GameState.startFadeTransition("in"); // start fade-in
          GameState.stopFadeTransition();
        }
      }
    // renderMenu() call removed; updateMenu is now state-only
  }
    
    // Auto-hide if game state is not FACTION_SETUP
    if (typeof GameState !== 'undefined' && !GameState.isInFactionSetup() && this.isVisible()) {
      this.hide();
      return;
    }
    
    // Only update if we're in faction setup state and visible
    if (typeof GameState !== 'undefined' && !GameState.isInFactionSetup()) {
      return;
    }
    
    if (!this.isVisible()) return;
    
    // Update the draggable panel
    if (typeof mouseX !== 'undefined' && typeof mouseY !== 'undefined' && typeof mouseIsPressed !== 'undefined') {
      this.panel.update(mouseX, mouseY, mouseIsPressed);
    }
    
    // Update color from sliders
    this.playerData.color = {
      r: this.colorSliders.r,
      g: this.colorSliders.g,
      b: this.colorSliders.b
    };
  }
  
  /**
   * Render the faction setup panel
   */
  render() {
    // Only render if we're in faction setup state
    if (typeof GameState !== 'undefined' && !GameState.isInFactionSetup()) {
      return;
    }
    
    if (!this.isVisible()) return;
    
    // Render the draggable panel with custom content
    this.panel.render((contentArea, style) => {
      this.renderStepContent(contentArea, style);
    });
    
    // Render fade overlay (like the menu system does)
    if (typeof GameState !== 'undefined' && GameState.isFadingTransition && GameState.isFadingTransition()) {
      const fadeAlpha = GameState.getFadeAlpha();
      if (fadeAlpha > 0) {
        fill(255, fadeAlpha);
        rect(0, 0, width, height);
      }
    }
  }
  
  /**
   * Render content for current step
   */
  renderStepContent(contentArea, style) {
    switch (this.currentStep) {
      case 'name':
        this.renderNameStepContent(contentArea, style);
        break;
      case 'color':
        this.renderColorStepContent(contentArea, style);
        break;
      case 'preview':
        this.renderPreviewStepContent(contentArea, style);
        break;
    }
  }
  
  /**
   * Handle keyboard input
   * @param {string} key - Key pressed
   * @param {number} keyCode - Key code
   */
  handleKeyInput(key, keyCode) {
    if (!this.isVisible()) return false;
    
    // Handle name input
    if (this.currentStep === 'name' && this.activeInput === 'name') {
      if (keyCode === 8) { // Backspace
        this.nameInput = this.nameInput.slice(0, -1);
      } else if (keyCode === 13) { // Enter
        if (this.nameInput.length > 0) {
          this.nextStep();
        }
      } else if (keyCode === 9) { // Tab - move to next input or action
        // For now, just move to next step if name is valid
        if (this.nameInput.length > 0) {
          this.nextStep();
        }
      } else if (key && key.length === 1 && this.nameInput.length < 30) {
        // Allow letters, numbers, spaces, and some special characters
        if (/[a-zA-Z0-9 \-_'.]/.test(key)) {
          this.nameInput += key;
        }
      }
      return true;
    }
    
    // Handle general navigation keys
    if (keyCode === 27) { // Escape - close faction setup (return to menu)
      if (typeof GameState !== 'undefined') {
        this.hide();
        GameState.goToMenu();
      }
      return true;
    }
    
    return false;
  }
  
  // ===== PRIVATE METHODS =====
  
  /**
   * Render content for name input step
   */
  renderNameStepContent(contentArea, style) {
    if (typeof text === 'undefined' || typeof fill === 'undefined') return;
    
    let currentY = contentArea.y + 15;
    const leftMargin = contentArea.x + 15;
    
    // Main title
    fill(...style.textColor);
    if (typeof textAlign === 'function') textAlign(LEFT, TOP);
    if (typeof textSize === 'function') textSize(style.fontSize + 2);
    text('Enter Your Faction Name:', leftMargin, currentY);
    currentY += 25;
    
    // Subtitle
    fill(180, 180, 200);
    if (typeof textSize === 'function') textSize(style.fontSize - 1);
    text('(This will represent your colony in diplomacy)', leftMargin, currentY);
    currentY += 35;
    
    // Name input box
    const inputWidth = contentArea.width - 30;
    const inputHeight = 45;
    const inputX = leftMargin;
    
    // Input background (highlight if active)
    if (this.activeInput === 'name') {
      fill(70, 70, 90, 220);
      stroke(150, 200, 255);
      if (typeof strokeWeight === 'function') strokeWeight(2);
    } else {
      fill(50, 50, 60, 200);
      stroke(100, 150, 200);
      if (typeof strokeWeight === 'function') strokeWeight(1);
    }
    
    if (typeof rect === 'function') {
      rect(inputX, currentY, inputWidth, inputHeight, 8);
    }
    
    // Input text with cursor
    if (typeof textAlign === 'function') textAlign(LEFT, CENTER);
    if (typeof textSize === 'function') textSize(style.fontSize + 1);
    
    const displayText = this.nameInput || 'Click here to type...';
    const textColor = this.nameInput ? [255, 255, 255] : [150, 150, 150];
    fill(...textColor);
    
    // Show cursor if active
    const cursor = (this.activeInput === 'name' && Math.floor(Date.now() / 500) % 2) ? '|' : '';
    text(displayText + cursor, inputX + 15, currentY + inputHeight / 2);
    
    currentY += inputHeight + 25;
    
    // Current name preview section
    if (this.nameInput) {
      // Preview box background
      fill(40, 40, 50, 180);
      stroke(80, 120, 160);
      if (typeof strokeWeight === 'function') strokeWeight(1);
      if (typeof rect === 'function') {
        rect(leftMargin, currentY, inputWidth, 35, 5);
      }
      
      // Preview text
      fill(200, 255, 200);
      if (typeof textAlign === 'function') textAlign(LEFT, CENTER);
      if (typeof textSize === 'function') textSize(style.fontSize);
      text(`Preview: "${this.nameInput}"`, leftMargin + 10, currentY + 17);
      
      currentY += 45;
    }
    
    // Instructions section
    fill(160, 160, 180);
    if (typeof textAlign === 'function') textAlign(LEFT, TOP);
    if (typeof textSize === 'function') textSize(style.fontSize - 2);
    
    text('Quick Help:', leftMargin, currentY);
    currentY += 18;
    
    fill(140, 140, 160);
    text('• Type to enter your faction name', leftMargin + 5, currentY);
    currentY += 15;
    text('• Press Enter to continue to next step', leftMargin + 5, currentY);
    currentY += 15;
    text('• Use "Generate Random" button for ideas', leftMargin + 5, currentY);
    
    // Handle text input activation
    this.handleTextInputClick(inputX, currentY - 110, inputWidth, inputHeight, 'name');
  }
  
  /**
   * Render content for color selection step
   */
  renderColorStepContent(contentArea, style) {
    if (typeof text === 'undefined' || typeof fill === 'undefined') return;
    
    let currentY = contentArea.y + 15;
    const centerX = contentArea.x + contentArea.width / 2;
    const leftMargin = contentArea.x + 15;
    
    // Main title
    fill(...style.textColor);
    if (typeof textAlign === 'function') textAlign(LEFT, TOP);
    if (typeof textSize === 'function') textSize(style.fontSize + 2);
    text('Choose Your Faction Colors:', leftMargin, currentY);
    currentY += 25;
    
    // Subtitle
    fill(180, 180, 200);
    if (typeof textSize === 'function') textSize(style.fontSize - 1);
    text('(These will be used for your ants and buildings)', leftMargin, currentY);
    currentY += 40;
    
    // Color preview section
    fill(40, 40, 50, 180);
    stroke(100, 150, 200);
    if (typeof strokeWeight === 'function') strokeWeight(1);
    if (typeof rect === 'function') {
      rect(leftMargin, currentY, contentArea.width - 30, 80, 8);
    }
    
    // Color preview circle
    const previewSize = 55;
    fill(this.colorSliders.r, this.colorSliders.g, this.colorSliders.b);
    stroke(255, 255, 255);
    if (typeof strokeWeight === 'function') strokeWeight(2);
    if (typeof ellipse === 'function') {
      ellipse(centerX, currentY + 40, previewSize);
    }
    
    // RGB values display
    fill(200, 200, 220);
    if (typeof textAlign === 'function') textAlign(CENTER, TOP);
    if (typeof textSize === 'function') textSize(style.fontSize - 1);
    text(`RGB(${Math.round(this.colorSliders.r)}, ${Math.round(this.colorSliders.g)}, ${Math.round(this.colorSliders.b)})`, 
         centerX, currentY + 65);
    
    currentY += 100;
    
    // Color sliders section
    const sliderSpacing = 40;
    const sliderWidth = contentArea.width - 50;
    
    // Render sliders with better spacing
    this.renderColorSlider('Red', leftMargin + 10, currentY, sliderWidth, 
                          this.colorSliders.r, [255, 0, 0]);
    this.renderColorSlider('Green', leftMargin + 10, currentY + sliderSpacing, sliderWidth, 
                          this.colorSliders.g, [0, 255, 0]);
    this.renderColorSlider('Blue', leftMargin + 10, currentY + sliderSpacing * 2, sliderWidth, 
                          this.colorSliders.b, [0, 0, 255]);
  }
  
  /**
   * Render content for preview step
   */
  renderPreviewStepContent(contentArea, style) {
    if (typeof text === 'undefined' || typeof fill === 'undefined') return;
    
    let currentY = contentArea.y + 20;
    const centerX = contentArea.x + contentArea.width / 2;
    const leftMargin = contentArea.x + 20;
    
    // Main title
    fill(...style.textColor);
    if (typeof textAlign === 'function') textAlign(CENTER, TOP);
    if (typeof textSize === 'function') textSize(style.fontSize + 3);
    text('Faction Preview', centerX, currentY);
    currentY += 40;
    
    // Faction info container background
    fill(40, 40, 50, 180);
    stroke(100, 150, 200);
    if (typeof strokeWeight === 'function') strokeWeight(1);
    if (typeof rect === 'function') {
      rect(leftMargin, currentY, contentArea.width - 40, 140, 8);
    }
    
    currentY += 25;
    
    // Faction name
    fill(255, 255, 255);
    if (typeof textAlign === 'function') textAlign(CENTER, TOP);
    if (typeof textSize === 'function') textSize(style.fontSize + 1);
    text(`"${this.playerData.name || this.nameInput}"`, centerX, currentY);
    currentY += 30;
    
    // Color preview circle
    const previewSize = 50;
    fill(this.colorSliders.r, this.colorSliders.g, this.colorSliders.b);
    stroke(255, 255, 255);
    if (typeof strokeWeight === 'function') strokeWeight(2);
    if (typeof ellipse === 'function') {
      ellipse(centerX, currentY + previewSize/2, previewSize);
    }
    currentY += previewSize + 15;
    
    // Color values
    fill(180, 180, 200);
    if (typeof textSize === 'function') textSize(style.fontSize - 1);
    text(`RGB(${Math.round(this.colorSliders.r)}, ${Math.round(this.colorSliders.g)}, ${Math.round(this.colorSliders.b)})`, 
         centerX, currentY);
    
    currentY += 40;
    
    // Final instructions
    fill(200, 220, 255);
    if (typeof textAlign === 'function') textAlign(CENTER, TOP);
    if (typeof textSize === 'function') textSize(style.fontSize);
    text('Ready to create your faction?', centerX, currentY);
    currentY += 20;
    
    fill(160, 180, 200);
    if (typeof textSize === 'function') textSize(style.fontSize - 1);
    text('Click "Create Faction!" to begin your ant empire!', centerX, currentY);
  }
  
  /**
   * Render a simplified color slider for the draggable panel
   */
  renderColorSlider(label, x, y, width, value, color) {
    if (typeof text === 'undefined' || typeof fill === 'undefined' || typeof rect === 'undefined') return;
    
    // Label with value
    fill(220, 220, 240);
    if (typeof textAlign === 'function') textAlign(LEFT, CENTER);
    if (typeof textSize === 'function') textSize(13);
    text(`${label}:`, x, y);
    
    // Value display
    fill(180, 180, 200);
    if (typeof textAlign === 'function') textAlign(RIGHT, CENTER);
    text(`${Math.round(value)}`, x + 80, y);
    
    // Slider track
    const sliderX = x + 90;
    const sliderY = y - 6;
    const sliderWidth = width - 90;
    const sliderHeight = 12;
    
    // Track background
    fill(50, 50, 60);
    stroke(100, 100, 120);
    if (typeof strokeWeight === 'function') strokeWeight(1);
    rect(sliderX, sliderY, sliderWidth, sliderHeight, 6);
    
    // Slider value bar
    fill(...color, 180);
    if (typeof noStroke === 'function') noStroke();
    const valueWidth = (value / 255) * sliderWidth;
    rect(sliderX, sliderY, valueWidth, sliderHeight, 6);
    
    // Slider handle
    fill(255, 255, 255);
    stroke(120, 120, 140);
    if (typeof strokeWeight === 'function') strokeWeight(1);
    const handleX = sliderX + valueWidth;
    if (typeof ellipse === 'function') {
      ellipse(handleX, y, 18);
    }
    
    // Handle slider interaction (simplified)
    if (typeof mouseIsPressed !== 'undefined' && mouseIsPressed && 
        typeof mouseX !== 'undefined' && typeof mouseY !== 'undefined' &&
        mouseX >= sliderX && mouseX <= sliderX + sliderWidth && 
        mouseY >= sliderY - 15 && mouseY <= sliderY + sliderHeight + 15) {
      const newValue = ((mouseX - sliderX) / sliderWidth) * 255;
      const clampedValue = Math.max(0, Math.min(255, newValue));
      
      if (label === 'Red') this.colorSliders.r = clampedValue;
      else if (label === 'Green') this.colorSliders.g = clampedValue;
      else if (label === 'Blue') this.colorSliders.b = clampedValue;
    }
  }
  
  // ===== STEP NAVIGATION =====
  
  /**
   * Move to next setup step
   */
  nextStep() {
    switch (this.currentStep) {
      case 'name':
        if (this.nameInput.length > 0) {
          this.playerData.name = this.nameInput;
          this.currentStep = 'color';
          this.activeInput = null;
        }
        break;
      case 'color':
        this.currentStep = 'preview';
        break;
      case 'preview':
        this.completeFactionSetup();
        return; // Don't setup buttons if completing
    }
    this.setupStepButtons();
  }
  
  /**
   * Move to previous setup step
   */
  previousStep() {
    switch (this.currentStep) {
      case 'color':
        this.currentStep = 'name';
        break;
      case 'preview':
        this.currentStep = 'color';
        break;
    }
    this.setupStepButtons();
  }
  
  /**
   * Complete the faction setup (called by button)
   */
  complete() {
    this.completeFactionSetup();
  }
  
  /**
   * Complete faction setup and create player faction
   */
  completeFactionSetup() {
    // Create the player faction in the faction manager
    const factionManager = getFactionManager();
    if (factionManager) {
      const playerFactionId = factionManager.createFaction(
        this.playerData.name || this.nameInput,
        this.playerData.color,
        'player',
        this.playerData.position
      );
      
      console.log(`🏴 Player faction created: ${this.playerData.name} (${playerFactionId})`);
    }
    
    this.isComplete = true;
    
    // Start fade-to-white transition like the menu does
    if (typeof GameState !== 'undefined' && GameState.startFadeTransition) {
      console.log('🏴 Starting faction setup fade transition...');
      GameState.startFadeTransition("out");
    }
  }
  
  /**
   * Generate a random faction name
   * @returns {string} Random faction name
   */
  generateRandomFactionName() {
    const prefixes = ['Red', 'Blue', 'Iron', 'Golden', 'Shadow', 'Storm', 'Fire', 'Ice', 'Stone', 'Swift'];
    const suffixes = ['Colony', 'Empire', 'Legion', 'Hive', 'Clan', 'Tribe', 'Order', 'Alliance', 'Kingdom', 'Republic'];
    
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    
    return `${prefix} ${suffix}`;
  }
  
  /**
   * Get the configured player faction data
   * @returns {Object} Player faction configuration
   */
  getPlayerFactionData() {
    return {
      name: this.playerData.name || this.nameInput || 'Player Faction',
      color: { ...this.playerData.color },
      position: { ...this.playerData.position },
      type: 'player'
    };
  }
  
  /**
   * Handle text input click detection
   */
  handleTextInputClick(x, y, width, height, inputName) {
    if (typeof mouseIsPressed !== 'undefined' && mouseIsPressed && 
        typeof mouseX !== 'undefined' && typeof mouseY !== 'undefined' &&
        mouseX >= x && mouseX <= x + width &&
        mouseY >= y && mouseY <= y + height) {
      this.activeInput = inputName;
    } else if (typeof mouseIsPressed !== 'undefined' && mouseIsPressed) {
      // Click outside input - deactivate if clicking elsewhere in panel
      const panelBounds = {
        x: this.panel.getPosition().x,
        y: this.panel.getPosition().y,
        width: this.panel.config.size.width,
        height: this.panel.config.size.height
      };
      
      if (mouseX >= panelBounds.x && mouseX <= panelBounds.x + panelBounds.width &&
          mouseY >= panelBounds.y && mouseY <= panelBounds.y + panelBounds.height) {
        // Only deactivate if clicking inside panel but outside input
        if (!(mouseX >= x && mouseX <= x + width && mouseY >= y && mouseY <= y + height)) {
          this.activeInput = null;
        }
      }
    }
  }
  
  /**
   * Check if setup is complete
   * @returns {boolean} True if player has completed faction setup
   */
  isSetupComplete() {
    return this.isComplete;
  }
}

// Global instance
let g_playerFactionSetup = null;

/**
 * Initialize player faction setup system
 */
function initializePlayerFactionSetup() {
  g_playerFactionSetup = new PlayerFactionSetup();
  console.log('🏴 Player faction setup system initialized');
  return g_playerFactionSetup;
}

/**
 * Get the global player faction setup instance
 */
function getPlayerFactionSetup() {
  return g_playerFactionSetup;
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PlayerFactionSetup, initializePlayerFactionSetup, getPlayerFactionSetup };
}

// Make available globally for browser
if (typeof window !== 'undefined') {
  window.PlayerFactionSetup = PlayerFactionSetup;
  window.initializePlayerFactionSetup = initializePlayerFactionSetup;
  window.getPlayerFactionSetup = getPlayerFactionSetup;
}
/**
 * @fileoverview ButtonGroup class for the Universal Button Group System
 * Handles individual button groups with layout, interaction, and persistence
 * 
 * @author Software Engineering Team Delta - David Willman
 * @version 1.0.0
 */

/**
 * Individual Button Group - Handles layout, interaction, and persistence
 * Part of the Universal Button Group System
 */
class ButtonGroup {
  /**
   * Creates a new ButtonGroup instance
   * 
   * @param {Object} config - Button group configuration from JSON
   * @param {Object} actionFactory - Factory for executing button actions
   */
  constructor(config, actionFactory) {
    if (globalThis.globalDebugVerbosity >= 3) console.log(`🏗️ ButtonGroup constructor starting for ${config?.id || 'unknown'}`);
    
    try {
      // Validate required parameters
      if (!config || typeof config !== 'object') {
        throw new Error('ButtonGroup requires a valid configuration object');
      }
      if (globalThis.globalDebugVerbosity >= 4) console.log(`✅ ButtonGroup config validation passed for ${config.id}`);
      
      if (!actionFactory || typeof actionFactory.executeAction !== 'function') {
        throw new Error('ButtonGroup requires a valid actionFactory with executeAction method');
      }
      if (globalThis.globalDebugVerbosity >= 4) console.log(`✅ ButtonGroup actionFactory validation passed for ${config.id}`);

      this.config = config;
      this.actionFactory = actionFactory;
      this.buttons = [];
      this.isDragging = false;
      this.isResizing = false;
      this.dragOffset = { x: 0, y: 0 };
      if (globalThis.globalDebugVerbosity >= 4) console.log(`✅ ButtonGroup basic properties set for ${config.id}`);
      
      // Runtime state (will be persisted)
      this.state = {
        position: { x: 0, y: 0 },
        scale: config.appearance?.scale || 1.0,
        transparency: config.appearance?.transparency || 1.0,
        visible: config.appearance?.visible !== false
      };
      if (globalThis.globalDebugVerbosity >= 4) console.log(`✅ ButtonGroup state initialized for ${config.id}`);

      // Initialize the button group
      if (globalThis.globalDebugVerbosity >= 4) console.log(`🚀 ButtonGroup about to call initialize() for ${config.id}`);
      this.initialize();
      if (globalThis.globalDebugVerbosity >= 4) console.log(`✅ ButtonGroup initialize() completed for ${config.id}`);
    } catch (error) {
      console.error(`❌ ButtonGroup constructor failed for ${config?.id || 'unknown'}:`, error);
      throw error;
    }
  }

  /**
   * Initialize the button group
   * Loads persisted state and creates buttons
   */
  initialize() {
    if (globalThis.globalDebugVerbosity >= 4) console.log('[DEBUG] ButtonGroup.initialize() called for:', this.config.id);
    this.loadPersistedState();
    if (globalThis.globalDebugVerbosity >= 4) console.log('[DEBUG] ButtonGroup.initialize() - after loadPersistedState');
    this.createButtons();
    if (globalThis.globalDebugVerbosity >= 4) console.log('[DEBUG] ButtonGroup.initialize() - after createButtons, buttons count:', this.buttons.length);
    this.calculatePosition();
    if (globalThis.globalDebugVerbosity >= 4) console.log('[DEBUG] ButtonGroup.initialize() - completed');
  }

  /**
   * Load persisted state from localStorage if enabled
   */
  loadPersistedState() {
    // Check if persistence is enabled and has storage key
    if (!this.config.persistence?.savePosition || !this.config.persistence?.storageKey) {
      return;
    }
    
    try {
      const saved = localStorage.getItem(this.config.persistence.storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        // Only apply saved data that exists and is valid
        if (data && typeof data === 'object') {
          if (data.position && typeof data.position === 'object') {
            // Validate and restore position properties individually
            if (typeof data.position.x === 'number') {
              this.state.position.x = data.position.x;
            }
            if (typeof data.position.y === 'number') {
              this.state.position.y = data.position.y;
            }
          }
          if (typeof data.scale === 'number' && data.scale > 0) {
            this.state.scale = data.scale;
          }
          if (typeof data.transparency === 'number' && data.transparency >= 0 && data.transparency <= 1) {
            this.state.transparency = data.transparency;
          }
          if (typeof data.visible === 'boolean') {
            this.state.visible = data.visible;
          }
        }
      }
    } catch (e) {
      if (globalThis.globalDebugVerbosity >= 0)  console.warn(`Failed to load persisted state for group ${this.config.id}:`, e.message);
    }
  }

  /**
   * Save current state to localStorage if enabled
   */
  saveState() {
    // Check if persistence is enabled and has storage key
    if (!this.config.persistence?.savePosition || !this.config.persistence?.storageKey) {
      return;
    }
    
    try {
      const dataToSave = {
        position: { ...this.state.position },
        scale: this.state.scale,
        transparency: this.state.transparency,
        visible: this.state.visible,
        lastModified: new Date().toISOString()
      };
      
      localStorage.setItem(
        this.config.persistence.storageKey, 
        JSON.stringify(dataToSave)
      );
    } catch (e) {
      console.warn(`Failed to save state for group ${this.config.id}:`, e.message);
    }
  }

  /**
   * Create button instances from configuration
   */
  createButtons() {
    if (globalThis.globalDebugVerbosity >= 4) console.log(`🚀 Starting createButtons for group ${this.config.id}`);
    this.buttons = [];
    
    // Validate that buttons configuration exists and is an array
    if (!this.config.buttons || !Array.isArray(this.config.buttons)) {
      if (globalThis.globalDebugVerbosity >= 2) console.warn(`ButtonGroup ${this.config.id} has no buttons configuration`, this.config);
      return;
    }
    
    if (globalThis.globalDebugVerbosity >= 4)   console.log(`🔧 Creating buttons for group ${this.config.id}:`, {
      configButtons: this.config.buttons.length,
      buttonStylesAvailable: typeof ButtonStyles !== 'undefined',
      dynamicStyleExists: typeof ButtonStyles !== 'undefined' && ButtonStyles.DYNAMIC !== undefined
    });
    
    for (const btnConfig of this.config.buttons) {
      if (!this.shouldShowButton(btnConfig)) {
        if (globalThis.globalDebugVerbosity >= 2) console.log(`⏭️ Skipping button ${btnConfig.id} - conditions not met`);
        continue;
      }
      
      try {
        // Create button with scaled dimensions
        const scaledWidth = (btnConfig.size?.width || 60) * this.state.scale;
        const scaledHeight = (btnConfig.size?.height || 45) * this.state.scale;

        if (globalThis.globalDebugVerbosity >= 4) console.log(`🔨 Creating button ${btnConfig.id}:`, {
          text: btnConfig.text,
          size: { width: scaledWidth, height: scaledHeight },
          buttonClassAvailable: typeof Button !== 'undefined'
        });
        
        const btn = new Button(
          0, 0, // Position will be calculated in layout
          scaledWidth,
          scaledHeight,
          btnConfig.text || '',
          {
            ...ButtonStyles.DYNAMIC,
            onClick: (b) => this.handleButtonClick(btnConfig, b)
          }
        );
        
        // Store configuration reference for later use
        btn.config = btnConfig;
        btn.tooltip = btnConfig.tooltip;
        btn.hotkey = btnConfig.hotkey;
        
        this.buttons.push(btn);
        if (globalThis.globalDebugVerbosity >= 2) console.log(`✅ Button ${btnConfig.id} created successfully`);
      } catch (error) {
        console.error(`❌ Failed to create button ${btnConfig.id || 'unnamed'} in group ${this.config.id}:`, error.message, error);
      }
    }

    if (globalThis.globalDebugVerbosity >= 2) console.log(`🎯 ButtonGroup ${this.config.id} created ${this.buttons.length} buttons`);
  }

  /**
   * Check if a button should be shown based on its conditions
   * 
   * @param {Object} btnConfig - Button configuration
   * @returns {boolean} True if button should be shown
   */
  shouldShowButton(btnConfig) {
    // Always show buttons without conditions
    if (!btnConfig.conditions || typeof btnConfig.conditions !== 'object') {
      if (globalThis.globalDebugVerbosity >= 1) console.log(`✅ Button ${btnConfig.id} has no conditions - showing`);
      return true;
    }
    
    if (globalThis.globalDebugVerbosity >= 2) console.log(`🔍 Checking conditions for button ${btnConfig.id}:`, btnConfig.conditions);
    
    // Check game state condition
    if (btnConfig.conditions.gameState) {
      const currentGameState = this.getCurrentGameState();
      if (globalThis.globalDebugVerbosity >= 3) console.log(`🎮 Game state check: current='${currentGameState}', required='${btnConfig.conditions.gameState}'`);
      if (currentGameState !== btnConfig.conditions.gameState) {
        if (globalThis.globalDebugVerbosity >= 1) console.log(`❌ Button ${btnConfig.id} hidden - game state mismatch`);
        return false;
      }
    }
    
    // Check minimum resources condition
    if (btnConfig.conditions.minimumResources) {
      const hasResources = this.checkMinimumResources(btnConfig.conditions.minimumResources);
      if (globalThis.globalDebugVerbosity >= 1) console.log(`💰 Resource check for ${btnConfig.id}: ${hasResources}`);
      if (!hasResources) {
        if (globalThis.globalDebugVerbosity >= 1) console.log(`❌ Button ${btnConfig.id} hidden - insufficient resources`);
        return false;
      }
    }
    
    // Check selection requirement
    if (btnConfig.conditions.hasSelection) {
      const hasSelection = this.checkHasSelection();
      if (globalThis.globalDebugVerbosity >= 1) console.log(`🎯 Selection check for ${btnConfig.id}: ${hasSelection}`);
      if (!hasSelection) {
        if (globalThis.globalDebugVerbosity >= 1) console.log(`❌ Button ${btnConfig.id} hidden - no selection`);
        return false;
      }
    }

    if (globalThis.globalDebugVerbosity >= 1) console.log(`✅ Button ${btnConfig.id} passed all condition checks`);
    return true;
  }

  /**
   * Get current game state for condition checking
   * 
   * @returns {string} Current game state
   */
  getCurrentGameState() {
    // Try multiple sources for game state
    const state = window.currentGameState || 
                  window.gameState || 
                  (window.state && window.state.current) || 
                  'unknown';

    if (globalThis.globalDebugVerbosity >= 1) console.log(`🎮 getCurrentGameState() result: '${state}' (sources: currentGameState=${window.currentGameState}, gameState=${window.gameState}, state.current=${window.state?.current})`);
    return state;
  }

  /**
   * Check if minimum resources are available
   * 
   * @param {Object} minimumResources - Resource requirements
   * @returns {boolean} True if resources are available
   */
  checkMinimumResources(minimumResources) {
    // For now, return true (resource checking would be implemented based on actual resource system)
    // This is a hook for future resource system integration
    return true;
  }

  /**
   * Check if there is a current selection
   * 
   * @returns {boolean} True if something is selected
   */
  checkHasSelection() {
    // Try multiple sources for selection state
    return Boolean(
      window.selectionController?.hasSelection() ||
      window.selectedObjects?.length > 0 ||
      window.selection?.length > 0
    );
  }

  /**
   * Handle button click event
   * 
   * @param {Object} btnConfig - Button configuration
   * @param {Button} button - Button instance that was clicked
   */
  handleButtonClick(btnConfig, button) {
    try {
      if (globalThis.globalDebugVerbosity >= 1) console.log(`🎯 Button Group Action: ${btnConfig.id} in group ${this.config.id}`);
      if (!btnConfig || !btnConfig.id) {
        throw new Error('Button configuration missing id');
      }
      // Execute the action using the action factory
      const success = this.actionFactory.executeAction(btnConfig, this.getGameContext());
      
      if (!success) {
        if (globalThis.globalDebugVerbosity >= 1) console.warn(`Action execution failed for button ${btnConfig.id}`);
      }
    } catch (error) {
      if (globalThis.globalDebugVerbosity >= 1) console.error(`Error handling button click for ${btnConfig.id}:`, error.message);
    }
  }

  /**
   * Get current game context for action execution
   * 
   * @returns {Object} Game context object
   */
  getGameContext() {
    return {
      groupId: this.config.id,
      gameState: this.getCurrentGameState(),
      selection: window.selectionController,
      resources: window.resourceController,
      timestamp: Date.now()
    };
  }

  /**
   * Get the unique identifier for this button group
   * 
   * @returns {string} Group ID
   */
  getId() {
    return this.config.id;
  }

  /**
   * Get the display name for this button group
   * 
   * @returns {string} Group name
   */
  getName() {
    return this.config.name || this.config.id;
  }

  /**
   * Get the current visibility state
   * 
   * @returns {boolean} True if group is visible
   */
  isVisible() {
    return this.state.visible;
  }

  /**
   * Set the visibility state
   * 
   * @param {boolean} visible - New visibility state
   */
  setVisible(visible) {
    this.state.visible = Boolean(visible);
    this.saveState();
  }

  /**
   * Get the current transparency value
   * 
   * @returns {number} Transparency value (0-1)
   */
  getTransparency() {
    return this.state.transparency;
  }

  /**
   * Set the transparency value
   * 
   * @param {number} alpha - Transparency value (0-1)
   */
  setTransparency(alpha) {
    const clampedAlpha = Math.max(0, Math.min(1, alpha));
    this.state.transparency = clampedAlpha;
    
    if (this.config.persistence?.saveTransparency) {
      this.saveState();
    }
  }

  /**
   * Get the current scale value
   * 
   * @returns {number} Scale value
   */
  getScale() {
    return this.state.scale;
  }

  /**
   * Set the scale value and recreate buttons
   * 
   * @param {number} scale - New scale value
   */
  setScale(scale) {
    const clampedScale = Math.max(0.1, Math.min(3.0, scale));
    this.state.scale = clampedScale;
    
    // Recreate buttons with new scale
    this.createButtons();
    this.calculatePosition();
    
    if (this.config.persistence?.saveScale) {
      this.saveState();
    }
  }

  /**
   * Get current position
   * 
   * @returns {Object} Position object with x, y properties
   */
  getPosition() {
    return { ...this.state.position };
  }

  /**
   * Set position
   * 
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  setPosition(x, y) {
    this.state.position.x = x;
    this.state.position.y = y;
    this.calculatePosition();
    this.saveState();
  }

  /**
   * Calculate and apply positioning to buttons based on layout configuration
   */
  calculatePosition() {
    if (globalThis.globalDebugVerbosity >= 3) console.log(`🧮 [${this.config.id}] Starting calculatePosition()`);

    const pos = this.config.layout?.position || { x: 'center', y: 'center' };
    const padding = this.config.layout?.padding || { top: 0, right: 0, bottom: 0, left: 0 };

    if (globalThis.globalDebugVerbosity >= 3) console.log(`📐 [${this.config.id}] Position config:`, {
      x: pos.x,
      y: pos.y,
      offsetX: pos.offsetX,
      offsetY: pos.offsetY,
      padding: padding
    });
    
    // Use mock canvas dimensions for testing, real dimensions for runtime
    const canvas = { 
      width: (window.innerWidth) || 1200, 
      height: (window.innerHeight) || 800 
    };

    if (globalThis.globalDebugVerbosity >= 3) console.log(`🖼️ [${this.config.id}] Canvas dimensions:`, canvas);
    
    // First, layout buttons at origin to calculate bounds
    this.layoutButtons(0, 0);
    const bounds = this.getBounds();
    if (globalThis.globalDebugVerbosity >= 3) console.log(`📦 [${this.config.id}] Calculated bounds:`, bounds);
    
    // Calculate base position based on bounds
    let x = 0, y = 0;
    
    switch (pos.x) {
      case 'left': 
        x = padding.left || 0; 
        break;
      case 'center': 
        x = (canvas.width - bounds.width) / 2; 
        break;
      case 'right': 
        // For right positioning, start from right edge and subtract group width
        x = canvas.width - bounds.width - (padding.right || 0);
        break;
      case 'mouse': 
        x = (typeof window !== 'undefined' && typeof window.mouseX === 'number') ? window.mouseX : 0; 
        break;
      default: 
        x = parseFloat(pos.x) || 0;
    }

    if (globalThis.globalDebugVerbosity >= 3) console.log(`➡️ [${this.config.id}] Base X calculation: anchor='${pos.x}' canvas.width=${canvas.width} bounds.width=${bounds.width} -> x=${x}`);

    switch (pos.y) {
      case 'top': 
        y = padding.top || 0; 
        break;
      case 'center': 
        y = (canvas.height - bounds.height) / 2; 
        break;
      case 'bottom': 
        // For bottom positioning, start from bottom edge and subtract group height  
        y = canvas.height - bounds.height - (padding.bottom || 0);
        break;
      case 'mouse': 
        y = (typeof window !== 'undefined' && typeof window.mouseY === 'number') ? window.mouseY : 0; 
        break;
      default: 
        y = parseFloat(pos.y) || 0;
    }

    if (globalThis.globalDebugVerbosity >= 3) console.log(`⬇️ [${this.config.id}] Base Y calculation: anchor='${pos.y}' canvas.height=${canvas.height} bounds.height=${bounds.height} -> y=${y}`);

    // Apply offsets
    const preOffsetX = x;
    const preOffsetY = y;
    x += pos.offsetX || 0;
    y += pos.offsetY || 0;

    if (globalThis.globalDebugVerbosity >= 3) console.log(`🎯 [${this.config.id}] After offsets: (${preOffsetX} + ${pos.offsetX || 0}, ${preOffsetY} + ${pos.offsetY || 0}) = (${x}, ${y})`);

    // Set the group's position state
    this.state.position.x = x;
    this.state.position.y = y;

    if (globalThis.globalDebugVerbosity >= 3) console.log(`✅ [${this.config.id}] Final position set: (${x}, ${y})`);
    
    // Update button positions using layout system with final position
    this.layoutButtons(x, y);
  }

  /**
   * Layout buttons according to the specified layout type
   * 
   * @param {number} startX - Starting X position
   * @param {number} startY - Starting Y position
   */
  layoutButtons(startX, startY) {
    if (this.buttons.length === 0) return;
    
    const layout = this.config.layout || {};
    const spacing = layout.spacing || 10;
    const padding = layout.padding || { top: 0, right: 0, bottom: 0, left: 0 };
    
    let x = startX + (padding.left || 0);
    let y = startY + (padding.top || 0);
    
    switch (layout.type) {
      case 'horizontal':
        this.buttons.forEach((btn) => {
          btn.setPosition(x, y);
          x += btn.width + spacing;
        });
        break;
        
      case 'vertical':
        this.buttons.forEach((btn) => {
          btn.setPosition(x, y);
          y += btn.height + spacing;
        });
        break;
        
      case 'grid':
        const cols = layout.columns || 2;
        // Calculate column width based on first button for consistency
        const firstButtonWidth = this.buttons.length > 0 ? this.buttons[0].width : 0;
        const firstButtonHeight = this.buttons.length > 0 ? this.buttons[0].height : 0;
        
        this.buttons.forEach((btn, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          btn.setPosition(
            x + col * (firstButtonWidth + spacing),
            y + row * (firstButtonHeight + spacing)
          );
        });
        break;
        
      default:
        // Default to horizontal layout
        this.buttons.forEach((btn) => {
          btn.setPosition(x, y);
          x += btn.width + spacing;
        });
        break;
    }
  }

  /**
   * Update method for handling mouse interaction and dragging
   * Should be called every frame during the update loop
   * 
   * @param {number} mouseX - Current mouse X position
   * @param {number} mouseY - Current mouse Y position  
   * @param {boolean} mousePressed - Whether mouse button is currently pressed
   */
  update(mouseX, mouseY, mousePressed) {
    if (!this.state.visible) return;
    
    // Handle dragging behavior
    if (this.config.behavior?.draggable) {
      this.handleDragging(mouseX, mouseY, mousePressed);
    }
    
    // Update all individual buttons
    this.buttons.forEach(btn => {
      if (btn.update && typeof btn.update === 'function') {
        btn.update(mouseX, mouseY, mousePressed);
      }
    });
  }

  /**
   * Handle dragging behavior for the button group
   * 
   * @param {number} mouseX - Current mouse X position
   * @param {number} mouseY - Current mouse Y position
   * @param {boolean} mousePressed - Whether mouse button is currently pressed
   */
  handleDragging(mouseX, mouseY, mousePressed) {
    const bounds = this.getBounds();
    
    // Start dragging if mouse is pressed and within bounds
    if (mousePressed && !this.isDragging && this.isPointInBounds(mouseX, mouseY, bounds)) {
      this.isDragging = true;
      this.dragOffset = {
        x: mouseX - this.state.position.x,
        y: mouseY - this.state.position.y
      };
    }
    
    // Handle dragging movement
    if (this.isDragging) {
      if (mousePressed) {
        // Update position based on mouse movement and drag offset
        const newX = mouseX - this.dragOffset.x;
        const newY = mouseY - this.dragOffset.y;
        
        // Apply constraints if configured
        const constrainedPosition = this.applyDragConstraints(newX, newY);
        
        this.state.position.x = constrainedPosition.x;
        this.state.position.y = constrainedPosition.y;
        
        // Update button positions directly (don't recalculate from layout)
        this.layoutButtons(constrainedPosition.x, constrainedPosition.y);
      } else {
        // Mouse released - stop dragging and save state
        this.isDragging = false;
        this.saveState();
      }
    }
  }

  /**
   * Apply constraints to drag position if configured
   * 
   * @param {number} x - Proposed X position
   * @param {number} y - Proposed Y position
   * @returns {Object} Constrained position with x, y properties
   */
  applyDragConstraints(x, y) {
    let constrainedX = x;
    let constrainedY = y;
    
    // Apply snap to edges if enabled
    if (this.config.behavior?.snapToEdges) {
      const canvas = { 
        width: (window.innerWidth) || 1200, 
        height: (window.innerHeight) || 800 
      };
      const snapThreshold = 20; // pixels
      
      // Snap to left edge
      if (Math.abs(constrainedX) < snapThreshold) {
        constrainedX = 0;
      }
      // Snap to right edge
      else if (Math.abs(constrainedX - canvas.width) < snapThreshold) {
        constrainedX = canvas.width;
      }
      
      // Snap to top edge
      if (Math.abs(constrainedY) < snapThreshold) {
        constrainedY = 0;
      }
      // Snap to bottom edge
      else if (Math.abs(constrainedY - canvas.height) < snapThreshold) {
        constrainedY = canvas.height;
      }
    }
    
    return { x: constrainedX, y: constrainedY };
  }

  /**
   * Get bounding rectangle of the button group
   * 
   * @returns {Object} Bounds object with x, y, width, height properties
   */
  getBounds() {
    if (this.buttons.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }
    
    const padding = this.config.layout?.padding || { top: 0, right: 0, bottom: 0, left: 0 };
    
    // Find the minimum and maximum coordinates of all buttons  
    const minX = Math.min(...this.buttons.map(b => b.x));
    const minY = Math.min(...this.buttons.map(b => b.y));
    const maxX = Math.max(...this.buttons.map(b => b.x + b.width));
    const maxY = Math.max(...this.buttons.map(b => b.y + b.height));
    
    // Bounds should start at group position minus padding (test expectation)
    return {
      x: this.state.position.x - (padding.left || 0),
      y: this.state.position.y - (padding.top || 0),
      width: (maxX - minX) + (padding.left || 0) + (padding.right || 0),
      height: (maxY - minY) + (padding.top || 0) + (padding.bottom || 0)
    };
  }

  /**
   * Check if a point is within the bounds of this button group
   * 
   * @param {number} x - X coordinate to test
   * @param {number} y - Y coordinate to test
   * @param {Object} bounds - Bounds object (optional, will calculate if not provided)
   * @returns {boolean} True if point is within bounds
   */
  isPointInBounds(x, y, bounds = null) {
    if (!bounds) {
      bounds = this.getBounds();
    }
    
    return x >= bounds.x && 
           x <= bounds.x + bounds.width &&
           y >= bounds.y && 
           y <= bounds.y + bounds.height;
  }

  /**
   * Get the current dragging state
   * 
   * @returns {boolean} True if currently being dragged
   */
  isDragActive() {
    return this.isDragging;
  }

  /**
   * Force stop dragging (useful for programmatic control)
   */
  stopDragging() {
    if (this.isDragging) {
      this.isDragging = false;
      this.saveState();
    }
  }

  /**
   * Render method for drawing the button group
   * Should be called every frame during the render loop
   */
  render() {
    if (!this.state.visible) return;
    
    // Debug logging for button rendering issues
    if (this.config.id === 'game-controls' && this.debugRenderCount !== true) {
      if (globalThis.globalDebugVerbosity >= 3) console.log(`🎨 ButtonGroup ${this.config.id} rendering:`, {
        buttonsCount: this.buttons.length,
        visible: this.state.visible,
        transparency: this.state.transparency,
        position: this.state.position,
        pushAvailable: typeof push === 'function'
      });
      if (this.buttons.length > 0) {
        if (globalThis.globalDebugVerbosity >= 3) console.log(`🔘 First button:`, this.buttons[0].getDebugInfo ? this.buttons[0].getDebugInfo() : this.buttons[0]);
      }
      this.debugRenderCount = true; // Only log once
    }
    
    push();
    
    // Apply transparency
    tint(255, this.state.transparency * 255);
    
    // Render background if configured
    this.renderBackground();
    
    // Render all buttons
    this.buttons.forEach((btn, index) => { btn.render(); });
    
    // Render drag handles if draggable and being dragged
    if (this.config.behavior?.draggable && this.isDragging) { this.renderDragIndicator(); }
    pop();
  }
  

  /**
   * Render background for the button group
   */
  renderBackground() {
    if (!this.config.appearance?.background) return;
    
    const bg = this.config.appearance.background;
    const bounds = this.getBounds();
    
    if (typeof fill === 'function' && typeof rect === 'function') {
      if (bg.color && Array.isArray(bg.color)) {
        fill(...bg.color);
      } else {
        fill(60, 60, 60, 200); // Default background
      }
      
      if (typeof noStroke === 'function') {
        noStroke();
      }
      
      rect(bounds.x, bounds.y, bounds.width, bounds.height, bg.cornerRadius || 0);
    }
  }

  /**
   * Render visual indicator when group is being dragged
   */
  renderDragIndicator() {
    const bounds = this.getBounds();
    
    if (typeof stroke === 'function' && typeof noFill === 'function' && typeof rect === 'function') {
      stroke(255, 255, 0, 180); // Yellow drag indicator
      noFill();
      strokeWeight(2);
      rect(bounds.x - 2, bounds.y - 2, bounds.width + 4, bounds.height + 4);
    }
  }
}

// Export for browser environments
if (typeof window !== 'undefined') {
  window.ButtonGroup = ButtonGroup;
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ButtonGroup;
}
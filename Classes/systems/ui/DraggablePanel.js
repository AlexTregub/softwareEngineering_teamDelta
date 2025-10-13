/**
 * @fileoverview DraggablePanel - Reusable draggable UI panel system
 * Adapted from Universal Button System's drag functionality for UI panels
 * 
 * @author Software Engineering Team Delta - David Willman
 * @version 1.0.0
 */

/**
 * DraggablePanel - Makes any UI panel draggable with position persistence
 * Reuses the excellent drag logic from the Universal Button System
 */
class DraggablePanel {
  /**
   * Creates a new DraggablePanel instance
   * 
   * @param {Object} config - Panel configuration
   */
  constructor(config) {
    this.config = {
      id: config.id || 'draggable-panel',
      title: config.title || 'Panel',
      position: config.position || { x: 50, y: 50 },
      size: config.size || { width: 200, height: 150 },
      style: {
        backgroundColor: config.style?.backgroundColor || [0, 0, 0, 150],
        titleColor: config.style?.titleColor || [255, 255, 255],
        textColor: config.style?.textColor || [200, 200, 200],
        borderColor: config.style?.borderColor || [100, 100, 100],
        titleBarHeight: config.style?.titleBarHeight || 25,
        padding: config.style?.padding || 10,
        cornerRadius: config.style?.cornerRadius || 5,
        fontSize: config.style?.fontSize || 12,
        titleFontSize: config.style?.titleFontSize || 14,
        ...config.style
      },
      behavior: {
        draggable: config.behavior?.draggable !== false,
        persistent: config.behavior?.persistent !== false,
        snapToEdges: config.behavior?.snapToEdges || false,
        constrainToScreen: config.behavior?.constrainToScreen !== false,
        ...config.behavior
      },
      content: config.content || {},
      buttons: {
        items: config.buttons?.items || [],
        layout: config.buttons?.layout || 'vertical', // 'vertical', 'horizontal', 'grid'
        spacing: config.buttons?.spacing || 5,
        buttonHeight: config.buttons?.buttonHeight || 30,
        buttonWidth: config.buttons?.buttonWidth || 120,
        columns: config.buttons?.columns || 2, // for grid layout
        ...config.buttons
      }
    };

    // Drag state (copied from ButtonGroup.js)
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    
    // Position state with persistence (MUST be initialized before buttons)
    this.state = {
      position: { ...this.config.position },
      visible: config.visible !== false,
      minimized: config.minimized || false
    };
    
  // Load persisted position if enabled BEFORE creating buttons so
  // buttons are constructed at the correct, persisted location and
  // don't briefly render at the default config position.
  this.loadPersistedState();

  // Button management (initialized AFTER state is final)
  this.buttons = [];
  this.initializeButtons();

  // Immediately ensure button instances use the (possibly) loaded
  // persisted position. This prevents a single-frame artifact where
  // buttons appear at the initial config position and then jump to
  // the persisted position on the first update cycle.
  this.updateButtonPositions();

        // Log creation success (only for debug mode)
    if (devConsoleEnabled) {
      console.log(`🪟 DraggablePanel '${this.config.id}' created at (${this.state.position.x}, ${this.state.position.y})`);
    }
  }

  /**
   * Initialize buttons from configuration
   */
  initializeButtons() {
    this.buttons = [];
    
    this.config.buttons.items.forEach((buttonConfig, index) => {
      const position = this.calculateButtonPosition(index);
      
      const button = new Button(
        position.x,
        position.y,
        buttonConfig.width || this.config.buttons.buttonWidth,
        buttonConfig.height || this.config.buttons.buttonHeight,
        buttonConfig.caption || `Button ${index + 1}`,
        {
          ...ButtonStyles.DEFAULT,
          ...buttonConfig.style,
          onClick: buttonConfig.onClick,
          image: buttonConfig.image
        }
      );
      
      this.buttons.push(button);
    });
    
    // Auto-resize panel to fit content
    this.autoResizeToFitContent();
  }

  /**
   * Calculate button position based on layout
   */
  calculateButtonPosition(index) {
    const scale = 1.0;
    const titleBarHeight = this.calculateTitleBarHeight();
    const baseX = this.state.position.x + (this.config.style.padding * scale);
    const baseY = this.state.position.y + titleBarHeight + (this.config.style.padding * scale);
    const spacing = this.config.buttons.spacing * scale;
    const buttonWidth = this.config.buttons.buttonWidth * scale;
    
    // Use actual button height if available, otherwise use config default
    const buttonHeight = this.buttons[index] ? this.buttons[index].height : (this.config.buttons.buttonHeight * scale);
    
    switch (this.config.buttons.layout) {
      case 'horizontal':
        return {
          x: baseX + (index * (buttonWidth + spacing)),
          y: baseY
        };
        
      case 'grid':
        const cols = this.config.buttons.columns;
        const row = Math.floor(index / cols);
        const col = index % cols;
        
        // Calculate cumulative height for previous rows
        let yOffset = 0;
        for (let r = 0; r < row; r++) {
          let maxHeightInRow = 0;
          for (let c = 0; c < cols; c++) {
            const btnIndex = r * cols + c;
            if (btnIndex < this.buttons.length) {
              maxHeightInRow = Math.max(maxHeightInRow, this.buttons[btnIndex].height);
            }
          }
          yOffset += maxHeightInRow + spacing;
        }
        
        return {
          x: baseX + (col * (buttonWidth + spacing)),
          y: baseY + yOffset
        };
        
      case 'vertical':
      default:
        // Calculate cumulative height for previous buttons
        let cumulativeHeight = 0;
        for (let i = 0; i < index; i++) {
          if (this.buttons[i]) {
            cumulativeHeight += this.buttons[i].height + spacing;
          } else {
            cumulativeHeight += buttonHeight + spacing;
          }
        }
        
        return {
          x: baseX,
          y: baseY + cumulativeHeight
        };
    }
  }

  /**
   * Load persisted state from localStorage
   */
  loadPersistedState() {
    if (!this.config.behavior.persistent) return;

    try {
      const saved = localStorage.getItem(`draggable-panel-${this.config.id}`);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.position) {
          this.state.position = { ...data.position };
        }
        if (typeof data.visible === 'boolean') {
          this.state.visible = data.visible;
        }
        if (typeof data.minimized === 'boolean') {
          this.state.minimized = data.minimized;
        }

      }
    } catch (e) {
      console.warn(`Failed to load persisted state for panel ${this.config.id}:`, e.message);
    }
  }

  /**
   * Save current state to localStorage
   */
  saveState() {
    if (!this.config.behavior.persistent) return;

    try {
      const dataToSave = {
        position: { ...this.state.position },
        visible: this.state.visible,
        minimized: this.state.minimized,
        lastModified: new Date().toISOString()
      };
      
      localStorage.setItem(`draggable-panel-${this.config.id}`, JSON.stringify(dataToSave));
    } catch (e) {
      console.warn(`Failed to save state for panel ${this.config.id}:`, e.message);
    }
  }

  /**
   * Update method for handling mouse interaction and dragging
   * Based on ButtonGroup.js drag handling
   * 
   * @param {number} mouseX - Current mouse X position
   * @param {number} mouseY - Current mouse Y position  
   * @param {boolean} mousePressed - Whether mouse button is currently pressed
   */
  update(mouseX, mouseY, mousePressed) {
    if (!this.state.visible) return;
    
    // Check if content needs resizing (this happens once per frame maximum)
    if (!this._lastResizeCheck || Date.now() - this._lastResizeCheck > 100) {
      this.autoResizeToFitContent();
      this._lastResizeCheck = Date.now();
    }
    
    // Update button positions when panel moves
    this.updateButtonPositions();
    
    // Update button interactions (only if not dragging panel)
    if (!this.isDragging) {
      this.buttons.forEach(button => {
        button.update(mouseX, mouseY, mousePressed);
      });
    }
    
    // Handle panel dragging
    if (this.config.behavior.draggable) {
      this.handleDragging(mouseX, mouseY, mousePressed);
    }
  }

  /**
   * Handle dragging behavior (adapted from ButtonGroup.js)
   * 
   * @param {number} mouseX - Current mouse X position
   * @param {number} mouseY - Current mouse Y position
   * @param {boolean} mousePressed - Whether mouse button is currently pressed
   */
  handleDragging(mouseX, mouseY, mousePressed) {
    const titleBarBounds = this.getTitleBarBounds();
    
    // Start dragging if mouse is pressed and within title bar
    if (mousePressed && !this.isDragging && this.isPointInBounds(mouseX, mouseY, titleBarBounds)) {
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
      } else {
        // Mouse released - stop dragging and save state
        this.isDragging = false;
        this.saveState();

      }
    }
  }

  /**
   * Apply constraints to drag position (adapted from ButtonGroup.js)
   * 
   * @param {number} x - Proposed X position
   * @param {number} y - Proposed Y position
   * @returns {Object} Constrained position with x, y properties
   */
  applyDragConstraints(x, y) {
    let constrainedX = x;
    let constrainedY = y;
    
    // Constrain to screen bounds if enabled
    if (this.config.behavior.constrainToScreen) {
      const canvas = { 
        width: (window.innerWidth) || 1200, 
        height: (window.innerHeight) || 800 
      };
      
      constrainedX = Math.max(0, Math.min(constrainedX, canvas.width - this.config.size.width));
      constrainedY = Math.max(0, Math.min(constrainedY, canvas.height - this.config.size.height));
    }
    
    // Apply snap to edges if enabled
    if (this.config.behavior.snapToEdges) {
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
      else if (Math.abs(constrainedX - (canvas.width - this.config.size.width)) < snapThreshold) {
        constrainedX = canvas.width - this.config.size.width;
      }
      
      // Snap to top edge
      if (Math.abs(constrainedY) < snapThreshold) {
        constrainedY = 0;
      }
      // Snap to bottom edge
      else if (Math.abs(constrainedY - (canvas.height - this.config.size.height)) < snapThreshold) {
        constrainedY = canvas.height - this.config.size.height;
      }
    }
    
    return { x: constrainedX, y: constrainedY };
  }

  /**
   * Update button positions when panel moves
   */
  updateButtonPositions() {
    this.buttons.forEach((button, index) => {
      const position = this.calculateButtonPosition(index);
      button.setPosition(position.x, position.y);
    });
  }

  /**
   * Get title bar bounds for drag detection
   * 
   * @returns {Object} Bounds object with x, y, width, height properties
   */
  getTitleBarBounds() {
    const scale = 1.0;
    const titleBarHeight = this.calculateTitleBarHeight();
    
    return {
      x: this.state.position.x,
      y: this.state.position.y,
      width: this.config.size.width * scale,
      height: titleBarHeight
    };
  }

  /**
   * Check if a point is within the specified bounds
   * 
   * @param {number} x - X coordinate to test
   * @param {number} y - Y coordinate to test
   * @param {Object} bounds - Bounds object
   * @returns {boolean} True if point is within bounds
   */
  isPointInBounds(x, y, bounds) {
    return x >= bounds.x && 
           x <= bounds.x + bounds.width &&
           y >= bounds.y && 
           y <= bounds.y + bounds.height;
  }

  /**
   * Render the panel
   * 
   * @param {Function} contentRenderer - Function to render panel content
   */
  render(contentRenderer) {
    if (!this.state.visible) return;

    if (typeof push === 'function') {
      push();
      
      // Draw panel background
      this.renderBackground();
      
      // Draw title bar
      this.renderTitleBar();
      
      // Draw content area
      if (!this.state.minimized) {
        if (contentRenderer) {
          this.renderContent(contentRenderer);
        }
        
        // Draw buttons
        this.renderButtons();
      }
      
      // Draw drag indicator if being dragged
      if (this.isDragging) {
        this.renderDragIndicator();
      }
      
      if (typeof pop === 'function') {
        pop();
      }
    }
  }

  /**
   * Render panel background
   */
  renderBackground() {
    if (typeof fill === 'function' && typeof rect === 'function') {
      // Main panel background
      fill(...this.config.style.backgroundColor);
      if (typeof stroke === 'function') {
        stroke(...this.config.style.borderColor);
        strokeWeight(1 * 1.0);
      }
      
      const scale = 1.0;
      const titleBarHeight = this.calculateTitleBarHeight();
      const height = this.state.minimized ? titleBarHeight : (this.config.size.height * scale);
      
      rect(
        this.state.position.x, 
        this.state.position.y, 
        this.config.size.width * scale, 
        height, 
        this.config.style.cornerRadius * scale
      );
    }
  }

  /**
   * Render title bar
   */
  renderTitleBar() {
    if (typeof fill === 'function' && typeof text === 'function') {
      const scale = 1.0;
      const titleBarHeight = this.calculateTitleBarHeight();
      
      // Title bar background (slightly different color)
      const titleBg = this.config.style.backgroundColor.slice();
      titleBg[3] = Math.min(255, titleBg[3] + 50); // Slightly lighter
      fill(...titleBg);
      
      if (typeof rect === 'function') {
        rect(
          this.state.position.x, 
          this.state.position.y, 
          this.config.size.width * scale, 
          titleBarHeight,
          this.config.style.cornerRadius * scale, this.config.style.cornerRadius * scale, 0, 0
        );
      }
      
      // Title text with word wrapping
      fill(...this.config.style.titleColor);
      if (typeof textAlign === 'function') textAlign(LEFT, TOP);
      if (typeof textSize === 'function') textSize(this.config.style.titleFontSize * scale);
      
      // Enable text wrapping if available in p5.js
      if (typeof textWrap === 'function') {
        textWrap(WORD);
      }
      
      const titleText = this.wrapText(
        this.config.title, 
        (this.config.size.width * scale) - (this.config.style.padding * scale * 3), // Leave room for minimize button
        this.config.style.titleFontSize * scale
      );
      
      text(
        titleText,
        this.state.position.x + (this.config.style.padding * scale),
        this.state.position.y + (this.config.style.padding * scale / 2)
      );
      
      // Minimize/maximize button (simple indicator)
      const buttonX = this.state.position.x + (this.config.size.width * scale) - (20 * scale);
      const buttonY = this.state.position.y + titleBarHeight / 2;
      
      fill(150, 150, 150);
      if (typeof textAlign === 'function') textAlign(CENTER, CENTER);
      if (typeof textSize === 'function') textSize(12 * scale);
      text(this.state.minimized ? '+' : '−', buttonX, buttonY);
    }
  }

  /**
   * Render content area
   * 
   * @param {Function} contentRenderer - Function to render panel content
   */
  renderContent(contentRenderer) {
    const contentArea = {
      x: this.state.position.x + this.config.style.padding,
      y: this.state.position.y + this.config.style.titleBarHeight + this.config.style.padding,
      width: this.config.size.width - (this.config.style.padding * 2),
      height: this.config.size.height - this.config.style.titleBarHeight - (this.config.style.padding * 2)
    };

    // Set up content rendering context
    if (typeof fill === 'function') {
      fill(...this.config.style.textColor);
    }
    if (typeof textAlign === 'function') textAlign(LEFT, TOP);
    if (typeof textSize === 'function') textSize(this.config.style.fontSize);

    // Call the content renderer with the content area
    contentRenderer(contentArea, this.config.style);
  }

  /**
   * Render buttons in the panel
   */
  renderButtons() {
    this.buttons.forEach(button => {
      button.render();
    });
  }

  /**
   * Render visual indicator when panel is being dragged
   */
  renderDragIndicator() {
    if (typeof stroke === 'function' && typeof noFill === 'function' && typeof rect === 'function') {
      stroke(255, 255, 0, 180); // Yellow drag indicator
      noFill();
      strokeWeight(2);
      
      const height = this.state.minimized ? this.config.style.titleBarHeight : this.config.size.height;
      rect(
        this.state.position.x - 2, 
        this.state.position.y - 2, 
        this.config.size.width + 4, 
        height + 4
      );
    }
  }

  /**
   * Toggle panel visibility
   */
  toggleVisibility() {
    this.state.visible = !this.state.visible;
    this.saveState();

  }

  /**
   * Toggle panel minimized state
   */
  toggleMinimized() {
    this.state.minimized = !this.state.minimized;
    this.saveState();

  }

  /**
   * Show the panel.
   *
   * Sets the panel to visible, cancels any active drag state and persists the
   * change. This is a no-op if the panel is already visible.
   *
   * @returns {void}
   */
  show() {
    if (this.state.visible) return;
    this.state.visible = true;
    // If the panel was hidden while being dragged, ensure drag is cleared.
    this.isDragging = false;
    this.saveState();
  }

  /**
   * Hide the panel.
   *
   * Sets the panel to hidden, cancels any active drag state and persists the
   * change. This is a no-op if the panel is already hidden.
   *
   * @returns {void}
   */
  hide() {
    if (!this.state.visible) return;
    this.state.visible = false;
    // Ensure dragging stops when the panel is hidden.
    this.isDragging = false;
    this.saveState();
  }

  /**
   * Set panel position
   * 
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  setPosition(x, y) {
    this.state.position.x = x;
    this.state.position.y = y;
    this.saveState();
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
   * Check if panel is visible
   * 
   * @returns {boolean} True if visible
   */
  isVisible() {
    return this.state.visible;
  }

  /**
   * Add a button to the panel
   * 
   * @param {Object} buttonConfig - Button configuration
   */
  addButton(buttonConfig) {
    this.config.buttons.items.push(buttonConfig);
    this.initializeButtons();
  }

  /**
   * Update button text and trigger layout recalculation
   * 
   * @param {number} buttonIndex - Index of button to update
   * @param {string} newText - New text for the button
   */
  updateButtonText(buttonIndex, newText) {
    if (buttonIndex >= 0 && buttonIndex < this.buttons.length) {
      this.buttons[buttonIndex].setCaption(newText);
      this.config.buttons.items[buttonIndex].caption = newText;
      
      // Trigger auto-resize
      this.autoResizeToFitContent();
    }
  }

  /**
   * Remove a button by index
   * 
   * @param {number} index - Index of button to remove
   */
  removeButton(index) {
    if (index >= 0 && index < this.config.buttons.items.length) {
      this.config.buttons.items.splice(index, 1);
      this.initializeButtons();
    }
  }

  /**
   * Clear all buttons
   */
  clearButtons() {
    this.config.buttons.items = [];
    this.buttons = [];
  }

  /**
   * Get button by index
   * 
   * @param {number} index - Button index
   * @returns {Button|null} Button instance or null
   */
  getButton(index) {
    return this.buttons[index] || null;
  }

  /**
   * Get all buttons
   * 
   * @returns {Array} Array of button instances
   */
  getButtons() {
    return [...this.buttons];
  }

  /**
   * Check if panel is currently being dragged
   * 
   * @returns {boolean} True if being dragged
   */
  isDragActive() {
    return this.isDragging;
  }



  /**
   * Wrap text to fit within specified width
   * 
   * @param {string} text - Text to wrap
   * @param {number} maxWidth - Maximum width in pixels
   * @param {number} fontSize - Font size for measurement
   * @returns {string} Wrapped text with line breaks
   */
  wrapText(text, maxWidth, fontSize) {
    if (typeof textWidth !== 'function') {
      return text; // Fallback if textWidth is not available
    }
    
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    // Set text size for measurement
    if (typeof textSize === 'function') {
      textSize(fontSize);
    }
    
    for (let word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const testWidth = textWidth(testLine);
      
      if (testWidth > maxWidth && currentLine !== '') {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines.join('\n');
  }

  /**
   * Calculate the required height for the title bar with wrapped text
   * 
   * @returns {number} Required title bar height
   */
  calculateTitleBarHeight() {
    const scale = 1.0;
    const maxWidth = (this.config.size.width * scale) - (this.config.style.padding * scale * 3);
    const fontSize = this.config.style.titleFontSize * scale;
    
    if (typeof textWidth !== 'function') {
      return this.config.style.titleBarHeight * scale;
    }
    
    // Set font for measurement
    if (typeof textSize === 'function') {
      textSize(fontSize);
    }
    
    const wrappedText = this.wrapText(this.config.title, maxWidth, fontSize);
    const lines = wrappedText.split('\n').length;
    const lineHeight = fontSize * 1.2;
    const titleHeight = lines * lineHeight;
    
    // Ensure minimum height and add padding
    const minHeight = this.config.style.titleBarHeight * scale;
    return Math.max(minHeight, titleHeight + (this.config.style.padding * scale));
  }

  /**
   * Auto-resize buttons to fit their text content
   */
  autoResizeButtons() {
    let layoutChanged = false;
    
    this.buttons.forEach((button, index) => {
      if (typeof button.autoResizeForText === 'function') {
        const changed = button.autoResizeForText(10 * 1.0);
        if (changed) {
          layoutChanged = true;
        }
      }
    });
    
    if (layoutChanged) {
      this.updateButtonPositions();
    }
  }

  /**
   * Calculate the total content height needed for all buttons
   * 
   * @returns {number} Required content height
   */
  calculateContentHeight() {
    if (this.buttons.length === 0) {
      return this.config.size.height;
    }
    
    const scale = 1.0;
    const spacing = this.config.buttons.spacing * scale;
    const padding = this.config.style.padding * scale;
    
    let totalHeight = padding * 2; // Top and bottom padding
    
    if (this.config.buttons.layout === 'vertical') {
      // Sum all button heights plus spacing
      for (let i = 0; i < this.buttons.length; i++) {
        totalHeight += this.buttons[i].height;
        if (i < this.buttons.length - 1) {
          totalHeight += spacing;
        }
      }
    } else if (this.config.buttons.layout === 'grid') {
      // Calculate grid rows and use maximum button height per row
      const cols = this.config.buttons.columns || 2;
      const rows = Math.ceil(this.buttons.length / cols);
      
      for (let row = 0; row < rows; row++) {
        let maxHeightInRow = 0;
        for (let col = 0; col < cols; col++) {
          const buttonIndex = row * cols + col;
          if (buttonIndex < this.buttons.length) {
            maxHeightInRow = Math.max(maxHeightInRow, this.buttons[buttonIndex].height);
          }
        }
        totalHeight += maxHeightInRow;
        if (row < rows - 1) {
          totalHeight += spacing;
        }
      }
    } else { // horizontal
      // Use the maximum button height
      const maxButtonHeight = Math.max(...this.buttons.map(b => b.height));
      totalHeight += maxButtonHeight;
    }
    
    return totalHeight;
  }

  /**
   * Auto-resize the entire panel to fit its content
   */
  autoResizeToFitContent() {
    // First, auto-resize buttons
    this.autoResizeButtons();
    
    // Calculate new dimensions
    const scale = 1.0;
    const titleBarHeight = this.calculateTitleBarHeight();
    const contentHeight = this.calculateContentHeight();
    const newPanelHeight = titleBarHeight + contentHeight;
    
    // Update panel size if significantly different
    const currentScaledHeight = this.config.size.height * scale;
    const heightDifference = Math.abs(newPanelHeight - currentScaledHeight);
    
    if (heightDifference > 5) { // Only resize if difference is notable
      this.config.size.height = newPanelHeight / scale; // Store unscaled size
      this.config.style.titleBarHeight = titleBarHeight / scale; // Store unscaled title height
      
      // Update button positions after resize
      this.updateButtonPositions();
      
      // Save the new size
      this.saveState();
    }
  }
}

// Export for browser environments
if (typeof window !== 'undefined') {
  window.DraggablePanel = DraggablePanel;
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DraggablePanel;
}
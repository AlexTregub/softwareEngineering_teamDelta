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
      content: config.content || {}
    };

    // Drag state (copied from ButtonGroup.js)
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    
    // Position state with persistence
    this.state = {
      position: { ...this.config.position },
      visible: config.visible !== false,
      minimized: config.minimized || false
    };

    // Load persisted position if enabled
    this.loadPersistedState();

        // Log creation success (only for debug mode)
    if (typeof devConsoleEnabled !== 'undefined' && devConsoleEnabled) {
      console.log(`🪟 DraggablePanel '${this.config.id}' created at (${this.state.position.x}, ${this.state.position.y})`);
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
    if (!this.state.visible || !this.config.behavior.draggable) return;
    
    this.handleDragging(mouseX, mouseY, mousePressed);
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
        width: (typeof window !== 'undefined' && window.innerWidth) || 1200, 
        height: (typeof window !== 'undefined' && window.innerHeight) || 800 
      };
      
      constrainedX = Math.max(0, Math.min(constrainedX, canvas.width - this.config.size.width));
      constrainedY = Math.max(0, Math.min(constrainedY, canvas.height - this.config.size.height));
    }
    
    // Apply snap to edges if enabled
    if (this.config.behavior.snapToEdges) {
      const canvas = { 
        width: (typeof window !== 'undefined' && window.innerWidth) || 1200, 
        height: (typeof window !== 'undefined' && window.innerHeight) || 800 
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
   * Get title bar bounds for drag detection
   * 
   * @returns {Object} Bounds object with x, y, width, height properties
   */
  getTitleBarBounds() {
    return {
      x: this.state.position.x,
      y: this.state.position.y,
      width: this.config.size.width,
      height: this.config.style.titleBarHeight
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
      if (!this.state.minimized && contentRenderer) {
        this.renderContent(contentRenderer);
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
        strokeWeight(1);
      }
      
      const height = this.state.minimized ? this.config.style.titleBarHeight : this.config.size.height;
      rect(
        this.state.position.x, 
        this.state.position.y, 
        this.config.size.width, 
        height, 
        this.config.style.cornerRadius
      );
    }
  }

  /**
   * Render title bar
   */
  renderTitleBar() {
    if (typeof fill === 'function' && typeof text === 'function') {
      // Title bar background (slightly different color)
      const titleBg = this.config.style.backgroundColor.slice();
      titleBg[3] = Math.min(255, titleBg[3] + 50); // Slightly lighter
      fill(...titleBg);
      
      if (typeof rect === 'function') {
        rect(
          this.state.position.x, 
          this.state.position.y, 
          this.config.size.width, 
          this.config.style.titleBarHeight,
          this.config.style.cornerRadius, this.config.style.cornerRadius, 0, 0
        );
      }
      
      // Title text
      fill(...this.config.style.titleColor);
      if (typeof textAlign === 'function') textAlign(LEFT, CENTER);
      if (typeof textSize === 'function') textSize(this.config.style.titleFontSize);
      
      text(
        this.config.title,
        this.state.position.x + this.config.style.padding,
        this.state.position.y + this.config.style.titleBarHeight / 2
      );
      
      // Minimize/maximize button (simple indicator)
      const buttonX = this.state.position.x + this.config.size.width - 20;
      const buttonY = this.state.position.y + this.config.style.titleBarHeight / 2;
      
      fill(150, 150, 150);
      if (typeof textAlign === 'function') textAlign(CENTER, CENTER);
      if (typeof textSize === 'function') textSize(12);
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
   * Check if panel is currently being dragged
   * 
   * @returns {boolean} True if being dragged
   */
  isDragActive() {
    return this.isDragging;
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
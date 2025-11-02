/**
 * NewMapDialog - Modal dialog for entering map dimensions
 * 
 * Prompts user to enter width and height (in tiles) when creating a new map.
 * 
 * Features:
 * - Input validation (10-200 tiles)
 * - Keyboard shortcuts (Tab, Enter, Escape)
 * - Default dimensions (50x50)
 * - Error messages for invalid input
 * 
 * @extends Dialog
 */
class NewMapDialog extends Dialog {
  /**
   * Create a new map dialog
   */
  constructor() {
    super({
      width: 400,
      height: 320,
      title: 'New Map'
    });
    
    // Map dimensions (in tiles)
    this._width = 50;  // Default width
    this._height = 50; // Default height
    
    // Input field state
    this._activeField = 'width'; // 'width' or 'height'
    
    // Validation
    this.MIN_DIMENSION = 10;
    this.MAX_DIMENSION = 1000;
    this.PERFORMANCE_WARNING_THRESHOLD = 200;
    this._validationError = '';
    
    // Button bounds for click detection (set in renderContent)
    this._createButtonBounds = { x: 0, y: 0, width: 0, height: 0 };
    this._cancelButtonBounds = { x: 0, y: 0, width: 0, height: 0 };
    this._widthInputBounds = { x: 0, y: 0, width: 0, height: 0 };
    this._heightInputBounds = { x: 0, y: 0, width: 0, height: 0 };
  }
  
  /**
   * Get current map dimensions
   * @returns {{width: number, height: number}} Current dimensions
   */
  getDimensions() {
    return {
      width: this._width,
      height: this._height
    };
  }
  
  /**
   * Set active input field
   * @param {string} field - 'width' or 'height'
   */
  setActiveField(field) {
    if (field === 'width' || field === 'height') {
      this._activeField = field;
      this.markDirty();
    }
  }
  
  /**
   * Validate current dimensions
   * @returns {{valid: boolean, error?: string, warning?: string}} Validation result
   */
  validateDimensions() {
    // Check if integers
    if (!Number.isInteger(this._width) || !Number.isInteger(this._height)) {
      return {
        valid: false,
        error: 'Dimensions must be integers'
      };
    }
    
    // Check bounds
    if (this._width < this.MIN_DIMENSION || this._width > this.MAX_DIMENSION ||
        this._height < this.MIN_DIMENSION || this._height > this.MAX_DIMENSION) {
      return {
        valid: false,
        error: `Dimensions must be ${this.MIN_DIMENSION}-${this.MAX_DIMENSION} tiles`
      };
    }
    
    // Check for performance warning
    if (this._width > this.PERFORMANCE_WARNING_THRESHOLD || 
        this._height > this.PERFORMANCE_WARNING_THRESHOLD) {
      return {
        valid: true,
        warning: 'Maps this large will run poorly'
      };
    }
    
    return { valid: true };
  }
  
  /**
   * Handle keyboard input
   * @param {string} key - Key pressed
   * @param {number} keyCode - Key code
   * @returns {boolean} True if key was consumed
   */
  handleKeyPress(key, keyCode) {
    // Tab: Switch between fields
    if (key === 'Tab' || keyCode === 9) {
      this._activeField = this._activeField === 'width' ? 'height' : 'width';
      this.markDirty();
      return true;
    }
    
    // Escape: Cancel
    if (key === 'Escape' || keyCode === 27) {
      this.cancel();
      return true;
    }
    
    // Enter: Confirm (if validation passes)
    if (key === 'Enter' || keyCode === 13) {
      const validation = this.validateDimensions();
      if (validation.valid) {
        this.confirm();
      }
      return true;
    }
    
    // Backspace: Remove last digit
    if (key === 'Backspace' || keyCode === 8) {
      if (this._activeField === 'width') {
        this._width = Math.floor(this._width / 10);
        if (this._width === 0) this._width = 0; // Prevent empty
      } else {
        this._height = Math.floor(this._height / 10);
        if (this._height === 0) this._height = 0; // Prevent empty
      }
      this.markDirty();
      return true;
    }
    
    // Numeric keys: Append digit
    if (keyCode >= 48 && keyCode <= 57) { // 0-9
      const digit = keyCode - 48;
      
      if (this._activeField === 'width') {
        const newValue = this._width * 10 + digit;
        if (newValue <= 9999) { // Allow up to 4 digits (max 1000 enforced by validation)
          this._width = newValue;
        }
      } else {
        const newValue = this._height * 10 + digit;
        if (newValue <= 9999) { // Allow up to 4 digits (max 1000 enforced by validation)
          this._height = newValue;
        }
      }
      this.markDirty();
      return true;
    }
    
    // Ignore other keys
    return true;
  }
  
  /**
   * Handle mouse click
   * @param {number} mouseX - Click X coordinate
   * @param {number} mouseY - Click Y coordinate
   * @returns {boolean} True if click was handled
   */
  handleClick(mouseX, mouseY) {
    if (!this.visible) return false;
    
    // Convert to dialog-relative coordinates
    const dialogX = this.x || 0;
    const dialogY = this.y || 0;
    const relX = mouseX - dialogX;
    const relY = mouseY - dialogY;
    
    // Debug logging
    console.log(`[NewMapDialog] Click received:`, {
      mouseX, mouseY,
      dialogX, dialogY,
      relX, relY,
      widthBounds: this._widthInputBounds,
      heightBounds: this._heightInputBounds
    });
    
    // Check width input field
    if (this._isPointInBounds(relX, relY, this._widthInputBounds)) {
      this.setActiveField('width');
      return true;
    }
    
    // Check height input field
    if (this._isPointInBounds(relX, relY, this._heightInputBounds)) {
      this.setActiveField('height');
      return true;
    }
    
    // Check Create button (only if validation passes)
    const validation = this.validateDimensions();
    if (validation.valid && this._isPointInBounds(relX, relY, this._createButtonBounds)) {
      this.confirm();
      return true;
    }
    
    // Check Cancel button
    if (this._isPointInBounds(relX, relY, this._cancelButtonBounds)) {
      this.cancel();
      return true;
    }
    
    // Click within dialog bounds (consume event)
    if (relX >= 0 && relX <= this.width && relY >= 0 && relY <= this.height) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Check if point is within bounds
   * @private
   */
  _isPointInBounds(x, y, bounds) {
    return x >= bounds.x && x <= bounds.x + bounds.width &&
           y >= bounds.y && y <= bounds.y + bounds.height;
  }
  
  /**
   * Confirm and create map
   * Overrides Dialog.confirm() to pass dimensions to callback
   */
  confirm() {
    console.log(`[NewMapDialog] Confirm called with dimensions:`, {
      width: this._width,
      height: this._height,
      hasCallback: !!this.onConfirm
    });
    
    if (this.onConfirm) {
      this.onConfirm(this._width, this._height);
    }
    this.hide();
  }
  
  /**
   * Show dialog and reset to defaults
   * Overrides Dialog.show()
   */
  show() {
    // Reset to defaults
    this._width = 50;
    this._height = 50;
    this._activeField = 'width';
    this._validationError = '';
    
    // Center dialog on screen using global canvas dimensions
    const canvasWidth = (typeof g_canvasX !== 'undefined') ? g_canvasX : 1920;
    const canvasHeight = (typeof g_canvasY !== 'undefined') ? g_canvasY : 1080;
    const centered = this.getCenteredPosition(canvasWidth, canvasHeight);
    this.x = centered.x;
    this.y = centered.y;
    
    // Debug logging
    console.log(`[NewMapDialog] Centering dialog:`, {
      canvasWidth,
      canvasHeight,
      dialogWidth: this.width,
      dialogHeight: this.height,
      x: this.x,
      y: this.y
    });
    
    this.setVisible(true);
    this.markDirty();
  }
  
  /**
   * Hide dialog and clear state
   * Overrides Dialog.hide()
   */
  hide() {
    this.setVisible(false);
    // NOTE: Do NOT clear callbacks here - they're set once in LevelEditor constructor
    // and should persist across multiple dialog uses
    this.markDirty();
  }
  
  /**
   * Override renderToScreen to add modal overlay before dialog
   * Renders semi-transparent background, then dialog content
   */
  renderToScreen() {
    if (!this.visible) return;
    
    // Render modal overlay (semi-transparent background) directly to canvas
    if (typeof push !== 'undefined' && typeof pop !== 'undefined') {
      push();
      fill(0, 0, 0, 180); // Dark overlay with 70% opacity
      noStroke();
      const canvasWidth = (typeof g_canvasX !== 'undefined') ? g_canvasX : 1920;
      const canvasHeight = (typeof g_canvasY !== 'undefined') ? g_canvasY : 1080;
      rect(0, 0, canvasWidth, canvasHeight);
      pop();
    }
    
    // Render dialog using parent's renderToScreen method (draws cached buffer)
    // Ensure imageMode is CORNER for proper positioning
    const buffer = this.getCacheBuffer();
    if (buffer && typeof image !== 'undefined') {
      push();
      if (typeof imageMode !== 'undefined' && typeof CORNER !== 'undefined') {
        imageMode(CORNER); // Ensure top-left corner positioning
      }
      image(buffer, this.x, this.y);
      pop();
    } else {
      super.renderToScreen();
    }
  }
  
  /**
   * Render dialog content
   * @param {p5.Graphics} buffer - Graphics buffer to render to
   */
  renderContent(buffer) {
    if (!buffer) return;
    
    // Validate current dimensions
    const validation = this.validateDimensions();
    this._validationError = validation.valid ? '' : validation.error;
    
    const centerX = this.width / 2;
    let currentY = 60;
    
    // Title/Instructions
    buffer.fill(200);
    buffer.textAlign(buffer.CENTER, buffer.TOP);
    buffer.textSize(14);
    buffer.text('Enter map dimensions (tiles):', centerX, currentY);
    currentY += 30;
    
    // Width input field
    this._renderInputField(buffer, 'Width', this._width, centerX - 80, currentY, 
                          this._activeField === 'width', this._widthInputBounds);
    currentY += 50;
    
    // Height input field
    this._renderInputField(buffer, 'Height', this._height, centerX - 80, currentY,
                          this._activeField === 'height', this._heightInputBounds);
    currentY += 50;
    
    // Validation hint
    buffer.fill(150);
    buffer.textAlign(buffer.CENTER, buffer.TOP);
    buffer.textSize(12);
    buffer.text(`Min: ${this.MIN_DIMENSION} tiles, Max: ${this.MAX_DIMENSION} tiles`, 
                centerX, currentY);
    currentY += 25;
    
    // Error message (if validation fails)
    if (this._validationError) {
      buffer.fill(255, 100, 100); // Red
      buffer.textAlign(buffer.CENTER, buffer.TOP);
      buffer.textSize(12);
      buffer.text(this._validationError, centerX, currentY);
      currentY += 20;
    }
    
    // Warning message (if validation passes but has warning)
    if (validation.valid && validation.warning) {
      buffer.fill(255, 165, 0); // Orange
      buffer.textAlign(buffer.CENTER, buffer.TOP);
      buffer.textSize(12);
      buffer.text(validation.warning, centerX, currentY);
      currentY += 20;
    }
    
    currentY += 5; // Extra spacing before buttons
    
    // Buttons
    const buttonY = this.height - 60;
    const buttonWidth = 100;
    const buttonHeight = 35;
    const buttonSpacing = 20;
    
    // Cancel button (left)
    const cancelX = centerX - buttonWidth - buttonSpacing / 2;
    this._renderButton(buffer, 'Cancel', cancelX, buttonY, buttonWidth, buttonHeight,
                      false, this._cancelButtonBounds);
    
    // Create button (right) - disabled if validation fails
    const createX = centerX + buttonSpacing / 2;
    this._renderButton(buffer, 'Create', createX, buttonY, buttonWidth, buttonHeight,
                      validation.valid, this._createButtonBounds);
  }
  
  /**
   * Render input field
   * @private
   */
  _renderInputField(buffer, label, value, x, y, isActive, bounds) {
    const inputWidth = 160;
    const inputHeight = 35;
    
    // Store bounds for click detection
    bounds.x = x;
    bounds.y = y;
    bounds.width = inputWidth;
    bounds.height = inputHeight;
    
    // Label
    buffer.fill(200);
    buffer.textAlign(buffer.LEFT, buffer.TOP);
    buffer.textSize(14);
    buffer.text(`${label}:`, x, y - 20);
    
    // Input box background
    buffer.fill(30);
    buffer.noStroke();
    buffer.rect(x, y, inputWidth, inputHeight, 3);
    
    // Border (highlight if active)
    if (isActive) {
      buffer.stroke(255, 200, 0); // Yellow
      buffer.strokeWeight(2);
    } else {
      buffer.stroke(80);
      buffer.strokeWeight(1);
    }
    buffer.noFill();
    buffer.rect(x, y, inputWidth, inputHeight, 3);
    
    // Value text
    buffer.fill(255);
    buffer.noStroke();
    buffer.textAlign(buffer.CENTER, buffer.CENTER);
    buffer.textSize(16);
    buffer.text(value.toString(), x + inputWidth / 2, y + inputHeight / 2);
    
    // "tiles" suffix
    buffer.fill(150);
    buffer.textAlign(buffer.LEFT, buffer.CENTER);
    buffer.textSize(12);
    buffer.text('tiles', x + inputWidth + 10, y + inputHeight / 2);
  }
  
  /**
   * Render button
   * @private
   */
  _renderButton(buffer, label, x, y, width, height, enabled, bounds) {
    // Store bounds for click detection
    bounds.x = x;
    bounds.y = y;
    bounds.width = width;
    bounds.height = height;
    
    // Button background
    if (enabled) {
      buffer.fill(100, 150, 255); // Blue
    } else {
      buffer.fill(60); // Gray (disabled)
    }
    buffer.noStroke();
    buffer.rect(x, y, width, height, 5);
    
    // Button border
    buffer.stroke(enabled ? 150 : 80);
    buffer.strokeWeight(1);
    buffer.noFill();
    buffer.rect(x, y, width, height, 5);
    
    // Button text
    buffer.fill(enabled ? 255 : 120);
    buffer.noStroke();
    buffer.textAlign(buffer.CENTER, buffer.CENTER);
    buffer.textSize(14);
    buffer.text(label, x + width / 2, y + height / 2);
  }
}

// Export for Node.js tests and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NewMapDialog;
}

// Make available globally in browser
if (typeof window !== 'undefined') {
  window.NewMapDialog = NewMapDialog;
}

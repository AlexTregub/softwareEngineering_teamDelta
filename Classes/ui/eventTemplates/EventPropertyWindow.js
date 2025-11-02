/**
 * EventPropertyWindow - Draggable property editor for event triggers
 * 
 * Opens when user clicks a flag on terrain
 * Allows editing trigger properties, saving changes, or deleting trigger
 * 
 * @class EventPropertyWindow
 */

class EventPropertyWindow {
  /**
   * Create property editor window
   * @param {number} x - Screen X position
   * @param {number} y - Screen Y position
   * @param {number} width - Window width
   * @param {number} height - Window height
   * @param {Object} trigger - Trigger object being edited
   * @param {Object} eventManager - EventManager instance
   */
  constructor(x, y, width, height, trigger, eventManager) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.trigger = trigger; // Original trigger reference
    this.eventManager = eventManager;
    
    // Create editable copy of trigger (don't modify original until save)
    this.editForm = JSON.parse(JSON.stringify(trigger));
    
    // State flags
    this.isVisible = true;
    this.isMinimized = false;
    this.isDragging = false;
    
    // UI configuration
    this.title = 'Event Property Editor';
    this.titleBarHeight = 30;
    this.padding = 15;
    this.lineHeight = 25;
    this.inputHeight = 30;
    this.buttonHeight = 35;
    this.buttonSpacing = 10;
    
    // Colors
    this.bgColor = { r: 45, g: 45, b: 50, a: 240 };
    this.borderColor = { r: 100, g: 100, b: 110, a: 255 };
    this.titleBarColor = { r: 35, g: 35, b: 40, a: 255 };
    this.textColor = { r: 220, g: 220, b: 220, a: 255 };
    this.inputBgColor = { r: 30, g: 30, b: 35, a: 255 };
    this.buttonColor = { r: 60, g: 130, b: 200, a: 255 };
    this.deleteButtonColor = { r: 200, g: 60, b: 60, a: 255 };
    this.cancelButtonColor = { r: 100, g: 100, b: 100, a: 255 };
    
    // Input field tracking
    this.activeInput = null; // Which input is being edited
    this.inputValue = ''; // Current input value as string
    
    // Button bounds (calculated in render)
    this.saveButtonBounds = null;
    this.cancelButtonBounds = null;
    this.deleteButtonBounds = null;
    
    // Input field bounds (calculated in render)
    this.radiusInputBounds = null;
    this.delayInputBounds = null;
    this.oneTimeCheckboxBounds = null;
  }
  
  /**
   * Render property editor window
   */
  render() {
    if (!this.isVisible || this.isMinimized) {
      return;
    }
    
    push();
    
    // Panel background
    fill(this.bgColor.r, this.bgColor.g, this.bgColor.b, this.bgColor.a);
    stroke(this.borderColor.r, this.borderColor.g, this.borderColor.b, this.borderColor.a);
    strokeWeight(2);
    rect(this.x, this.y, this.width, this.height, 5);
    
    // Title bar
    fill(this.titleBarColor.r, this.titleBarColor.g, this.titleBarColor.b, this.titleBarColor.a);
    noStroke();
    rect(this.x, this.y, this.width, this.titleBarHeight, 5, 5, 0, 0);
    
    // Title text
    fill(this.textColor.r, this.textColor.g, this.textColor.b, this.textColor.a);
    textAlign(LEFT, CENTER);
    textSize(14);
    text(this.title, this.x + this.padding, this.y + this.titleBarHeight / 2);
    
    // Content area
    let contentY = this.y + this.titleBarHeight + this.padding;
    
    // Trigger ID (read-only)
    textAlign(LEFT, TOP);
    textSize(12);
    fill(180, 180, 180);
    text('Trigger ID:', this.x + this.padding, contentY);
    fill(this.textColor.r, this.textColor.g, this.textColor.b);
    text(this.editForm.id || 'N/A', this.x + this.padding + 80, contentY);
    contentY += this.lineHeight;
    
    // Trigger Type (read-only)
    fill(180, 180, 180);
    text('Type:', this.x + this.padding, contentY);
    fill(this.textColor.r, this.textColor.g, this.textColor.b);
    const typeDisplay = this.editForm.type ? this.editForm.type.charAt(0).toUpperCase() + this.editForm.type.slice(1) : 'N/A';
    text(typeDisplay, this.x + this.padding + 80, contentY);
    contentY += this.lineHeight + 10;
    
    // Render type-specific properties
    if (this.editForm.type === 'spatial') {
      contentY = this._renderSpatialProperties(contentY);
    } else if (this.editForm.type === 'time') {
      contentY = this._renderTimeProperties(contentY);
    } else if (this.editForm.type === 'flag') {
      contentY = this._renderFlagProperties(contentY);
    } else if (this.editForm.type === 'viewport') {
      contentY = this._renderViewportProperties(contentY);
    }
    
    // One-Time checkbox (all trigger types)
    contentY += 10;
    contentY = this._renderOneTimeCheckbox(contentY);
    
    // Buttons at bottom
    contentY += 20;
    this._renderButtons(contentY);
    
    pop();
  }
  
  /**
   * Render spatial trigger properties (radius, shape)
   * @private
   */
  _renderSpatialProperties(yPos) {
    fill(180, 180, 180);
    textAlign(LEFT, TOP);
    textSize(12);
    text('Radius:', this.x + this.padding, yPos);
    
    // Radius input field
    const inputX = this.x + this.padding + 80;
    const inputY = yPos - 5;
    const inputW = 80;
    const inputH = this.inputHeight;
    
    // Store bounds for click detection
    this.radiusInputBounds = { x: inputX, y: inputY, width: inputW, height: inputH };
    
    // Input background
    fill(this.inputBgColor.r, this.inputBgColor.g, this.inputBgColor.b);
    stroke(100, 100, 110);
    strokeWeight(1);
    rect(inputX, inputY, inputW, inputH, 3);
    
    // Input value
    fill(this.textColor.r, this.textColor.g, this.textColor.b);
    noStroke();
    textAlign(CENTER, CENTER);
    const radiusValue = this.editForm.condition && this.editForm.condition.radius !== undefined ? 
                        this.editForm.condition.radius.toString() : '100';
    text(radiusValue, inputX + inputW / 2, inputY + inputH / 2);
    
    // Units label
    textAlign(LEFT, TOP);
    text('px', inputX + inputW + 5, yPos);
    
    return yPos + this.inputHeight + 10;
  }
  
  /**
   * Render time trigger properties (delay)
   * @private
   */
  _renderTimeProperties(yPos) {
    fill(180, 180, 180);
    textAlign(LEFT, TOP);
    textSize(12);
    text('Delay:', this.x + this.padding, yPos);
    
    // Delay input field
    const inputX = this.x + this.padding + 80;
    const inputY = yPos - 5;
    const inputW = 100;
    const inputH = this.inputHeight;
    
    // Store bounds for click detection
    this.delayInputBounds = { x: inputX, y: inputY, width: inputW, height: inputH };
    
    // Input background
    fill(this.inputBgColor.r, this.inputBgColor.g, this.inputBgColor.b);
    stroke(100, 100, 110);
    strokeWeight(1);
    rect(inputX, inputY, inputW, inputH, 3);
    
    // Input value
    fill(this.textColor.r, this.textColor.g, this.textColor.b);
    noStroke();
    textAlign(CENTER, CENTER);
    const delayValue = this.editForm.condition && this.editForm.condition.delay !== undefined ? 
                       this.editForm.condition.delay.toString() : '5000';
    text(delayValue, inputX + inputW / 2, inputY + inputH / 2);
    
    // Units label
    textAlign(LEFT, TOP);
    text('ms', inputX + inputW + 5, yPos);
    
    return yPos + this.inputHeight + 10;
  }
  
  /**
   * Render flag trigger properties (required flags)
   * @private
   */
  _renderFlagProperties(yPos) {
    fill(180, 180, 180);
    textAlign(LEFT, TOP);
    textSize(12);
    text('Required Flags:', this.x + this.padding, yPos);
    yPos += this.lineHeight;
    
    fill(this.textColor.r, this.textColor.g, this.textColor.b);
    text('(Flag checkboxes would render here)', this.x + this.padding + 20, yPos);
    
    return yPos + this.lineHeight + 10;
  }
  
  /**
   * Render viewport trigger properties (x, y, width, height)
   * @private
   */
  _renderViewportProperties(yPos) {
    fill(180, 180, 180);
    textAlign(LEFT, TOP);
    textSize(12);
    text('Viewport Area:', this.x + this.padding, yPos);
    yPos += this.lineHeight;
    
    fill(this.textColor.r, this.textColor.g, this.textColor.b);
    text('(X, Y, W, H inputs would render here)', this.x + this.padding + 20, yPos);
    
    return yPos + this.lineHeight + 10;
  }
  
  /**
   * Render One-Time checkbox
   * @private
   */
  _renderOneTimeCheckbox(yPos) {
    const checkboxSize = 18;
    const checkboxX = this.x + this.padding;
    const checkboxY = yPos;
    
    // Store bounds for click detection
    this.oneTimeCheckboxBounds = { 
      x: checkboxX, 
      y: checkboxY, 
      width: checkboxSize, 
      height: checkboxSize 
    };
    
    // Checkbox background
    fill(this.inputBgColor.r, this.inputBgColor.g, this.inputBgColor.b);
    stroke(100, 100, 110);
    strokeWeight(1);
    rect(checkboxX, checkboxY, checkboxSize, checkboxSize, 3);
    
    // Checkmark if oneTime is true
    if (this.editForm.oneTime) {
      stroke(100, 200, 100);
      strokeWeight(2);
      noFill();
      line(checkboxX + 4, checkboxY + 9, checkboxX + 7, checkboxY + 14);
      line(checkboxX + 7, checkboxY + 14, checkboxX + 14, checkboxY + 4);
    }
    
    // Label
    fill(this.textColor.r, this.textColor.g, this.textColor.b);
    noStroke();
    textAlign(LEFT, TOP);
    textSize(12);
    text('One-Time Trigger (non-repeatable)', checkboxX + checkboxSize + 8, checkboxY + 2);
    
    return yPos + checkboxSize + 5;
  }
  
  /**
   * Render action buttons (Save, Cancel, Delete)
   * @private
   */
  _renderButtons(yPos) {
    const buttonWidth = 90;
    const buttonHeight = this.buttonHeight;
    const spacing = this.buttonSpacing;
    
    // Calculate button positions (left to right: Delete, Cancel, Save)
    const totalButtonWidth = (buttonWidth * 3) + (spacing * 2);
    const startX = this.x + (this.width - totalButtonWidth) / 2;
    
    const deleteX = startX;
    const cancelX = startX + buttonWidth + spacing;
    const saveX = startX + (buttonWidth + spacing) * 2;
    const buttonY = this.y + this.height - buttonHeight - this.padding;
    
    // Store bounds for click detection
    this.deleteButtonBounds = { x: deleteX, y: buttonY, width: buttonWidth, height: buttonHeight };
    this.cancelButtonBounds = { x: cancelX, y: buttonY, width: buttonWidth, height: buttonHeight };
    this.saveButtonBounds = { x: saveX, y: buttonY, width: buttonWidth, height: buttonHeight };
    
    // Delete button (red)
    fill(this.deleteButtonColor.r, this.deleteButtonColor.g, this.deleteButtonColor.b);
    noStroke();
    rect(deleteX, buttonY, buttonWidth, buttonHeight, 5);
    fill(255, 255, 255);
    textAlign(CENTER, CENTER);
    textSize(12);
    text('Delete', deleteX + buttonWidth / 2, buttonY + buttonHeight / 2);
    
    // Cancel button (gray)
    fill(this.cancelButtonColor.r, this.cancelButtonColor.g, this.cancelButtonColor.b);
    rect(cancelX, buttonY, buttonWidth, buttonHeight, 5);
    fill(255, 255, 255);
    text('Cancel', cancelX + buttonWidth / 2, buttonY + buttonHeight / 2);
    
    // Save button (blue)
    fill(this.buttonColor.r, this.buttonColor.g, this.buttonColor.b);
    rect(saveX, buttonY, buttonWidth, buttonHeight, 5);
    fill(255, 255, 255);
    text('Save Changes', saveX + buttonWidth / 2, buttonY + buttonHeight / 2);
  }
  
  /**
   * Handle click events
   * @param {number} relX - X coordinate relative to window
   * @param {number} relY - Y coordinate relative to window
   * @returns {boolean} True if click was consumed
   */
  handleClick(relX, relY) {
    if (!this.isVisible || this.isMinimized) {
      return false;
    }
    
    // Convert to absolute screen coordinates
    const absX = this.x + relX;
    const absY = this.y + relY;
    
    // Check if click is within window bounds
    if (relX < 0 || relX > this.width || relY < 0 || relY > this.height) {
      return false;
    }
    
    // Check button clicks
    if (this._checkButtonClick(absX, absY)) {
      return true;
    }
    
    // Check input field clicks
    if (this._checkInputClick(absX, absY)) {
      return true;
    }
    
    // Check checkbox click
    if (this._checkCheckboxClick(absX, absY)) {
      return true;
    }
    
    return true; // Click consumed by window
  }
  
  /**
   * Check if button was clicked
   * @private
   */
  _checkButtonClick(x, y) {
    // Save button
    if (this.saveButtonBounds && this._pointInBounds(x, y, this.saveButtonBounds)) {
      this.saveChanges();
      return true;
    }
    
    // Cancel button
    if (this.cancelButtonBounds && this._pointInBounds(x, y, this.cancelButtonBounds)) {
      this.cancel();
      return true;
    }
    
    // Delete button
    if (this.deleteButtonBounds && this._pointInBounds(x, y, this.deleteButtonBounds)) {
      this.deleteTrigger();
      return true;
    }
    
    return false;
  }
  
  /**
   * Check if input field was clicked
   * @private
   */
  _checkInputClick(x, y) {
    // Radius input (spatial triggers)
    if (this.radiusInputBounds && this._pointInBounds(x, y, this.radiusInputBounds)) {
      this.activeInput = 'radius';
      this.inputValue = this.editForm.condition.radius.toString();
      return true;
    }
    
    // Delay input (time triggers)
    if (this.delayInputBounds && this._pointInBounds(x, y, this.delayInputBounds)) {
      this.activeInput = 'delay';
      this.inputValue = this.editForm.condition.delay.toString();
      return true;
    }
    
    return false;
  }
  
  /**
   * Check if checkbox was clicked
   * @private
   */
  _checkCheckboxClick(x, y) {
    if (this.oneTimeCheckboxBounds && this._pointInBounds(x, y, this.oneTimeCheckboxBounds)) {
      this.editForm.oneTime = !this.editForm.oneTime;
      return true;
    }
    
    return false;
  }
  
  /**
   * Check if point is within bounds
   * @private
   */
  _pointInBounds(x, y, bounds) {
    return x >= bounds.x && x <= bounds.x + bounds.width &&
           y >= bounds.y && y <= bounds.y + bounds.height;
  }
  
  /**
   * Save changes to EventManager
   * @returns {boolean} True if save successful
   */
  saveChanges() {
    // Validate inputs
    if (!this._validateInputs()) {
      console.error('Validation failed - cannot save');
      return false;
    }
    
    // Update trigger in EventManager
    if (this.eventManager && this.eventManager.updateTrigger) {
      const success = this.eventManager.updateTrigger(this.trigger.id, this.editForm);
      
      if (success) {
        logNormal('Trigger properties saved:', this.trigger.id);
        this.close();
        return true;
      } else {
        console.error('Failed to update trigger in EventManager');
        return false;
      }
    }
    
    return false;
  }
  
  /**
   * Validate input values
   * @private
   * @returns {boolean} True if all inputs valid
   */
  _validateInputs() {
    // Validate spatial trigger radius
    if (this.editForm.type === 'spatial') {
      const radius = this.editForm.condition && this.editForm.condition.radius;
      if (radius === undefined || radius <= 0) {
        console.error('Radius must be greater than 0');
        return false;
      }
    }
    
    // Validate time trigger delay
    if (this.editForm.type === 'time') {
      const delay = this.editForm.condition && this.editForm.condition.delay;
      if (delay === undefined || delay <= 0) {
        console.error('Delay must be greater than 0');
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Delete trigger from EventManager
   */
  deleteTrigger() {
    if (this.eventManager && this.eventManager.deleteTrigger) {
      const success = this.eventManager.deleteTrigger(this.trigger.id);
      
      if (success) {
        logNormal('Trigger deleted:', this.trigger.id);
        this.close();
      } else {
        console.error('Failed to delete trigger from EventManager');
      }
    }
  }
  
  /**
   * Cancel editing and close window
   */
  cancel() {
    logNormal('Property editor cancelled');
    this.close();
  }
  
  /**
   * Close window
   */
  close() {
    this.isVisible = false;
  }
  
  /**
   * Check if point is within window bounds
   * @param {number} x - Screen X coordinate
   * @param {number} y - Screen Y coordinate
   * @returns {boolean} True if point is inside window
   */
  containsPoint(x, y) {
    return x >= this.x && x <= this.x + this.width &&
           y >= this.y && y <= this.y + this.height;
  }
  
  /**
   * Handle mouse wheel events (for scrolling if content overflows)
   * @param {number} delta - Scroll delta
   */
  handleMouseWheel(delta) {
    // TODO: Implement scrolling if content height exceeds window height
    return false;
  }
}

// Export for Node.js (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EventPropertyWindow;
}

// Export for browser (global)
if (typeof window !== 'undefined') {
  window.EventPropertyWindow = EventPropertyWindow;
}

// Export for Node.js global (testing compatibility)
if (typeof global !== 'undefined') {
  global.EventPropertyWindow = EventPropertyWindow;
}

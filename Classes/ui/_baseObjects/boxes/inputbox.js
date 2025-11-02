/**
 * @fileoverview InputBox class for creating interactive text input fields
 * Provides customizable input boxes with validation, placeholders, and styling.
 * Modeled after Button.js for consistency.
 * 
 * @author Software Engineering Team Delta - David Willman
 * @version 1.0.0
 */

/**
 * Creates interactive text input fields with validation and styling.
 * Supports placeholder text, validation callbacks, and error messages.
 * 
 * @class InputBox
 */
class InputBox {
  /**
   * Creates a new InputBox instance.
   * 
   * @param {number} x - X position of the input box
   * @param {number} y - Y position of the input box
   * @param {number} width - Width of the input box
   * @param {number} height - Height of the input box
   * @param {Object} [options={}] - Optional configuration
   * @param {string} [options.value=''] - Initial value
   * @param {string} [options.placeholder=''] - Placeholder text
   * @param {string} [options.backgroundColor='#F0F0F0'] - Input background color
   * @param {string} [options.focusColor='#FFFFFF'] - Color when focused
   * @param {string} [options.textColor='#000000'] - Text color
   * @param {string} [options.placeholderColor='#969696'] - Placeholder text color
   * @param {string} [options.borderColor='#969696'] - Border color
   * @param {number} [options.borderWidth=1] - Border thickness
   * @param {number} [options.cornerRadius=5] - Corner rounding radius
   * @param {string} [options.fontFamily='Arial'] - Font family for text
   * @param {number} [options.fontSize=14] - Font size for text
   * @param {Function} [options.onValidate=null] - Validation callback (returns boolean)
   * @param {string} [options.errorMessage=''] - Error message to display when validation fails
   * @param {boolean} [options.enabled=true] - Whether input is enabled
   * @param {number} [options.maxLength=100] - Maximum character length
   */
  constructor(x, y, width, height, options = {}) {
    // Position and dimensions using CollisionBox2D
    this.bounds = new CollisionBox2D(x, y, width, height);
    
    // Parent reference (for marking dirty when animations needed)
    this.parent = options.parent || null;
    
    // Input state
    this.value = options.value || '';
    this.placeholder = options.placeholder || '';
    this.isFocused = false;
    this.enabled = options.enabled !== undefined ? options.enabled : true;
    this.maxLength = options.maxLength || 100;
    
    // Numeric mode options
    this.inputType = options.inputType || 'text'; // 'text' or 'numeric'
    this.minValue = options.minValue !== undefined ? options.minValue : null;
    this.maxValue = options.maxValue !== undefined ? options.maxValue : null;
    this.maxDigits = options.maxDigits || 10;
    this.integerOnly = options.integerOnly !== undefined ? options.integerOnly : true;
    
    // Style options with defaults
    this.backgroundColor = options.backgroundColor || '#b4b4b4f6';
    this.focusColor = options.focusColor || '#FFFFFF';
    this.hoverColor = options.hoverColor || '#FAFAFA'; // Slightly brighter than background
    this.textColor = options.textColor || '#000000';
    this.placeholderColor = options.placeholderColor || '#969696';
    this.borderColor = options.borderColor || '#969696';
    this.borderWidth = options.borderWidth || 1;
    this.cornerRadius = options.cornerRadius || 5;
    this.fontFamily = options.fontFamily || 'Arial';
    this.fontSize = options.fontSize || 14;
    
    // Hover state
    this.isHovered = false;
    
    // Validation
    this.onValidate = options.onValidate || null;
    this.errorMessage = options.errorMessage || '';
    this.isValid = true;
    this.validationError = '';
    
    // Cursor blink animation
    this.cursorVisible = true;
    this.cursorBlinkTimer = 0;
    this.cursorBlinkInterval = 30; // frames
  }

  // Getter properties for accessing bounds
  get x() { return this.bounds.x; }
  get y() { return this.bounds.y; }
  get width() { return this.bounds.width; }
  get height() { return this.bounds.height; }
  
  /**
   * Updates the input box state based on mouse interaction.
   * Should be called each frame before render.
   * 
   * @param {number} mouseX - Current mouse X position
   * @param {number} mouseY - Current mouse Y position
   * @param {boolean} isMousePressed - Whether mouse button is currently pressed
   * @returns {boolean} True if input consumed the mouse event
   */
  update(mouseX, mouseY, isMousePressed) {
    if (!this.enabled) {
      this.isFocused = false;
      return false;
    }

    // Check if mouse is over input box
    const isOver = this.isMouseOver(mouseX, mouseY);
    
    // Handle focus change on click
    if (isMousePressed) {
      this.isFocused = isOver;
      return isOver;
    }
    
    return false;
  }

  /**
   * Checks if the mouse is currently over the input box.
   * 
   * @param {number} mouseX - Mouse X position
   * @param {number} mouseY - Mouse Y position
   * @returns {boolean} True if mouse is over input box
   */
  isMouseOver(mouseX, mouseY) {
    return this.bounds.contains(mouseX, mouseY);
  }

  /**
   * Handles keyboard input for the focused input box.
   * 
   * @param {string} key - Key pressed
   * @param {number} keyCode - Key code
   * @returns {boolean|Object} True if handled, or event object for Tab/Enter
   */
  handleKeyPress(key, keyCode) {
    if (!this.isFocused || !this.enabled) return false;
    
    // Handle numeric input mode
    if (this.inputType === 'numeric') {
      // Tab: Return focus event
      if (keyCode === 9) {
        return { type: 'focus-next' };
      }
      
      // Enter: Validate and return confirm event
      if (keyCode === 13) {
        const valid = this.validate();
        return { type: 'confirm', valid };
      }
      
      // Backspace: Remove last digit
      if (keyCode === 8) {
        const numValue = parseInt(this.value) || 0;
        this.value = String(Math.floor(numValue / 10));
        if (this.value === '0') this.value = '';
        this.validate();
        return true;
      }
      
      // Numeric keys (0-9)
      if (keyCode >= 48 && keyCode <= 57) {
        const digit = keyCode - 48;
        const currentNum = parseInt(this.value) || 0;
        const newValue = currentNum * 10 + digit;
        
        // Check digit limit
        if (String(newValue).length <= this.maxDigits) {
          this.value = String(newValue);
          this.validate();
          return true;
        }
      }
      
      return false;
    }
    
    // Text mode (existing behavior)
    if (key === 'Backspace') {
      if (this.value.length > 0) {
        this.value = this.value.slice(0, -1);
        this.validate();
        return true;
      }
    } else if (key === 'Enter') {
      // Trigger validation and blur
      this.validate();
      this.isFocused = false;
      return true;
    }
    
    return false;
  }

  /**
   * Handles text input (character typing).
   * 
   * @param {string} char - Character to append
   * @returns {boolean} True if character was added
   */
  handleTextInput(char) {
    if (!this.isFocused || !this.enabled) return false;
    
    if (this.value.length < this.maxLength) {
      this.value += char;
      this.validate();
      return true;
    }
    
    return false;
  }

  /**
   * Validates the current input value using the validation callback.
   * 
   * @returns {boolean} True if valid or no validator provided
   */
  validate() {
    // Numeric validation
    if (this.inputType === 'numeric') {
      const numValue = parseInt(this.value);
      
      // Check if integer
      if (this.integerOnly && !Number.isInteger(numValue)) {
        this.isValid = false;
        this.validationError = 'Must be an integer';
        return false;
      }
      
      // Check min value
      if (this.minValue !== null && numValue < this.minValue) {
        this.isValid = false;
        this.validationError = `Min: ${this.minValue}`;
        return false;
      }
      
      // Check max value
      if (this.maxValue !== null && numValue > this.maxValue) {
        this.isValid = false;
        this.validationError = `Max: ${this.maxValue}`;
        return false;
      }
      
      this.isValid = true;
      this.validationError = '';
      return true;
    }
    
    // Text validation (existing behavior)
    if (!this.onValidate) {
      this.isValid = true;
      this.validationError = '';
      return true;
    }
    
    this.isValid = this.onValidate(this.value);
    if (!this.isValid) {
      this.validationError = this.errorMessage;
    } else {
      this.validationError = '';
    }
    
    return this.isValid;
  }

  /**
   * Renders the input box to the canvas.
   * Uses p5.js drawing functions for rendering.
   */
  render() {
    push();
    rectMode(CORNER);
    textAlign(LEFT, CENTER);
  
    // Update cursor blink
    if (this.isFocused) {
      this.cursorBlinkTimer++;
      if (this.cursorBlinkTimer >= this.cursorBlinkInterval) {
        this.cursorVisible = !this.cursorVisible;
        this.cursorBlinkTimer = 0;
      }
    } else {
      this.cursorVisible = false;
    }
    
    // Draw input box background
    const bgColor = this.isFocused ? this.focusColor : this.backgroundColor;
    fill(bgColor);
    stroke(this.borderColor);
    strokeWeight(this.borderWidth);
    rect(this.x, this.y, this.width, this.height, this.cornerRadius);
    
    // Draw text or placeholder
    noStroke();
    textFont(this.fontFamily);
    textSize(this.fontSize);
    
    const displayText = this.value || this.placeholder;
    const textColor = this.value ? this.textColor : this.placeholderColor;
    fill(textColor);
    
    // Text position (left-aligned with padding)
    const textX = this.x + 10;
    const textY = this.y + this.height / 2;
    text(displayText, textX, textY);
    
    // Draw cursor if focused
    if (this.isFocused && this.cursorVisible) {
      const cursorX = textX + (this.value ? textWidth(this.value) : 0) + 2;
      stroke(this.textColor);
      strokeWeight(2);
      line(cursorX, textY - this.fontSize / 2, cursorX, textY + this.fontSize / 2);
    }
    
    // Draw validation error if present
    if (!this.isValid && this.validationError) {
      fill(200, 0, 0);
      textSize(12);
      textAlign(CENTER, TOP);
      text(this.validationError, this.x + this.width / 2, this.y + this.height + 5);
    }
    
    pop();
  }

  /**
   * Renders the input box to a buffer (for buffer-based rendering contexts).
   * Uses buffer.method() calls instead of global p5 functions.
   * 
   * @param {p5.Graphics} buffer - Graphics buffer to render to
   */
  renderToBuffer(buffer) {
    if (!buffer) return;
    
    // Mark parent as dirty if we need continuous rendering (for animations/hover)
    if ((this.isFocused || this.isHovered) && this.parent && typeof this.parent.markDirty === 'function') {
      this.parent.markDirty();
    }
    
    buffer.push();
    buffer.rectMode(buffer.CORNER);
    buffer.textAlign(buffer.LEFT, buffer.CENTER);
    
    // Update cursor blink (always visible when focused for better UX)
    if (this.isFocused) {
      this.cursorBlinkTimer++;
      if (this.cursorBlinkTimer >= this.cursorBlinkInterval) {
        this.cursorVisible = !this.cursorVisible;
        this.cursorBlinkTimer = 0;
      }
    } else {
      this.cursorVisible = false;
    }
    
    // Draw input box background (prioritize focus > hover > default)
    let bgColor;
    if (this.isFocused) {
      bgColor = this.focusColor;
    } else if (this.isHovered) {
      bgColor = this.hoverColor;
    } else {
      bgColor = this.backgroundColor;
    }
    
    buffer.fill(bgColor);
    buffer.stroke(this.borderColor);
    buffer.strokeWeight(this.borderWidth);
    buffer.rect(this.x, this.y, this.width, this.height, this.cornerRadius);
    
    // Draw text or placeholder
    buffer.noStroke();
    buffer.textFont(this.fontFamily);
    buffer.textSize(this.fontSize);
    
    const displayText = this.value || this.placeholder;
    const textColor = this.value ? this.textColor : this.placeholderColor;
    buffer.fill(textColor);
    
    // Text position (left-aligned with padding)
    const textX = this.x + 10;
    const textY = this.y + this.height / 2;
    buffer.text(displayText, textX, textY);
    
    // Draw cursor if focused
    if (this.isFocused && this.cursorVisible) {
      const cursorX = textX + (this.value ? buffer.textWidth(this.value) : 0) + 2;
      buffer.stroke(this.textColor);
      buffer.strokeWeight(2);
      buffer.line(cursorX, textY - this.fontSize / 2, cursorX, textY + this.fontSize / 2);
    }
    
    // Draw validation error if present
    if (!this.isValid && this.validationError) {
      buffer.fill(200, 0, 0);
      buffer.textSize(12);
      buffer.textAlign(buffer.CENTER, buffer.TOP);
      buffer.text(this.validationError, this.x + this.width / 2, this.y + this.height + 5);
    }
    
    buffer.pop();
    
    // CRITICAL: Mark parent dirty AFTER rendering if we need continuous updates
    // This ensures cursor blink animation and hover states keep updating
    if ((this.isFocused || this.isHovered) && this.parent && typeof this.parent.markDirty === 'function') {
      this.parent.markDirty();
    }
  }

  /**
   * Sets the input box value.
   * 
   * @param {string|number} newValue - New value
   */
  setValue(newValue) {
    if (this.inputType === 'numeric') {
      this.value = String(newValue || 0);
    } else {
      this.value = newValue || '';
    }
    this.validate();
  }

  /**
   * Gets the current input box value.
   * 
   * @returns {string|number} Current value (number if numeric mode, string otherwise)
   */
  getValue() {
    if (this.inputType === 'numeric') {
      return parseInt(this.value) || 0;
    }
    return this.value;
  }

  /**
   * Sets the placeholder text.
   * 
   * @param {string} newPlaceholder - New placeholder text
   */
  setPlaceholder(newPlaceholder) {
    this.placeholder = newPlaceholder;
  }

  /**
   * Sets the input box position.
   * 
   * @param {number} x - New X position
   * @param {number} y - New Y position
   */
  setPosition(x, y) {
    this.bounds.x = x;
    this.bounds.y = y;
  }

  /**
   * Sets the input box size.
   * 
   * @param {number} width - New width
   * @param {number} height - New height
   */
  setSize(width, height) {
    this.bounds.width = width;
    this.bounds.height = height;
  }

  /**
   * Enables or disables the input box.
   * 
   * @param {boolean} enabled - Whether input should be enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.isFocused = false;
    }
  }

  /**
   * Sets focus state for the input box.
   * 
   * @param {boolean} focused - Whether input should be focused
   */
  setFocus(focused) {
    this.isFocused = focused && this.enabled;
  }

  /**
   * Updates hover state based on mouse position.
   * Call this from parent container's update or render loop.
   * 
   * @param {number} mouseX - Current mouse X position
   * @param {number} mouseY - Current mouse Y position
   */
  updateHover(mouseX, mouseY) {
    if (!this.enabled) {
      this.isHovered = false;
      return;
    }
    
    const bounds = this.bounds.getBounds();
    this.isHovered = (
      mouseX >= bounds.x &&
      mouseX <= bounds.x + bounds.width &&
      mouseY >= bounds.y &&
      mouseY <= bounds.y + bounds.height
    );
  }

  /**
   * Clears the input value.
   */
  clear() {
    this.value = '';
    this.validate();
  }

  /**
   * Gets the input box bounds.
   * 
   * @returns {Object} Object with x, y, width, height properties
   */
  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }

  /**
   * Gets debug information about the input box state.
   * 
   * @returns {Object} Debug information object
   */
  getDebugInfo() {
    return {
      position: { x: this.x, y: this.y },
      size: { width: this.width, height: this.height },
      value: this.value,
      placeholder: this.placeholder,
      enabled: this.enabled,
      isFocused: this.isFocused,
      isValid: this.isValid,
      validationError: this.validationError
    };
  }
}

/**
 * Global input box styles - centralized styling for consistency
 */
const InputBoxStyles = {
  // Default style
  DEFAULT: {
    backgroundColor: '#F0F0F0',
    focusColor: '#FFFFFF',
    textColor: '#000000',
    placeholderColor: '#969696',
    borderColor: '#969696',
    borderWidth: 1,
    cornerRadius: 5,
    fontSize: 14
  },
  
  // Modal dialog style
  MODAL: {
    backgroundColor: '#F0F0F0',
    focusColor: '#FFFFFF',
    textColor: '#000000',
    placeholderColor: '#969696',
    borderColor: '#969696',
    borderWidth: 1,
    cornerRadius: 5,
    fontSize: 14
  },
  
  // Search box style
  SEARCH: {
    backgroundColor: '#FFFFFF',
    focusColor: '#FFFFFF',
    textColor: '#000000',
    placeholderColor: '#AAAAAA',
    borderColor: '#CCCCCC',
    borderWidth: 1,
    cornerRadius: 3,
    fontSize: 12
  }
};

// Make InputBox class and InputBoxStyles globally available
if (typeof window !== 'undefined') {
  window.InputBox = InputBox;
  window.InputBoxStyles = InputBoxStyles;
}
if (typeof global !== 'undefined') {
  global.InputBox = InputBox;
  global.InputBoxStyles = InputBoxStyles;
}

// Export for Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = InputBox;
  module.exports.InputBoxStyles = InputBoxStyles;
}

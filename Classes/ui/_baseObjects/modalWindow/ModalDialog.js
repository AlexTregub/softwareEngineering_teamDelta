/**
 * ModalDialog Component
 * 
 * Reusable modal dialog for user interactions:
 * - Add new custom entity (input + validation)
 * - Rename entity (input + validation)
 * - Delete confirmation (warning message)
 * 
 * Features:
 * - Show/hide with overlay
 * - Title and message display
 * - Optional input field with validation
 * - Multiple buttons with callbacks
 * - Keyboard support (Enter, Esc, Backspace)
 * - Click detection for buttons
 */

class ModalDialog {
  constructor() {
    this._visible = false;
    this.title = '';
    this.message = '';
    this.hasInput = false;
    this.inputPlaceholder = '';
    this.inputValue = '';
    this.buttons = [];
    this.validateInputFn = null;
    this.validationError = '';
    this.errorMessage = '';
    
    // Modal dimensions
    this.width = 400;
    this.height = 300;
    
    // Canvas dimensions (assumed, can be overridden)
    this.canvasWidth = 800;
    this.canvasHeight = 600;
  }
  
  /**
   * Check if modal is visible
   * @returns {boolean}
   */
  isVisible() {
    return this._visible;
  }
  
  /**
   * Show modal with configuration
   * @param {Object} config - Modal configuration
   * @param {string} config.title - Modal title
   * @param {string} config.message - Modal message
   * @param {boolean} [config.hasInput=false] - Show input field
   * @param {string} [config.inputPlaceholder=''] - Input placeholder text
   * @param {string} [config.inputValue=''] - Initial input value
   * @param {Function} [config.validateInput] - Input validation function
   * @param {string} [config.validationError=''] - Validation error message
   * @param {Array} [config.buttons=[]] - Button configurations
   */
  show(config) {
    this._visible = true;
    this.title = config.title || '';
    this.message = config.message || '';
    this.hasInput = config.hasInput || false;
    this.inputPlaceholder = config.inputPlaceholder || '';
    this.inputValue = config.inputValue || '';
    this.buttons = config.buttons || [];
    this.validateInputFn = config.validateInput || null;
    this.validationError = config.validationError || '';
    this.errorMessage = '';
  }
  
  /**
   * Hide modal
   */
  hide() {
    this._visible = false;
    this.errorMessage = '';
  }
  
  /**
   * Validate input using custom validator
   * @returns {boolean} - True if valid
   */
  validateInput() {
    if (!this.validateInputFn) return true;
    
    const isValid = this.validateInputFn(this.inputValue);
    if (!isValid) {
      this.errorMessage = this.validationError;
    } else {
      this.errorMessage = '';
    }
    return isValid;
  }
  
  /**
   * Handle button click detection
   * @param {number} mouseX - Mouse X coordinate
   * @param {number} mouseY - Mouse Y coordinate
   * @returns {boolean} - True if click was handled
   */
  handleClick(mouseX, mouseY) {
    if (!this._visible) return false;
    
    // Calculate modal position (centered)
    const modalX = (this.canvasWidth - this.width) / 2;
    const modalY = (this.canvasHeight - this.height) / 2;
    
    // Check if click is outside modal (on overlay)
    if (mouseX < modalX || mouseX > modalX + this.width ||
        mouseY < modalY || mouseY > modalY + this.height) {
      return false;
    }
    
    // Button area at bottom of modal
    const buttonY = modalY + this.height - 60; // 60px from bottom
    const buttonHeight = 40;
    const buttonSpacing = 10;
    const buttonWidth = (this.width - buttonSpacing * (this.buttons.length + 1)) / this.buttons.length;
    
    // Check each button
    for (let i = 0; i < this.buttons.length; i++) {
      const button = this.buttons[i];
      const btnX = modalX + buttonSpacing + (buttonWidth + buttonSpacing) * i;
      const btnY = buttonY;
      
      if (mouseX >= btnX && mouseX <= btnX + buttonWidth &&
          mouseY >= btnY && mouseY <= btnY + buttonHeight) {
        
        // Validate input if required
        if (this.hasInput && button.type === 'primary') {
          if (!this.validateInput()) {
            return true; // Handled but validation failed
          }
        }
        
        // Execute callback
        if (button.callback) {
          button.callback(this.inputValue);
        }
        
        this.hide();
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Handle keyboard input
   * @param {string} key - Key pressed
   * @returns {boolean} - True if key was handled
   */
  handleKeyPress(key) {
    if (!this._visible) return false;
    
    if (key === 'Enter') {
      // Find primary button and trigger it
      const primaryButton = this.buttons.find(btn => btn.type === 'primary');
      if (primaryButton) {
        // Validate input if required
        if (this.hasInput && !this.validateInput()) {
          return true; // Handled but validation failed
        }
        
        if (primaryButton.callback) {
          primaryButton.callback(this.inputValue);
        }
        this.hide();
        return true;
      }
    } else if (key === 'Escape') {
      // Find secondary button (cancel) and trigger it
      const secondaryButton = this.buttons.find(btn => btn.type === 'secondary');
      if (secondaryButton) {
        if (secondaryButton.callback) {
          secondaryButton.callback(this.inputValue);
        }
        this.hide();
        return true;
      }
    } else if (key === 'Backspace') {
      if (this.hasInput && this.inputValue.length > 0) {
        this.inputValue = this.inputValue.slice(0, -1);
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Handle text input (for input field)
   * @param {string} text - Text to append
   */
  handleTextInput(text) {
    if (this.hasInput) {
      this.inputValue += text;
    }
  }
  
  /**
   * Render modal
   */
  render() {
    if (!this._visible) return;
    
    if (typeof push !== 'undefined') push();
    
    // Draw overlay (semi-transparent black)
    if (typeof fill !== 'undefined') fill(0, 0, 0, 150);
    if (typeof noStroke !== 'undefined') noStroke();
    if (typeof rect !== 'undefined') rect(0, 0, this.canvasWidth, this.canvasHeight);
    
    // Calculate modal position (centered)
    const modalX = (this.canvasWidth - this.width) / 2;
    const modalY = (this.canvasHeight - this.height) / 2;
    
    // Draw modal box (white background)
    if (typeof fill !== 'undefined') fill(255);
    if (typeof stroke !== 'undefined') stroke(100);
    if (typeof rect !== 'undefined') rect(modalX, modalY, this.width, this.height, 10);
    
    // Draw title
    if (typeof fill !== 'undefined') fill(0);
    if (typeof textAlign !== 'undefined') textAlign(window.CENTER || 'center', window.TOP || 'top');
    if (typeof textSize !== 'undefined') textSize(18);
    if (typeof text !== 'undefined') text(this.title, modalX + this.width / 2, modalY + 20);
    
    // Draw message
    if (typeof textSize !== 'undefined') textSize(14);
    if (typeof text !== 'undefined') text(this.message, modalX + this.width / 2, modalY + 60);
    
    // Draw input field if enabled
    if (this.hasInput) {
      const inputY = modalY + 120;
      const inputHeight = 40;
      
      // Input box
      if (typeof fill !== 'undefined') fill(240);
      if (typeof stroke !== 'undefined') stroke(150);
      if (typeof rect !== 'undefined') rect(modalX + 20, inputY, this.width - 40, inputHeight, 5);
      
      // Input text
      if (typeof fill !== 'undefined') fill(0);
      if (typeof textAlign !== 'undefined') textAlign(window.LEFT || 'left', window.CENTER || 'center');
      if (typeof textSize !== 'undefined') textSize(14);
      const displayText = this.inputValue || this.inputPlaceholder;
      const textColor = this.inputValue ? 0 : 150; // Gray for placeholder
      if (typeof fill !== 'undefined') fill(textColor);
      if (typeof text !== 'undefined') text(displayText, modalX + 30, inputY + inputHeight / 2);
      
      // Error message
      if (this.errorMessage) {
        if (typeof fill !== 'undefined') fill(200, 0, 0);
        if (typeof textAlign !== 'undefined') textAlign(window.CENTER || 'center', window.TOP || 'top');
        if (typeof textSize !== 'undefined') textSize(12);
        if (typeof text !== 'undefined') text(this.errorMessage, modalX + this.width / 2, inputY + inputHeight + 10);
      }
    }
    
    // Draw buttons
    const buttonY = modalY + this.height - 60;
    const buttonHeight = 40;
    const buttonSpacing = 10;
    const buttonWidth = (this.width - buttonSpacing * (this.buttons.length + 1)) / this.buttons.length;
    
    for (let i = 0; i < this.buttons.length; i++) {
      const button = this.buttons[i];
      const btnX = modalX + buttonSpacing + (buttonWidth + buttonSpacing) * i;
      
      // Button background color
      if (button.type === 'primary') {
        if (typeof fill !== 'undefined') fill(50, 150, 250); // Blue
      } else {
        if (typeof fill !== 'undefined') fill(150); // Gray
      }
      
      if (typeof stroke !== 'undefined') stroke(100);
      if (typeof rect !== 'undefined') rect(btnX, buttonY, buttonWidth, buttonHeight, 5);
      
      // Button text
      if (typeof fill !== 'undefined') fill(255);
      if (typeof textAlign !== 'undefined') textAlign(window.CENTER || 'center', window.CENTER || 'center');
      if (typeof textSize !== 'undefined') textSize(14);
      if (typeof text !== 'undefined') text(button.label, btnX + buttonWidth / 2, buttonY + buttonHeight / 2);
    }
    
    if (typeof pop !== 'undefined') pop();
  }
}

// Export for Node.js and browser
if (typeof window !== 'undefined') {
  window.ModalDialog = ModalDialog;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ModalDialog;
}

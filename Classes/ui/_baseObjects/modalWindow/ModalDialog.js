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
 * - Multiple buttons with Button.js (hover, click, callbacks)
 * - Keyboard support (Enter, Esc, Backspace)
 * - Uses Dialog helper methods for rendering
 * - Extends Dialog base class for architectural consistency
 * - Uses Button.js for button rendering and interaction
 * - Uses Dialog helper methods (renderOverlay, renderInputField, renderValidationError)
 */

class ModalDialog extends Dialog {
  constructor() {
    super();
    this.title = '';
    this.message = '';
    this.hasInput = false;
    this.inputBox = null; // InputBox instance (replaces manual input rendering)
    this.buttonInstances = []; // Button.js instances
    
    // Modal dimensions
    this.width = 400;
    this.height = 300;
    
    // Canvas dimensions (for screen rendering)
    this.canvasWidth = 800;
    this.canvasHeight = 600;
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
   * @param {Array} [config.buttons=[]] - Button configurations [{label, callback, type}]
   */
  show(config) {
    super.show();
    this.title = config.title || '';
    this.message = config.message || '';
    this.hasInput = config.hasInput || false;
    
    // Create InputBox instance if needed
    if (this.hasInput) {
      this._createInputBox(config);
    } else {
      this.inputBox = null;
    }
    
    // Create Button.js instances from config
    this._createButtons(config.buttons || []);
  }
  
  /**
   * Hide modal and clear state
   */
  hide() {
    super.hide();
    this.inputBox = null;
    this.buttonInstances = [];
  }
  
  /**
   * Create InputBox instance from config
   * @private
   */
  _createInputBox(config) {
    const modalX = (this.canvasWidth - this.width) / 2;
    const modalY = (this.canvasHeight - this.height) / 2;
    const inputY = modalY + 120;
    const inputHeight = 40;
    
    this.inputBox = new InputBox(
      modalX + 20,
      inputY,
      this.width - 40,
      inputHeight,
      {
        value: config.inputValue || '',
        placeholder: config.inputPlaceholder || '',
        onValidate: config.validateInput || null,
        errorMessage: config.validationError || '',
        ...InputBoxStyles.MODAL
      }
    );
    
    // Auto-focus the input box
    this.inputBox.setFocus(true);
  }
  
  /**
   * Create Button.js instances from button config
   * @private
   */
  _createButtons(buttonsConfig) {
    const modalX = (this.canvasWidth - this.width) / 2;
    const modalY = (this.canvasHeight - this.height) / 2;
    const buttonY = modalY + this.height - 60;
    const buttonHeight = 40;
    const buttonSpacing = 10;
    const buttonWidth = (this.width - buttonSpacing * (buttonsConfig.length + 1)) / buttonsConfig.length;
    
    this.buttonInstances = buttonsConfig.map((btnConfig, i) => {
      const btnX = modalX + buttonSpacing + (buttonWidth + buttonSpacing) * i;
      
      // Create Button instance
      const button = new Button(btnX, buttonY, buttonWidth, buttonHeight, btnConfig.label, {
        backgroundColor: btnConfig.type === 'primary' ? '#3296FA' : '#969696',
        hoverColor: btnConfig.type === 'primary' ? '#287ACD' : '#787878',
        textColor: '#FFFFFF',
        borderColor: '#646464',
        borderWidth: 1,
        cornerRadius: 5,
        fontSize: 14,
        onClick: () => {
          // Validate input if required (using InputBox)
          if (this.inputBox && btnConfig.type === 'primary') {
            if (!this.inputBox.validate()) {
              return; // Don't hide modal, show validation error
            }
          }
          
          // Execute callback with InputBox value
          if (btnConfig.callback) {
            const inputValue = this.inputBox ? this.inputBox.getValue() : '';
            btnConfig.callback(inputValue);
          }
          
          this.hide();
        }
      });
      
      return button;
    });
  }
  
  /**
   * Handle click detection (uses Button.js and InputBox instances)
   * @param {number} mouseX - Mouse X coordinate
   * @param {number} mouseY - Mouse Y coordinate
   * @returns {boolean} - True if click was handled
   */
  handleClick(mouseX, mouseY) {
    if (!this.isVisible()) return false;
    
    // Calculate modal position (centered)
    const modalX = (this.canvasWidth - this.width) / 2;
    const modalY = (this.canvasHeight - this.height) / 2;
    
    // Check if click is outside modal (on overlay)
    if (mouseX < modalX || mouseX > modalX + this.width ||
        mouseY < modalY || mouseY > modalY + this.height) {
      return false;
    }
    
    // Check InputBox click (for focus)
    if (this.inputBox) {
      this.inputBox.update(mouseX, mouseY, true);
    }
    
    // Check if any button was clicked (Button.js handles this)
    for (let button of this.buttonInstances) {
      if (button.update(mouseX, mouseY, true)) {
        return true; // Button was clicked, handled
      }
    }
    
    return false;
  }
  
  /**
   * Handle keyboard input (delegates to InputBox and Button shortcuts)
   * @param {string} key - Key pressed
   * @returns {boolean} - True if key was handled
   */
  handleKeyPress(key) {
    if (!this.isVisible()) return false;
    
    // Let InputBox handle typing keys first
    if (this.inputBox) {
      if (this.inputBox.handleKeyPress(key)) {
        return true;
      }
    }
    
    // Handle button shortcuts
    if (key === 'Enter') {
      // Trigger first button (primary)
      if (this.buttonInstances.length > 0) {
        const primaryButton = this.buttonInstances[0];
        if (primaryButton.onClick) {
          primaryButton.onClick(primaryButton);
        }
        return true;
      }
    } else if (key === 'Escape') {
      // Trigger second button (cancel/secondary)
      if (this.buttonInstances.length > 1) {
        const secondaryButton = this.buttonInstances[1];
        if (secondaryButton.onClick) {
          secondaryButton.onClick(secondaryButton);
        }
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Handle text input (delegates to InputBox)
   * @param {string} text - Text to append
   */
  handleTextInput(text) {
    if (this.inputBox) {
      this.inputBox.handleTextInput(text);
    }
  }
  
  /**
   * Render modal (uses InputBox and Button.js)
   */
  render() {
    if (!this.isVisible()) return;
    
    push();
    
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
    
    // Render InputBox if enabled (handles all input rendering)
    if (this.inputBox) { this.inputBox.render(); }
    
    // Render buttons using Button.js
    for (let button of this.buttonInstances) { Button.render(); }
    
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

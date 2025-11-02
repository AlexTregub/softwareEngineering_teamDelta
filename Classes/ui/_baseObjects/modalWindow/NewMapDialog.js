/**
 * NewMapDialog - Modal dialog for creating new maps with custom dimensions
 * @extends Dialog
 */
class NewMapDialog extends Dialog {
  constructor() {
    super({
      width: 400,
      height: 320,
      title: 'New Map'
    });
    
    this.MIN_DIMENSION = 10;
    this.MAX_DIMENSION = 1000;
    this.PERFORMANCE_WARNING_THRESHOLD = 200;
    
    this._createInputBoxes();
    this._createButtonGroup();
  }
  
  /**
   * Initialize width and height input fields
   * @private
   */
  _createInputBoxes() {
    const inputWidth = 160;
    const inputHeight = 35;
    const centerX = this.width / 2;
    const baseY = 90;
    
    const baseOptions = {
      parent: this,
      inputType: 'numeric',
      minValue: this.MIN_DIMENSION,
      maxValue: this.MAX_DIMENSION,
      maxDigits: 4,
      integerOnly: true,
      value: '50'
    };
    
    const configs = [
      { input: 'widthInput', yOffset: 0, placeholder: 'Width (tiles)' },
      { input: 'heightInput', yOffset: 50, placeholder: 'Height (tiles)' }
    ];
    
    configs.forEach(({ input, yOffset, placeholder }) => {
      this[input] = new InputBox(
        centerX - (inputWidth / 2),
        baseY + yOffset,
        inputWidth,
        inputHeight,
        { ...baseOptions, placeholder }
      );
    });
    
    this.widthInput.setFocus(true);
    this.heightInput.setFocus(false);
  }
  
  /**
   * Initialize Cancel and Create buttons
   * @private
   */
  _createButtonGroup() {
    this.buttonGroup = new ButtonGroup({
      orientation: 'horizontal',
      spacing: 20,
      alignment: 'bottom-center',
      parentWidth: this.width,
      parentHeight: this.height,
      buttonWidth: 100,
      buttonHeight: 30
    });
    
    this.buttonGroup.addButton('Cancel', 'cancel', () => this.cancel());
    this.buttonGroup.addButton('Create', 'primary', () => {
      if (this.widthInput.validate() && this.heightInput.validate()) {
        this.confirm();
      }
    });
  }
  
  /**
   * Get current map dimensions
   * @returns {{width: number, height: number}}
   */
  getDimensions() {
    return {
      width: this.widthInput.getValue(),
      height: this.heightInput.getValue()
    };
  }
  
  /**
   * Handle keyboard input
   * @param {string} key - Key name
   * @param {number} keyCode - Key code
   * @returns {boolean} True if handled
   */
  handleKeyPress(key, keyCode) {
    if (key === 'Escape' || keyCode === 27) {
      this.cancel();
      return true;
    }
    
    const focusedInput = this.widthInput.isFocused ? this.widthInput : 
                        this.heightInput.isFocused ? this.heightInput : null;
    
    if (focusedInput) {
      const result = focusedInput.handleKeyPress(key, keyCode);
      
      if (result && typeof result === 'object') {
        if (result.type === 'focus-next') {
          this._switchFocus();
          return true;
        } else if (result.type === 'confirm') {
          if (result.valid && this.widthInput.validate() && this.heightInput.validate()) {
            this.confirm();
          }
          return true;
        }
      }
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Switch focus between inputs
   * @private
   */
  _switchFocus() {
    if (this.widthInput.isFocused) {
      this.widthInput.setFocus(false);
      this.heightInput.setFocus(true);
    } else {
      this.heightInput.setFocus(false);
      this.widthInput.setFocus(true);
    }
    this.markDirty();
  }
  
  /**
   * Handle click within dialog
   * @param {number} relX - X relative to dialog
   * @param {number} relY - Y relative to dialog
   * @returns {boolean} True if handled
   */
  handleDialogClick(relX, relY) {
    const widthBounds = this.widthInput.bounds.getBounds();
    if (this.isPointInBounds(relX, relY, widthBounds)) {
      this.widthInput.setFocus(true);
      this.heightInput.setFocus(false);
      this.markDirty();
      return true;
    }
    
    const heightBounds = this.heightInput.bounds.getBounds();
    if (this.isPointInBounds(relX, relY, heightBounds)) {
      this.heightInput.setFocus(true);
      this.widthInput.setFocus(false);
      this.markDirty();
      return true;
    }
    
    if (this.buttonGroup.handleClick(relX, relY)) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Handle click with screen coordinates
   * @param {number} mouseX - Screen X
   * @param {number} mouseY - Screen Y
   * @returns {boolean} True if handled
   */
  handleClick(mouseX, mouseY) {
    return this.handleClickWithConversion(mouseX, mouseY);
  }
  
  /**
   * Confirm dialog with dimensions
   */
  confirm() {
    const dimensions = this.getDimensions();
    
    if (this.onConfirm) {
      this.onConfirm(dimensions.width, dimensions.height);
    }
    this.hide();
  }
  
  /**
   * Show dialog centered on canvas
   */
  show() {
    this.showWithCentering();
  }
  
  /**
   * Reset inputs when dialog shown
   */
  onShow() {
    this.widthInput.setValue('50');
    this.heightInput.setValue('50');
    this.widthInput.setFocus(true);
    this.heightInput.setFocus(false);
  }
  
  /**
   * Hide dialog (preserves callbacks)
   */
  hide() {
    this.setVisible(false);
    this.markDirty();
  }
  
  /**
   * Get inputs needing continuous rendering
   * @returns {Array<InputBox>}
   */
  getAnimatableChildren() {
    return [this.widthInput, this.heightInput];
  }
  
  /**
   * Render modal overlay and dialog
   */
  renderToScreen() {
    if (!this.visible) return;
    
    this.renderModalOverlay();
    
    const buffer = this.getCacheBuffer();
    if (buffer) {
      push();
      imageMode(CORNER);
      image(buffer, this.x, this.y);
      pop();
    } else {
      super.renderToScreen();
    }
  }
  
  /**
   * Get inputs with hover states
   * @returns {Array<InputBox>}
   */
  getHoverableChildren() {
    return [this.widthInput, this.heightInput];
  }
  
  /**
   * Render dialog content to buffer
   * @param {p5.Graphics} buffer
   */
  renderContent(buffer) {
    if (!buffer) return;
    
    this.updateChildHovers();
    
    const centerX = this.width / 2;
    let currentY = 60;
    
    this.renderInstructionText(buffer, 'Enter map dimensions (tiles):', centerX, currentY);
    currentY += 30;
    
    this.widthInput.renderToBuffer(buffer);
    this.heightInput.renderToBuffer(buffer);
    
    currentY = this.heightInput.bounds.y + this.heightInput.bounds.height + 10;
    
    this.renderHintText(buffer, `Min: ${this.MIN_DIMENSION} tiles, Max: ${this.MAX_DIMENSION} tiles`, centerX, currentY);
    currentY += 25;
    
    this.buttonGroup.renderToBuffer(buffer);
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

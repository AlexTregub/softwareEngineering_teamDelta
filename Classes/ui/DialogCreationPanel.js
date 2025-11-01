/**
 * DialogCreationPanel - Dialog creation UI component
 * 
 * Specialized UI for creating character-based dialogue events
 * Opens when user selects "Dialogue 💬" template in EventEditorPanel
 * 
 * @class DialogCreationPanel
 */

class DialogCreationPanel {
  /**
   * Create dialog creation panel
   * @param {number} x - Screen X position
   * @param {number} y - Screen Y position
   * @param {number} width - Panel width
   * @param {number} height - Panel height
   * @param {Object} eventData - Event object being edited
   * @param {Object} eventManager - EventManager instance
   */
  constructor(x, y, width, height, eventData, eventManager) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.eventData = eventData;
    this.eventManager = eventManager;
    
    // Dialogue lines for each character
    this.character1Lines = [];
    this.character2Lines = [];
    
    // Selection state
    this.selectedCharacter = null;
    this.selectedLineIndex = null;
    
    // UI state
    this.isVisible = true;
    this.title = 'Dialog Creation';
    
    // Layout configuration
    this.titleBarHeight = 40;
    this.columnHeaderHeight = 35;
    this.padding = 20;
    this.columnGap = 20;
    this.lineHeight = 60;
    this.lineSpacing = 10;
    this.buttonHeight = 40;
    this.buttonWidth = 60;
    this.buttonSpacing = 10;
    
    // Colors
    this.bgColor = { r: 45, g: 45, b: 50, a: 240 };
    this.borderColor = { r: 100, g: 100, b: 110, a: 255 };
    this.titleBarColor = { r: 35, g: 35, b: 40, a: 255 };
    this.columnHeaderColor = { r: 50, g: 50, b: 55, a: 255 };
    this.lineBoxColor = { r: 30, g: 30, b: 35, a: 255 };
    this.lineBoxBorder = { r: 100, g: 100, b: 110, a: 255 };
    this.selectedBorder = { r: 60, g: 130, b: 200, a: 255 };
    this.textColor = { r: 220, g: 220, b: 220, a: 255 };
    this.addButtonColor = { r: 60, g: 130, b: 200, a: 255 };
    this.removeButtonColor = { r: 200, g: 60, b: 60, a: 255 };
    
    // Button bounds (calculated during render)
    this.addButton1Bounds = null;
    this.removeButton1Bounds = null;
    this.addButton2Bounds = null;
    this.removeButton2Bounds = null;
    
    // Line bounds (for click detection)
    this.line1Bounds = [];
    this.line2Bounds = [];
  }
  
  /**
   * Render dialog creation panel
   */
  render() {
    if (!this.isVisible) {
      return;
    }
    
    push();
    
    // Panel background
    fill(this.bgColor.r, this.bgColor.g, this.bgColor.b, this.bgColor.a);
    stroke(this.borderColor.r, this.borderColor.g, this.borderColor.b, this.borderColor.a);
    strokeWeight(2);
    rect(this.x, this.y, this.width, this.height, 5);
    
    // Title bar
    this._renderTitleBar();
    
    // Calculate column dimensions
    const columnWidth = (this.width - this.padding * 2 - this.columnGap) / 2;
    const contentY = this.y + this.titleBarHeight + this.columnHeaderHeight;
    const contentHeight = this.height - this.titleBarHeight - this.columnHeaderHeight - this.padding - this.buttonHeight - 10;
    
    // Render character columns
    const col1X = this.x + this.padding;
    const col2X = this.x + this.padding + columnWidth + this.columnGap;
    
    this._renderCharacterColumn(1, col1X, contentY, columnWidth, contentHeight);
    this._renderCharacterColumn(2, col2X, contentY, columnWidth, contentHeight);
    
    pop();
  }
  
  /**
   * Render title bar
   * @private
   */
  _renderTitleBar() {
    // Title bar background
    fill(this.titleBarColor.r, this.titleBarColor.g, this.titleBarColor.b, this.titleBarColor.a);
    noStroke();
    rect(this.x, this.y, this.width, this.titleBarHeight, 5, 5, 0, 0);
    
    // Title text
    fill(this.textColor.r, this.textColor.g, this.textColor.b, this.textColor.a);
    textAlign(CENTER, CENTER);
    textSize(16);
    text(this.title, this.x + this.width / 2, this.y + this.titleBarHeight / 2);
  }
  
  /**
   * Render character column
   * @private
   * @param {number} characterNum - Character number (1 or 2)
   * @param {number} x - Column X position
   * @param {number} y - Column Y position
   * @param {number} width - Column width
   * @param {number} height - Column height
   */
  _renderCharacterColumn(characterNum, x, y, width, height) {
    // Column header background
    const headerY = y - this.columnHeaderHeight;
    fill(this.columnHeaderColor.r, this.columnHeaderColor.g, this.columnHeaderColor.b, this.columnHeaderColor.a);
    noStroke();
    rect(x, headerY, width, this.columnHeaderHeight);
    
    // Column header text
    fill(this.textColor.r, this.textColor.g, this.textColor.b, this.textColor.a);
    textAlign(CENTER, CENTER);
    textSize(14);
    text(`Character ${characterNum}`, x + width / 2, headerY + this.columnHeaderHeight / 2);
    
    // Get lines for this character
    const lines = characterNum === 1 ? this.character1Lines : this.character2Lines;
    const lineBounds = characterNum === 1 ? this.line1Bounds : this.line2Bounds;
    lineBounds.length = 0; // Clear previous bounds
    
    // Render dialogue lines
    let currentY = y + this.padding;
    lines.forEach((lineText, index) => {
      const isSelected = this.selectedCharacter === characterNum && this.selectedLineIndex === index;
      this._renderDialogueLine(lineText, x, currentY, width, this.lineHeight, isSelected);
      
      // Store bounds for click detection
      lineBounds.push({
        x: x,
        y: currentY,
        width: width,
        height: this.lineHeight
      });
      
      currentY += this.lineHeight + this.lineSpacing;
    });
    
    // Render add/remove buttons at bottom
    const buttonY = y + height - this.buttonHeight;
    this._renderAddRemoveButtons(characterNum, x, buttonY, width);
  }
  
  /**
   * Render individual dialogue line
   * @private
   * @param {string} text - Line text
   * @param {number} x - Line X position
   * @param {number} y - Line Y position
   * @param {number} width - Line width
   * @param {number} height - Line height
   * @param {boolean} isSelected - Whether line is selected
   */
  _renderDialogueLine(text, x, y, width, height, isSelected) {
    // Line box background
    fill(this.lineBoxColor.r, this.lineBoxColor.g, this.lineBoxColor.b, this.lineBoxColor.a);
    
    if (isSelected) {
      stroke(this.selectedBorder.r, this.selectedBorder.g, this.selectedBorder.b, this.selectedBorder.a);
      strokeWeight(3);
    } else {
      stroke(this.lineBoxBorder.r, this.lineBoxBorder.g, this.lineBoxBorder.b, this.lineBoxBorder.a);
      strokeWeight(1);
    }
    
    rect(x, y, width, height, 3);
    
    // Line text (if not empty)
    if (text && text.length > 0) {
      fill(this.textColor.r, this.textColor.g, this.textColor.b, this.textColor.a);
      textAlign(LEFT, CENTER);
      textSize(12);
      // Use global text() function (avoid shadowing parameter name)
      if (typeof window !== 'undefined' && window.text) {
        window.text(text, x + 10, y + height / 2);
      } else if (typeof global !== 'undefined' && global.text) {
        global.text(text, x + 10, y + height / 2);
      }
    }
  }
  
  /**
   * Render add/remove buttons
   * @private
   * @param {number} characterNum - Character number (1 or 2)
   * @param {number} x - Buttons X position
   * @param {number} y - Buttons Y position
   * @param {number} columnWidth - Column width
   */
  _renderAddRemoveButtons(characterNum, x, y, columnWidth) {
    const buttonY = y;
    const addX = x + columnWidth / 2 - this.buttonWidth - this.buttonSpacing / 2;
    const removeX = x + columnWidth / 2 + this.buttonSpacing / 2;
    
    // Add button (+)
    fill(this.addButtonColor.r, this.addButtonColor.g, this.addButtonColor.b);
    noStroke();
    rect(addX, buttonY, this.buttonWidth, this.buttonHeight, 5);
    fill(255, 255, 255);
    textAlign(CENTER, CENTER);
    textSize(20);
    text('+', addX + this.buttonWidth / 2, buttonY + this.buttonHeight / 2);
    
    // Remove button (-)
    fill(this.removeButtonColor.r, this.removeButtonColor.g, this.removeButtonColor.b);
    rect(removeX, buttonY, this.buttonWidth, this.buttonHeight, 5);
    fill(255, 255, 255);
    text('−', removeX + this.buttonWidth / 2, buttonY + this.buttonHeight / 2);
    
    // Store button bounds for click detection
    if (characterNum === 1) {
      this.addButton1Bounds = { x: addX, y: buttonY, width: this.buttonWidth, height: this.buttonHeight };
      this.removeButton1Bounds = { x: removeX, y: buttonY, width: this.buttonWidth, height: this.buttonHeight };
    } else {
      this.addButton2Bounds = { x: addX, y: buttonY, width: this.buttonWidth, height: this.buttonHeight };
      this.removeButton2Bounds = { x: removeX, y: buttonY, width: this.buttonWidth, height: this.buttonHeight };
    }
  }
  
  /**
   * Handle click events
   * @param {number} x - Screen X coordinate
   * @param {number} y - Screen Y coordinate
   * @returns {boolean} True if click was consumed
   */
  handleClick(x, y) {
    if (!this.isVisible) {
      return false;
    }
    
    // Check if click is within panel bounds
    if (x < this.x || x > this.x + this.width || y < this.y || y > this.y + this.height) {
      return false;
    }
    
    // Check add button 1
    if (this._pointInBounds(x, y, this.addButton1Bounds)) {
      this.addLine(1);
      return true;
    }
    
    // Check remove button 1
    if (this._pointInBounds(x, y, this.removeButton1Bounds)) {
      this.removeLine(1, this.character1Lines.length - 1); // Remove last line
      return true;
    }
    
    // Check add button 2
    if (this._pointInBounds(x, y, this.addButton2Bounds)) {
      this.addLine(2);
      return true;
    }
    
    // Check remove button 2
    if (this._pointInBounds(x, y, this.removeButton2Bounds)) {
      this.removeLine(2, this.character2Lines.length - 1); // Remove last line
      return true;
    }
    
    // Check line selection for character 1
    for (let i = 0; i < this.line1Bounds.length; i++) {
      if (this._pointInBounds(x, y, this.line1Bounds[i])) {
        this.selectLine(1, i);
        return true;
      }
    }
    
    // Check line selection for character 2
    for (let i = 0; i < this.line2Bounds.length; i++) {
      if (this._pointInBounds(x, y, this.line2Bounds[i])) {
        this.selectLine(2, i);
        return true;
      }
    }
    
    return true; // Click consumed by panel
  }
  
  /**
   * Check if point is within bounds
   * @private
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {Object} bounds - Bounds object {x, y, width, height}
   * @returns {boolean} True if point is within bounds
   */
  _pointInBounds(x, y, bounds) {
    if (!bounds) return false;
    return x >= bounds.x && x <= bounds.x + bounds.width &&
           y >= bounds.y && y <= bounds.y + bounds.height;
  }
  
  /**
   * Add dialogue line to character
   * @param {number} characterNum - Character number (1 or 2)
   */
  addLine(characterNum) {
    if (characterNum === 1) {
      this.character1Lines.push('');
    } else if (characterNum === 2) {
      this.character2Lines.push('');
    }
    
    logNormal(`Added line to character ${characterNum}`);
  }
  
  /**
   * Remove dialogue line from character
   * @param {number} characterNum - Character number (1 or 2)
   * @param {number} index - Line index to remove
   */
  removeLine(characterNum, index) {
    if (characterNum === 1) {
      if (index >= 0 && index < this.character1Lines.length) {
        this.character1Lines.splice(index, 1);
        logNormal(`Removed line ${index} from character 1`);
      }
    } else if (characterNum === 2) {
      if (index >= 0 && index < this.character2Lines.length) {
        this.character2Lines.splice(index, 1);
        logNormal(`Removed line ${index} from character 2`);
      }
    }
    
    // Clear selection if removed line was selected
    if (this.selectedCharacter === characterNum && this.selectedLineIndex === index) {
      this.clearSelection();
    }
  }
  
  /**
   * Select dialogue line
   * @param {number} characterNum - Character number (1 or 2)
   * @param {number} index - Line index
   */
  selectLine(characterNum, index) {
    this.selectedCharacter = characterNum;
    this.selectedLineIndex = index;
    logNormal(`Selected line ${index} from character ${characterNum}`);
  }
  
  /**
   * Clear line selection
   */
  clearSelection() {
    this.selectedCharacter = null;
    this.selectedLineIndex = null;
  }
  
  /**
   * Get dialogue data for export to event
   * @returns {Object} Dialogue data structure
   */
  getDialogueData() {
    const lines = [];
    
    // Interleave character lines (alternate between characters)
    const maxLength = Math.max(this.character1Lines.length, this.character2Lines.length);
    
    for (let i = 0; i < maxLength; i++) {
      if (i < this.character1Lines.length) {
        lines.push({
          character: 1,
          text: this.character1Lines[i]
        });
      }
      
      if (i < this.character2Lines.length) {
        lines.push({
          character: 2,
          text: this.character2Lines[i]
        });
      }
    }
    
    return { lines };
  }
  
  /**
   * Close panel
   */
  close() {
    this.isVisible = false;
    logNormal('Dialog creation panel closed');
  }
}

// Export for Node.js (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DialogCreationPanel;
}

// Export for browser (global)
if (typeof window !== 'undefined') {
  window.DialogCreationPanel = DialogCreationPanel;
}

// Export for Node.js global (testing compatibility)
if (typeof global !== 'undefined') {
  global.DialogCreationPanel = DialogCreationPanel;
}

/**
 * DialogueCreationPanel
 * 
 * Interactive panel for creating sequential dialogue lines with per-line effects.
 * Features:
 * - Sequential order tracking (maintains button-press order)
 * - Staggered visual layout (left for Character 1, right for Character 2)
 * - Scrollable viewport with custom scrollbar
 * - Expandable dialogue lines (40px collapsed, 100px expanded)
 * - Per-line text effect controls (typewriter, fade, instant)
 * - Per-line scroll speed slider
 * - Inline text editing (keyboard input)
 * - Default settings controls (apply to new lines)
 * - Data export with metadata
 */

class DialogueCreationPanel {
  constructor(x, y, width, height, eventData, eventManager) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.eventData = eventData;
    this.eventManager = eventManager;
    
    this.title = 'Dialogue Creation';
    this.isVisible = true;
    
    // Sequential dialogue lines array
    this.dialogueLines = [];
    
    // Expansion and editing state
    this.expandedLineIndex = null;
    this.isEditingText = false;
    this.editBuffer = '';
    this.cursorPosition = 0;
    this.cursorVisible = false;
    this.cursorBlinkTimer = 0;
    
    // Default settings for new lines
    this.defaultScrollSpeed = 50;
    this.defaultTextEffect = 'typewriter';
    
    // Scroll state
    this.scrollOffset = 0;
    this.maxScrollOffset = 0;
    this.scrollbarDragging = false;
    this.scrollbarDragOffset = 0;
    
    // UI dimensions
    this.titleBarHeight = 40;
    this.defaultControlsHeight = 80;
    this.buttonAreaHeight = 80; // Increased from 60 to give more space
    this.viewportPadding = 10;
    this.collapsedLineHeight = 40;
    this.expandedLineHeight = 100;
    this.scrollbarWidth = 12;
    this.lineSpacing = 5;
    
    // Colors
    this.backgroundColor = '#2a2a2a';
    this.titleBarColor = '#1e1e1e';
    this.viewportColor = '#222222';
    this.buttonColor = '#3a3a3a';
    this.buttonHoverColor = '#4a4a4a';
    this.buttonActiveColor = '#5a8fd4';
    this.scrollbarTrackColor = '#1e1e1e';
    this.scrollbarThumbColor = '#4a4a4a';
    this.lineColor1 = '#2d4a6b'; // Character 1
    this.lineColor2 = '#4a2d6b'; // Character 2
    this.textColor = '#e0e0e0';
    
    // Bounds storage for interaction
    this.addButton1Bounds = null;
    this.addButton2Bounds = null;
    this.removeButton1Bounds = null;
    this.removeButton2Bounds = null;
    this.saveButtonBounds = null;
    this.scrollSpeedSliderBounds = null;
    this.defaultEffectButtonBounds = [];
    this.scrollbarBounds = null;
    this.scrollbarThumbBounds = null;
    this.lineBounds = [];
    
    // Load existing dialogue data if present
    if (this.eventData.content && this.eventData.content.dialogueLines) {
      this.dialogueLines = JSON.parse(JSON.stringify(this.eventData.content.dialogueLines));
    }
  }
  
  // ==================== Core Rendering Methods ====================
  
  render() {
    if (!this.isVisible) return;
    
    push();
    
    // Panel background
    fill(this.backgroundColor);
    noStroke();
    rect(this.x, this.y, this.width, this.height, 5);
    
    // Render sections
    this._renderTitleBar();
    this._renderDefaultControls();
    this._renderScrollableDialogue();
    this._renderAddRemoveButtons();
    this._renderSaveButton();
    
    // Update cursor blink
    if (this.isEditingText) {
      this.cursorBlinkTimer += deltaTime;
      if (this.cursorBlinkTimer > 500) {
        this.cursorVisible = !this.cursorVisible;
        this.cursorBlinkTimer = 0;
      }
    }
    
    pop();
  }
  
  _renderTitleBar() {
    // Title bar background
    fill(this.titleBarColor);
    noStroke();
    rect(this.x, this.y, this.width, this.titleBarHeight, 5, 5, 0, 0);
    
    // Title text
    fill(this.textColor);
    textAlign(CENTER, CENTER);
    textSize(18);
    text(this.title, this.x + this.width / 2, this.y + this.titleBarHeight / 2);
  }
  
  _renderDefaultControls() {
    const startY = this.y + this.titleBarHeight + 10;
    const startX = this.x + 20;
    
    // Section label
    fill(this.textColor);
    textAlign(LEFT, TOP);
    textSize(14);
    text('Default Settings (applied to new lines):', startX, startY);
    
    // Default Scroll Speed label
    textSize(12);
    text('Default Scroll Speed:', startX, startY + 25);
    
    // Scroll speed slider
    const sliderX = startX + 150;
    const sliderY = startY + 25;
    const sliderWidth = 120;
    const sliderHeight = 10;
    
    this.scrollSpeedSliderBounds = {
      x: sliderX,
      y: sliderY,
      width: sliderWidth,
      height: sliderHeight
    };
    
    // Slider track
    fill('#1e1e1e');
    rect(sliderX, sliderY, sliderWidth, sliderHeight, 5);
    
    // Slider thumb
    const thumbPosition = ((this.defaultScrollSpeed - 10) / 90) * sliderWidth;
    fill(this.buttonActiveColor);
    circle(sliderX + thumbPosition, sliderY + sliderHeight / 2, 16);
    
    // Speed value display
    fill(this.textColor);
    textAlign(RIGHT, CENTER);
    text(`${this.defaultScrollSpeed}`, sliderX + sliderWidth + 40, sliderY + sliderHeight / 2);
    
    // Default Effect label
    textAlign(LEFT, TOP);
    text('Default Effect:', startX, startY + 50);
    
    // Effect buttons
    const btnY = startY + 50;
    const btnX = startX + 150;
    const btnWidth = 90;
    const btnHeight = 20;
    const btnSpacing = 5;
    
    const effects = ['typewriter', 'fade', 'instant'];
    const effectLabels = ['Typewriter', 'Fade', 'Instant'];
    this.defaultEffectButtonBounds = [];
    
    for (let i = 0; i < effects.length; i++) {
      const x = btnX + i * (btnWidth + btnSpacing);
      const isSelected = this.defaultTextEffect === effects[i];
      
      fill(isSelected ? this.buttonActiveColor : this.buttonColor);
      rect(x, btnY, btnWidth, btnHeight, 3);
      
      fill(this.textColor);
      textAlign(CENTER, CENTER);
      textSize(11);
      text(effectLabels[i], x + btnWidth / 2, btnY + btnHeight / 2);
      
      this.defaultEffectButtonBounds.push({
        x: x,
        y: btnY,
        width: btnWidth,
        height: btnHeight,
        effect: effects[i]
      });
    }
  }
  
  _renderScrollableDialogue() {
    const viewportX = this.x + this.viewportPadding;
    const viewportY = this.y + this.titleBarHeight + this.defaultControlsHeight;
    const viewportWidth = this.width - (this.viewportPadding * 2) - this.scrollbarWidth;
    const viewportHeight = this.height - this.titleBarHeight - this.defaultControlsHeight - this.buttonAreaHeight;
    
    // Viewport background
    fill(this.viewportColor);
    noStroke();
    rect(viewportX, viewportY, viewportWidth, viewportHeight);
    
    // Calculate content height
    let contentHeight = 0;
    for (let i = 0; i < this.dialogueLines.length; i++) {
      const lineHeight = (i === this.expandedLineIndex) ? this.expandedLineHeight : this.collapsedLineHeight;
      contentHeight += lineHeight + this.lineSpacing;
    }
    
    // Update max scroll offset
    this.maxScrollOffset = Math.max(0, contentHeight - viewportHeight);
    this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, this.maxScrollOffset));
    
    // Clip to viewport
    drawingContext.save();
    drawingContext.beginPath();
    drawingContext.rect(viewportX, viewportY, viewportWidth, viewportHeight);
    drawingContext.clip();
    
    // Render dialogue lines
    this._renderStaggeredDialogue(viewportX, viewportY, viewportWidth, viewportHeight);
    
    // Restore clipping
    drawingContext.restore();
    
    // Render scrollbar
    this._renderScrollbar(viewportX, viewportY, viewportWidth, viewportHeight);
  }
  
  _renderStaggeredDialogue(viewportX, viewportY, viewportWidth, viewportHeight) {
    this.lineBounds = [];
    let currentY = viewportY - this.scrollOffset;
    
    for (let i = 0; i < this.dialogueLines.length; i++) {
      const dialogueLine = this.dialogueLines[i];
      const isExpanded = (i === this.expandedLineIndex);
      const lineHeight = isExpanded ? this.expandedLineHeight : this.collapsedLineHeight;
      
      // Render line
      this._renderDialogueLine(dialogueLine, i, viewportX, currentY, viewportWidth, lineHeight, isExpanded);
      
      currentY += lineHeight + this.lineSpacing;
    }
  }
  
  _renderDialogueLine(dialogueLine, index, x, y, viewportWidth, lineHeight, isExpanded) {
    // Calculate staggered position
    const lineWidth = viewportWidth * 0.8;
    const lineX = (dialogueLine.character === 1) ? x + 10 : x + viewportWidth - lineWidth - 10;
    
    // Store bounds for interaction
    const bounds = {
      x: lineX,
      y: y,
      width: lineWidth,
      height: lineHeight,
      index: index,
      effectButtons: [],
      speedSlider: null
    };
    this.lineBounds.push(bounds);
    
    // Line background
    const bgColor = (dialogueLine.character === 1) ? this.lineColor1 : this.lineColor2;
    fill(bgColor);
    noStroke();
    rect(lineX, y, lineWidth, lineHeight, 5);
    
    // Character label
    fill(this.textColor);
    textAlign(LEFT, TOP);
    textSize(10);
    text(`Character ${dialogueLine.character}`, lineX + 5, y + 5);
    
    // Text display
    textSize(12);
    const displayText = this.isEditingText && index === this.expandedLineIndex 
      ? this.editBuffer 
      : dialogueLine.text;
    const wrappedText = this._wrapText(displayText, lineWidth - 20);
    
    if (isExpanded) {
      text(wrappedText, lineX + 10, y + 20);
      
      // Cursor rendering
      if (this.isEditingText && this.cursorVisible) {
        const cursorX = lineX + 10 + textWidth(this.editBuffer);
        const cursorY = y + 20;
        stroke(this.textColor);
        strokeWeight(2);
        // Use window.line to avoid variable name conflict
        if (typeof window !== 'undefined' && window.line) {
          window.line(cursorX, cursorY, cursorX, cursorY + 14);
        }
        noStroke();
      }
      
      // Per-line effect controls
      this._renderLineEffectControls(dialogueLine, index, lineX, y, lineWidth, lineHeight, bounds);
    } else {
      // Collapsed - show truncated text
      const singleLine = wrappedText.split('\n')[0];
      const truncated = singleLine.length > 40 ? singleLine.substring(0, 37) + '...' : singleLine;
      text(truncated, lineX + 10, y + 20);
      
      // Effect indicator (emoji)
      textAlign(RIGHT, TOP);
      const effectIcon = dialogueLine.effect === 'typewriter' ? '⌨' : (dialogueLine.effect === 'fade' ? '✨' : '⚡');
      text(effectIcon, lineX + lineWidth - 10, y + 5);
    }
  }
  
  _renderLineEffectControls(dialogueLine, index, lineX, lineY, lineWidth, lineHeight, bounds) {
    const controlsY = lineY + lineHeight - 35;
    const controlsStartX = lineX + 10;
    
    // Effect label
    fill(this.textColor);
    textAlign(LEFT, TOP);
    textSize(10);
    text('Effect:', controlsStartX, controlsY);
    
    // Effect buttons
    const btnWidth = 35;
    const btnHeight = 20;
    const btnSpacing = 3;
    const btnStartX = controlsStartX + 45;
    
    const effects = ['typewriter', 'fade', 'instant'];
    const effectIcons = ['⌨', '✨', '⚡'];
    
    for (let i = 0; i < effects.length; i++) {
      const x = btnStartX + i * (btnWidth + btnSpacing);
      const isSelected = dialogueLine.effect === effects[i];
      
      fill(isSelected ? this.buttonActiveColor : this.buttonColor);
      rect(x, controlsY, btnWidth, btnHeight, 3);
      
      fill(this.textColor);
      textAlign(CENTER, CENTER);
      textSize(14);
      text(effectIcons[i], x + btnWidth / 2, controlsY + btnHeight / 2);
      
      bounds.effectButtons.push({
        x: x,
        y: controlsY,
        width: btnWidth,
        height: btnHeight,
        effect: effects[i]
      });
    }
    
    // Speed label
    fill(this.textColor);
    textAlign(LEFT, CENTER);
    textSize(10);
    const speedLabelX = btnStartX + 130;
    text('Speed:', speedLabelX, controlsY + btnHeight / 2);
    
    // Speed slider
    const sliderX = speedLabelX + 45;
    const sliderY = controlsY + 5;
    const sliderWidth = 60;
    const sliderHeight = 10;
    
    bounds.speedSlider = {
      x: sliderX,
      y: sliderY,
      width: sliderWidth,
      height: sliderHeight
    };
    
    // Slider track
    fill('#1e1e1e');
    rect(sliderX, sliderY, sliderWidth, sliderHeight, 5);
    
    // Slider thumb
    const thumbPosition = ((dialogueLine.scrollSpeed - 10) / 90) * sliderWidth;
    fill(this.buttonActiveColor);
    circle(sliderX + thumbPosition, sliderY + sliderHeight / 2, 12);
    
    // Speed value
    fill(this.textColor);
    textAlign(RIGHT, CENTER);
    textSize(9);
    text(`${dialogueLine.scrollSpeed}`, sliderX + sliderWidth + 25, sliderY + sliderHeight / 2);
  }
  
  _renderAddRemoveButtons() {
    const btnWidth = 100;
    const btnHeight = 30;
    const btnSpacing = 8;
    // Position buttons INSIDE the panel: 10px margin from bottom
    const btnY = this.y + this.height - btnHeight - 10;
    
    // Calculate total width of 4 buttons
    const totalWidth = btnWidth * 4 + btnSpacing * 3;
    const startX = this.x + (this.width - totalWidth) / 2;
    
    // Button 1: + Char 1
    const btn1X = startX;
    this.addButton1Bounds = { x: btn1X, y: btnY, width: btnWidth, height: btnHeight };
    fill(this.buttonColor);
    rect(btn1X, btnY, btnWidth, btnHeight, 5);
    fill(this.textColor);
    textAlign(CENTER, CENTER);
    textSize(12);
    text('+ Char 1', btn1X + btnWidth / 2, btnY + btnHeight / 2);
    
    // Button 2: − Char 1
    const btn2X = btn1X + btnWidth + btnSpacing;
    this.removeButton1Bounds = { x: btn2X, y: btnY, width: btnWidth, height: btnHeight };
    fill(this.buttonColor);
    rect(btn2X, btnY, btnWidth, btnHeight, 5);
    fill(this.textColor);
    text('− Char 1', btn2X + btnWidth / 2, btnY + btnHeight / 2);
    
    // Button 3: + Char 2
    const btn3X = btn2X + btnWidth + btnSpacing;
    this.addButton2Bounds = { x: btn3X, y: btnY, width: btnWidth, height: btnHeight };
    fill(this.buttonColor);
    rect(btn3X, btnY, btnWidth, btnHeight, 5);
    fill(this.textColor);
    text('+ Char 2', btn3X + btnWidth / 2, btnY + btnHeight / 2);
    
    // Button 4: − Char 2
    const btn4X = btn3X + btnWidth + btnSpacing;
    this.removeButton2Bounds = { x: btn4X, y: btnY, width: btnWidth, height: btnHeight };
    fill(this.buttonColor);
    rect(btn4X, btnY, btnWidth, btnHeight, 5);
    fill(this.textColor);
    text('− Char 2', btn4X + btnWidth / 2, btnY + btnHeight / 2);
  }
  
  _renderSaveButton() {
    const btnWidth = 150;
    const btnHeight = 30;
    const btnX = this.x + (this.width - btnWidth) / 2; // Center horizontally
    // Position ABOVE character buttons: char buttons are (height - 40), save needs gap of 5px
    const btnY = this.y + this.height - 75; // 30 (char buttons) + 5 (gap) + 30 (save button) + 10 (bottom margin)
    
    this.saveButtonBounds = { x: btnX, y: btnY, width: btnWidth, height: btnHeight };
    
    fill('#2a5a2a'); // Green tint
    rect(btnX, btnY, btnWidth, btnHeight, 5);
    
    fill(this.textColor);
    textAlign(CENTER, CENTER);
    textSize(12);
    text('Save Dialogue', btnX + btnWidth / 2, btnY + btnHeight / 2);
  }
  
  _renderScrollbar(viewportX, viewportY, viewportWidth, viewportHeight) {
    if (this.maxScrollOffset === 0) return;
    
    const scrollbarX = viewportX + viewportWidth + 5;
    const scrollbarY = viewportY;
    const scrollbarHeight = viewportHeight;
    
    this.scrollbarBounds = {
      x: scrollbarX,
      y: scrollbarY,
      width: this.scrollbarWidth,
      height: scrollbarHeight
    };
    
    // Track
    fill(this.scrollbarTrackColor);
    rect(scrollbarX, scrollbarY, this.scrollbarWidth, scrollbarHeight, 6);
    
    // Thumb
    const thumbHeight = Math.max(30, (viewportHeight / (viewportHeight + this.maxScrollOffset)) * scrollbarHeight);
    const thumbY = scrollbarY + (this.scrollOffset / this.maxScrollOffset) * (scrollbarHeight - thumbHeight);
    
    this.scrollbarThumbBounds = {
      x: scrollbarX,
      y: thumbY,
      width: this.scrollbarWidth,
      height: thumbHeight
    };
    
    fill(this.scrollbarThumbColor);
    rect(scrollbarX, thumbY, this.scrollbarWidth, thumbHeight, 6);
  }
  
  // ==================== Interaction Methods ====================
  
  handleClick(x, y) {
    if (!this._pointInBounds(x, y, { x: this.x, y: this.y, width: this.width, height: this.height })) {
      return false;
    }
    
    // Check add/remove buttons
    if (this._pointInBounds(x, y, this.addButton1Bounds)) {
      if (typeof console !== 'undefined') console.log('✅ Added Character 1 line');
      this.addLine(1);
      return true;
    }
    if (this._pointInBounds(x, y, this.addButton2Bounds)) {
      if (typeof console !== 'undefined') console.log('✅ Added Character 2 line');
      this.addLine(2);
      return true;
    }
    if (this._pointInBounds(x, y, this.removeButton1Bounds)) {
      if (typeof console !== 'undefined') console.log('✅ Removed Character 1 line');
      this.removeLastLine(1);
      return true;
    }
    if (this._pointInBounds(x, y, this.removeButton2Bounds)) {
      if (typeof console !== 'undefined') console.log('✅ Removed Character 2 line');
      this.removeLastLine(2);
      return true;
    }
    
    // Check save button
    if (this._pointInBounds(x, y, this.saveButtonBounds)) {
      if (typeof console !== 'undefined') console.log('✅ Dialogue saved!');
      this.saveDialogue();
      return true;
    }
    
    // Check default speed slider
    if (this._pointInBounds(x, y, this.scrollSpeedSliderBounds)) {
      const relativeX = x - this.scrollSpeedSliderBounds.x;
      const percentage = relativeX / this.scrollSpeedSliderBounds.width;
      this.defaultScrollSpeed = Math.round(10 + percentage * 90);
      this.defaultScrollSpeed = Math.max(10, Math.min(100, this.defaultScrollSpeed));
      return true;
    }
    
    // Check default effect buttons
    for (const btn of this.defaultEffectButtonBounds) {
      if (this._pointInBounds(x, y, btn)) {
        this.defaultTextEffect = btn.effect;
        return true;
      }
    }
    
    // Check scrollbar
    if (this.scrollbarThumbBounds && this._pointInBounds(x, y, this.scrollbarThumbBounds)) {
      this.scrollbarDragging = true;
      this.scrollbarDragOffset = y - this.scrollbarThumbBounds.y;
      return true;
    }
    if (this.scrollbarBounds && this._pointInBounds(x, y, this.scrollbarBounds)) {
      // Jump to clicked position
      const relativeY = y - this.scrollbarBounds.y;
      const percentage = relativeY / this.scrollbarBounds.height;
      this.scrollOffset = percentage * this.maxScrollOffset;
      this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, this.maxScrollOffset));
      return true;
    }
    
    // Check dialogue lines
    for (let i = 0; i < this.lineBounds.length; i++) {
      const bounds = this.lineBounds[i];
      
      // Check per-line effect buttons (if expanded)
      if (bounds.effectButtons.length > 0) {
        for (const btn of bounds.effectButtons) {
          if (this._pointInBounds(x, y, btn)) {
            this.dialogueLines[bounds.index].effect = btn.effect;
            return true;
          }
        }
      }
      
      // Check per-line speed slider (if expanded)
      if (bounds.speedSlider && this._pointInBounds(x, y, bounds.speedSlider)) {
        const relativeX = x - bounds.speedSlider.x;
        const percentage = relativeX / bounds.speedSlider.width;
        const newSpeed = Math.round(10 + percentage * 90);
        this.dialogueLines[bounds.index].scrollSpeed = Math.max(10, Math.min(100, newSpeed));
        return true;
      }
      
      // Check line click (expand/collapse or toggle edit)
      if (this._pointInBounds(x, y, bounds)) {
        this.expandLine(bounds.index);
        return true;
      }
    }
    
    return false;
  }
  
  handleMouseDrag(x, y) {
    if (this.scrollbarDragging && this.scrollbarBounds) {
      const newThumbY = y - this.scrollbarDragOffset;
      const relativeY = newThumbY - this.scrollbarBounds.y;
      const percentage = relativeY / (this.scrollbarBounds.height - this.scrollbarThumbBounds.height);
      this.scrollOffset = percentage * this.maxScrollOffset;
      this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, this.maxScrollOffset));
    }
  }
  
  handleMouseRelease() {
    this.scrollbarDragging = false;
  }
  
  handleMouseWheel(delta) {
    if (this.maxScrollOffset === 0) return;
    
    const scrollAmount = delta * 3;
    this.scrollOffset += scrollAmount;
    this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, this.maxScrollOffset));
  }
  
  handleKeyPress(key) {
    if (!this.isEditingText) return;
    
    if (key === 'Enter') {
      this.saveEditedText();
      return;
    }
    
    if (key === 'Escape') {
      this.isEditingText = false;
      this.expandedLineIndex = null;
      this.editBuffer = '';
      return;
    }
    
    if (key === 'Backspace') {
      this.editBuffer = this.editBuffer.slice(0, -1);
      return;
    }
    
    // Printable characters
    if (key.length === 1) {
      this.editBuffer += key;
    }
  }
  
  // ==================== Data Operations ====================
  
  addLine(character) {
    const newLine = {
      character: character,
      text: `Sample text for Character ${character}`,
      effect: this.defaultTextEffect,
      scrollSpeed: this.defaultScrollSpeed
    };
    this.dialogueLines.push(newLine);
  }
  
  removeLastLine(character) {
    // Find last occurrence of character
    for (let i = this.dialogueLines.length - 1; i >= 0; i--) {
      if (this.dialogueLines[i].character === character) {
        // Clear expanded state if removing expanded line
        if (this.expandedLineIndex === i) {
          this.expandedLineIndex = null;
          this.isEditingText = false;
        } else if (this.expandedLineIndex !== null && this.expandedLineIndex > i) {
          // Adjust expanded index if after removed line
          this.expandedLineIndex--;
        }
        
        this.dialogueLines.splice(i, 1);
        return;
      }
    }
  }
  
  expandLine(index) {
    if (this.expandedLineIndex === index) {
      // Toggle edit mode if clicking same line
      this.isEditingText = !this.isEditingText;
    } else {
      // Switch to different line
      this.expandedLineIndex = index;
      this.isEditingText = true;
      this.editBuffer = this.dialogueLines[index].text;
    }
    
    if (!this.isEditingText) {
      this.expandedLineIndex = null;
    }
  }
  
  saveEditedText() {
    if (this.expandedLineIndex !== null) {
      this.dialogueLines[this.expandedLineIndex].text = this.editBuffer;
    }
    this.isEditingText = false;
    this.expandedLineIndex = null;
    this.editBuffer = '';
  }
  
  saveDialogue() {
    const exportData = {
      dialogueLines: this.dialogueLines,
      metadata: {
        totalLines: this.dialogueLines.length,
        character1Count: this.dialogueLines.filter(l => l.character === 1).length,
        character2Count: this.dialogueLines.filter(l => l.character === 2).length
      }
    };
    
    // Update event data
    this.eventData.content = exportData;
    
    // Register/update via event manager (uses registerEvent which handles both)
    if (this.eventManager) {
      this.eventManager.registerEvent(this.eventData);
    }
    
    console.log('Dialogue saved:', exportData);
    return exportData;
  }
  
  // ==================== Helper Methods ====================
  
  _wrapText(txt, maxWidth) {
    const words = txt.split(' ');
    let lines = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      if (textWidth(testLine) > maxWidth) {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    
    return lines.join('\n');
  }
  
  _pointInBounds(x, y, bounds) {
    if (!bounds) return false;
    return x >= bounds.x && x <= bounds.x + bounds.width &&
           y >= bounds.y && y <= bounds.y + bounds.height;
  }
}

// Global export
if (typeof window !== 'undefined') window.DialogueCreationPanel = DialogueCreationPanel;
if (typeof module !== 'undefined') module.exports = DialogueCreationPanel;

/**
 * SettingsPanel - Modal settings panel for editor preferences
 * 
 * Features:
 * - Tabbed interface (General, Camera, Keybindings)
 * - Sliders for numeric settings (pan speed, zoom speed)
 * - Toggles for boolean settings (auto-save, theme)
 * - Reset to defaults button
 * - Persistent settings via SettingsManager
 * 
 * Usage:
 *   const panel = new SettingsPanel();
 *   panel.open();
 *   panel.render();
 */

class SettingsPanel {
  constructor() {
    this.visible = false;
    this.activeTab = 'General';
    this.tabs = ['General', 'Camera', 'Keybindings'];
    
    // Panel dimensions and position (centered on screen)
    this.width = 600;
    this.height = 400;
    this.x = 100; // Will be centered dynamically
    this.y = 100;
    
    // UI element dimensions
    this.tabHeight = 40;
    this.tabWidth = this.width / this.tabs.length;
    this.padding = 20;
    this.sliderWidth = 300;
    this.sliderHeight = 20;
    
    // Slider states
    this._draggingSlider = null;
    
    // Button dimensions
    this.buttonWidth = 120;
    this.buttonHeight = 35;
    
    // Load settings manager
    if (typeof SettingsManager !== 'undefined') {
      this._settingsManager = SettingsManager.getInstance();
      this._loadSettings();
    }
  }
  
  /**
   * Load current settings from SettingsManager
   * @private
   */
  _loadSettings() {
    if (!this._settingsManager) return;
    
    // Cache frequently accessed settings
    this._cachedSettings = {
      panSpeed: this._settingsManager.get('camera.panSpeed', 1.0),
      zoomSpeed: this._settingsManager.get('camera.zoomSpeed', 1.1),
      autoSave: this._settingsManager.get('editor.autoSave', false),
      theme: this._settingsManager.get('editor.theme', 'dark')
    };
  }
  
  /**
   * Open the settings panel
   */
  open() {
    this.visible = true;
    this.activeTab = 'General';
    
    // Center panel on screen
    if (typeof width !== 'undefined' && typeof height !== 'undefined') {
      this.x = (width - this.width) / 2;
      this.y = (height - this.height) / 2;
    }
    
    // Reload settings
    this._loadSettings();
    
    // Trigger redraw if available
    if (typeof redraw === 'function') {
      redraw();
    }
  }
  
  /**
   * Close the settings panel
   */
  close() {
    this.visible = false;
    this._draggingSlider = null;
    
    if (typeof redraw === 'function') {
      redraw();
    }
  }
  
  /**
   * Switch to a different tab
   * @param {string} tabName - Name of tab to switch to
   */
  switchTab(tabName) {
    if (this.tabs.includes(tabName)) {
      this.activeTab = tabName;
      
      if (typeof redraw === 'function') {
        redraw();
      }
    }
  }
  
  /**
   * Render the settings panel
   */
  render() {
    if (!this.visible) return;
    
    push();
    
    // Semi-transparent overlay
    fill(0, 0, 0, 150);
    noStroke();
    rect(0, 0, width || 800, height || 600);
    
    // Panel background
    fill(40, 40, 45);
    stroke(100, 100, 110);
    rect(this.x, this.y, this.width, this.height, 10);
    
    // Render tab bar
    this._renderTabBar();
    
    // Render active tab content
    const contentY = this.y + this.tabHeight + this.padding;
    const contentHeight = this.height - this.tabHeight - this.padding * 2 - this.buttonHeight - this.padding;
    
    if (this.activeTab === 'General') {
      this._renderGeneralTab(contentY, contentHeight);
    } else if (this.activeTab === 'Camera') {
      this._renderCameraTab(contentY, contentHeight);
    } else if (this.activeTab === 'Keybindings') {
      this._renderKeybindingsTab(contentY, contentHeight);
    }
    
    // Render bottom buttons
    this._renderBottomButtons();
    
    pop();
  }
  
  /**
   * Render tab bar
   * @private
   */
  _renderTabBar() {
    const tabY = this.y;
    
    for (let i = 0; i < this.tabs.length; i++) {
      const tabName = this.tabs[i];
      const tabX = this.x + i * this.tabWidth;
      const isActive = tabName === this.activeTab;
      
      // Tab background
      fill(isActive ? 60 : 50, isActive ? 60 : 50, isActive ? 70 : 55);
      stroke(100, 100, 110);
      rect(tabX, tabY, this.tabWidth, this.tabHeight);
      
      // Tab label
      fill(isActive ? 255 : 180);
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(14);
      text(tabName, tabX + this.tabWidth / 2, tabY + this.tabHeight / 2);
    }
  }
  
  /**
   * Render General tab content
   * @private
   */
  _renderGeneralTab(contentY, contentHeight) {
    const startY = contentY + 20;
    let currentY = startY;
    
    // Auto-Save toggle
    fill(220);
    noStroke();
    textAlign(LEFT, CENTER);
    textSize(14);
    text('Auto-Save:', this.x + this.padding, currentY);
    
    this._renderToggle('editor.autoSave', 
      this.x + this.width - this.padding - 60, 
      currentY - 10);
    
    currentY += 50;
    
    // Theme toggle
    text('Theme (Dark/Light):', this.x + this.padding, currentY);
    this._renderToggle('editor.theme', 
      this.x + this.width - this.padding - 60, 
      currentY - 10);
  }
  
  /**
   * Render Camera tab content
   * @private
   */
  _renderCameraTab(contentY, contentHeight) {
    const startY = contentY + 20;
    let currentY = startY;
    
    // Pan Speed slider
    fill(220);
    noStroke();
    textAlign(LEFT, CENTER);
    textSize(14);
    const panSpeed = this._settingsManager ? 
      this._settingsManager.get('camera.panSpeed', 1.0) : 1.0;
    text(`Pan Speed: ${panSpeed.toFixed(2)}x`, this.x + this.padding, currentY);
    
    currentY += 30;
    this._renderSlider('panSpeed', 
      this.x + this.padding, 
      currentY, 
      panSpeed, 
      0.5, 
      3.0);
    
    currentY += 60;
    
    // Zoom Speed slider
    const zoomSpeed = this._settingsManager ? 
      this._settingsManager.get('camera.zoomSpeed', 1.1) : 1.1;
    fill(220);
    text(`Zoom Speed: ${zoomSpeed.toFixed(2)}x`, this.x + this.padding, currentY);
    
    currentY += 30;
    this._renderSlider('zoomSpeed', 
      this.x + this.padding, 
      currentY, 
      zoomSpeed, 
      1.05, 
      1.5);
  }
  
  /**
   * Render Keybindings tab content
   * @private
   */
  _renderKeybindingsTab(contentY, contentHeight) {
    const startY = contentY + 20;
    let currentY = startY;
    
    // Display keybindings reference
    fill(220);
    noStroke();
    textAlign(LEFT, TOP);
    textSize(14);
    
    const keybindings = [
      { label: 'Save:', key: 'Ctrl+S' },
      { label: 'Load:', key: 'Ctrl+O' },
      { label: 'Export:', key: 'Ctrl+E' },
      { label: 'Undo:', key: 'Ctrl+Z' },
      { label: 'Redo:', key: 'Ctrl+Y' }
    ];
    
    keybindings.forEach(kb => {
      text(kb.label, this.x + this.padding, currentY);
      textAlign(RIGHT, TOP);
      text(kb.key, this.x + this.width - this.padding, currentY);
      textAlign(LEFT, TOP);
      currentY += 30;
    });
  }
  
  /**
   * Render a slider control
   * @private
   */
  _renderSlider(id, x, y, value, min, max) {
    // Slider background
    stroke(80, 80, 90);
    strokeWeight(2);
    line(x, y, x + this.sliderWidth, y);
    
    // Slider handle
    const handleX = x + ((value - min) / (max - min)) * this.sliderWidth;
    fill(100, 150, 255);
    noStroke();
    circle(handleX, y, 16);
    
    // Store slider data for hit testing
    if (!this._sliders) this._sliders = {};
    this._sliders[id] = { x, y, width: this.sliderWidth, min, max, value };
  }
  
  /**
   * Render a toggle control
   * @private
   */
  _renderToggle(settingKey, x, y) {
    const value = this._settingsManager ? 
      this._settingsManager.get(settingKey, false) : false;
    
    // Convert theme to boolean if needed
    const isOn = settingKey === 'editor.theme' ? value === 'light' : value;
    
    // Toggle background
    fill(isOn ? 100 : 60, isOn ? 150 : 60, isOn ? 255 : 60);
    noStroke();
    rect(x, y, 50, 25, 12);
    
    // Toggle handle
    fill(255);
    const handleX = isOn ? x + 30 : x + 5;
    circle(handleX, y + 12, 18);
    
    // Store toggle data for hit testing
    if (!this._toggles) this._toggles = {};
    this._toggles[settingKey] = { x, y, width: 50, height: 25 };
  }
  
  /**
   * Render bottom buttons (Close, Reset to Defaults)
   * @private
   */
  _renderBottomButtons() {
    const buttonY = this.y + this.height - this.padding - this.buttonHeight;
    const closeButtonX = this.x + this.width - this.padding - this.buttonWidth;
    const resetButtonX = closeButtonX - this.buttonWidth - 10;
    
    // Reset to Defaults button
    fill(80, 80, 90);
    stroke(120, 120, 130);
    rect(resetButtonX, buttonY, this.buttonWidth, this.buttonHeight, 5);
    
    fill(220);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(12);
    text('Reset to Defaults', resetButtonX + this.buttonWidth / 2, buttonY + this.buttonHeight / 2);
    
    // Close button
    fill(255, 100, 100);
    stroke(255, 150, 150);
    rect(closeButtonX, buttonY, this.buttonWidth, this.buttonHeight, 5);
    
    fill(255);
    noStroke();
    text('Close', closeButtonX + this.buttonWidth / 2, buttonY + this.buttonHeight / 2);
    
    // Store button data for hit testing
    if (!this._buttons) this._buttons = {};
    this._buttons.close = { x: closeButtonX, y: buttonY, width: this.buttonWidth, height: this.buttonHeight };
    this._buttons.reset = { x: resetButtonX, y: buttonY, width: this.buttonWidth, height: this.buttonHeight };
  }
  
  /**
   * Handle click events
   * @param {number} x - Click X coordinate
   * @param {number} y - Click Y coordinate
   */
  handleClick(x, y) {
    if (!this.visible) return;
    
    // Check tab clicks
    if (y >= this.y && y <= this.y + this.tabHeight) {
      const tabIndex = Math.floor((x - this.x) / this.tabWidth);
      if (tabIndex >= 0 && tabIndex < this.tabs.length) {
        this.switchTab(this.tabs[tabIndex]);
        return;
      }
    }
    
    // Check button clicks
    if (this._buttons) {
      if (this._hitTestRect(x, y, this._buttons.close)) {
        this.close();
        return;
      }
      if (this._hitTestRect(x, y, this._buttons.reset)) {
        this.handleResetClick();
        return;
      }
    }
    
    // Check toggle clicks
    if (this._toggles) {
      for (const [settingKey, toggle] of Object.entries(this._toggles)) {
        if (this._hitTestRect(x, y, toggle)) {
          this.handleToggle(settingKey);
          return;
        }
      }
    }
    
    // Check slider clicks (start dragging)
    if (this._sliders) {
      for (const [id, slider] of Object.entries(this._sliders)) {
        if (this._hitTestSlider(x, y, slider)) {
          this._draggingSlider = id;
          this.handleSliderDrag(id, { x, y });
          return;
        }
      }
    }
  }
  
  /**
   * Handle mouse drag for sliders
   */
  handleMouseDrag(x, y) {
    if (this._draggingSlider && this._sliders) {
      this.handleSliderDrag(this._draggingSlider, { x, y });
    }
  }
  
  /**
   * Handle mouse release (stop dragging)
   */
  handleMouseRelease() {
    this._draggingSlider = null;
  }
  
  /**
   * Handle slider drag
   * @param {string} id - Slider ID
   * @param {Object} event - Event object with x, y coordinates
   */
  handleSliderDrag(id, event) {
    if (!this._sliders || !this._sliders[id]) return;
    
    const slider = this._sliders[id];
    const localX = event.x - slider.x;
    const percent = constrain(localX / slider.width, 0, 1);
    const newValue = slider.min + percent * (slider.max - slider.min);
    
    // Update setting
    if (this._settingsManager) {
      const settingKey = id === 'panSpeed' ? 'camera.panSpeed' : 'camera.zoomSpeed';
      this._settingsManager.set(settingKey, newValue);
      
      // Update cached value
      if (this._cachedSettings) {
        this._cachedSettings[id] = newValue;
      }
      
      if (typeof redraw === 'function') {
        redraw();
      }
    }
  }
  
  /**
   * Handle toggle click
   * @param {string} settingKey - Setting key to toggle
   */
  handleToggle(settingKey) {
    if (!this._settingsManager) return;
    
    const currentValue = this._settingsManager.get(settingKey, false);
    let newValue;
    
    if (settingKey === 'editor.theme') {
      // Toggle between 'dark' and 'light'
      newValue = currentValue === 'dark' ? 'light' : 'dark';
    } else {
      // Boolean toggle
      newValue = !currentValue;
    }
    
    this._settingsManager.set(settingKey, newValue);
    
    // Update cached value
    if (this._cachedSettings) {
      const cacheKey = settingKey.split('.')[1];
      this._cachedSettings[cacheKey] = newValue;
    }
    
    if (typeof redraw === 'function') {
      redraw();
    }
  }
  
  /**
   * Handle reset to defaults click
   */
  handleResetClick() {
    if (this._settingsManager) {
      this._settingsManager.resetToDefaults();
      this._loadSettings();
      
      if (typeof redraw === 'function') {
        redraw();
      }
    }
  }
  
  /**
   * Check if point is inside panel
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {boolean}
   */
  containsPoint(x, y) {
    return this.visible && 
           x >= this.x && 
           x <= this.x + this.width &&
           y >= this.y && 
           y <= this.y + this.height;
  }
  
  /**
   * Hit test for rectangle
   * @private
   */
  _hitTestRect(x, y, rect) {
    return x >= rect.x && 
           x <= rect.x + rect.width &&
           y >= rect.y && 
           y <= rect.y + rect.height;
  }
  
  /**
   * Hit test for slider
   * @private
   */
  _hitTestSlider(x, y, slider) {
    return x >= slider.x && 
           x <= slider.x + slider.width &&
           y >= slider.y - 10 && 
           y <= slider.y + 10;
  }
}

// Export for Node.js (tests)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SettingsPanel;
}

// Export for browser
if (typeof window !== 'undefined') {
  window.SettingsPanel = SettingsPanel;
}

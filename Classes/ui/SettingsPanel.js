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
    
    // Button dimensions
    this.buttonWidth = 120;
    this.buttonHeight = 35;
    
    // Load settings manager
    if (typeof SettingsManager !== 'undefined') {
      this._settingsManager = SettingsManager.getInstance();
      this._loadSettings();
    }
    
    // Initialize UI components (will be positioned dynamically)
    this._initializeComponents();
  }
  
  /**
   * Initialize UI component instances (Toggle, Slider)
   * @private
   */
  _initializeComponents() {
    this._components = {};
    
    // Auto-save toggle (General tab)
    if (typeof Toggle !== 'undefined') {
      const autoSaveValue = this._settingsManager ? 
        this._settingsManager.get('editor.autoSave', false) : false;
      this._components.autoSaveToggle = new Toggle(0, 0, autoSaveValue);
    }
    
    // Pan speed slider (Camera tab)
    if (typeof Slider !== 'undefined') {
      const panSpeed = this._settingsManager ? 
        this._settingsManager.get('camera.panSpeed', 1.0) : 1.0;
      this._components.panSpeedSlider = new Slider(
        0, 0, this.sliderWidth, 0.5, 3.0, panSpeed,
        (value) => this._handleSliderChange('camera.panSpeed', value)
      );
    }
    
    // Zoom speed slider (Camera tab)
    if (typeof Slider !== 'undefined') {
      const zoomSpeed = this._settingsManager ? 
        this._settingsManager.get('camera.zoomSpeed', 1.1) : 1.1;
      this._components.zoomSpeedSlider = new Slider(
        0, 0, this.sliderWidth, 1.05, 1.5, zoomSpeed,
        (value) => this._handleSliderChange('camera.zoomSpeed', value)
      );
    }
  }
  
  /**
   * Load current settings from SettingsManager and update components
   * @private
   */
  _loadSettings() {
    if (!this._settingsManager) return;
    
    // Cache frequently accessed settings
    this._cachedSettings = {
      panSpeed: this._settingsManager.get('camera.panSpeed', 1.0),
      zoomSpeed: this._settingsManager.get('camera.zoomSpeed', 1.1),
      autoSave: this._settingsManager.get('editor.autoSave', false)
    };
    
    // Update component values if they exist
    if (this._components) {
      if (this._components.autoSaveToggle) {
        this._components.autoSaveToggle.setValue(this._cachedSettings.autoSave);
      }
      if (this._components.panSpeedSlider) {
        this._components.panSpeedSlider.setValue(this._cachedSettings.panSpeed);
      }
      if (this._components.zoomSpeedSlider) {
        this._components.zoomSpeedSlider.setValue(this._cachedSettings.zoomSpeed);
      }
    }
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
    
    // Render toggle component
    if (this._components.autoSaveToggle) {
      this._components.autoSaveToggle.x = this.x + this.width - this.padding - 60;
      this._components.autoSaveToggle.y = currentY - 10;
      this._components.autoSaveToggle.render();
    }
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
    // Render pan speed slider component
    if (this._components.panSpeedSlider) {
      this._components.panSpeedSlider.x = this.x + this.padding;
      this._components.panSpeedSlider.y = currentY;
      this._components.panSpeedSlider.render();
    }
    
    currentY += 60;
    
    // Zoom Speed slider
    const zoomSpeed = this._settingsManager ? 
      this._settingsManager.get('camera.zoomSpeed', 1.1) : 1.1;
    fill(220);
    text(`Zoom Speed: ${zoomSpeed.toFixed(2)}x`, this.x + this.padding, currentY);
    
    currentY += 30;
    // Render zoom speed slider component
    if (this._components.zoomSpeedSlider) {
      this._components.zoomSpeedSlider.x = this.x + this.padding;
      this._components.zoomSpeedSlider.y = currentY;
      this._components.zoomSpeedSlider.render();
    }
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
   * Handle slider value change
   * @param {string} settingKey - Setting key to update
   * @param {number} value - New value
   * @private
   */
  _handleSliderChange(settingKey, value) {
    if (this._settingsManager) {
      this._settingsManager.set(settingKey, value);
      
      // Update cached settings
      const key = settingKey.split('.').pop(); // Get last part (e.g., 'panSpeed' from 'camera.panSpeed')
      if (this._cachedSettings) {
        this._cachedSettings[key] = value;
      }
      
      // Trigger redraw
      if (typeof redraw === 'function') {
        redraw();
      }
    }
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
    
    // Check toggle component clicks
    if (this._components.autoSaveToggle && 
        this.activeTab === 'General' && 
        this._components.autoSaveToggle.containsPoint(x, y)) {
      this._components.autoSaveToggle.toggle();
      this._handleToggleChange('editor.autoSave', this._components.autoSaveToggle.getValue());
      return;
    }
    
    // Check slider component clicks (start dragging)
    if (this.activeTab === 'Camera') {
      if (this._components.panSpeedSlider && 
          this._components.panSpeedSlider.containsPoint(x, y)) {
        this._components.panSpeedSlider.startDrag();
        this._components.panSpeedSlider.handleDrag(x, y);
        return;
      }
      if (this._components.zoomSpeedSlider && 
          this._components.zoomSpeedSlider.containsPoint(x, y)) {
        this._components.zoomSpeedSlider.startDrag();
        this._components.zoomSpeedSlider.handleDrag(x, y);
        return;
      }
    }
  }
  
  /**
   * Handle mouse drag for sliders
   */
  handleMouseDrag(x, y) {
    if (this.activeTab === 'Camera') {
      if (this._components.panSpeedSlider && this._components.panSpeedSlider.dragging) {
        this._components.panSpeedSlider.handleDrag(x, y);
      }
      if (this._components.zoomSpeedSlider && this._components.zoomSpeedSlider.dragging) {
        this._components.zoomSpeedSlider.handleDrag(x, y);
      }
    }
  }
  
  /**
   * Handle mouse release (stop dragging)
   */
  handleMouseRelease() {
    if (this._components.panSpeedSlider) {
      this._components.panSpeedSlider.endDrag();
    }
    if (this._components.zoomSpeedSlider) {
      this._components.zoomSpeedSlider.endDrag();
    }
  }
  
  /**
   * Handle toggle value change
   * @param {string} settingKey - Setting key to update
   * @param {boolean} value - New value
   * @private
   */
  _handleToggleChange(settingKey, value) {
    if (this._settingsManager) {
      this._settingsManager.set(settingKey, value);
      
      // Update cached value
      if (this._cachedSettings) {
        const key = settingKey.split('.').pop();
        this._cachedSettings[key] = value;
      }
      
      if (typeof redraw === 'function') {
        redraw();
      }
    }
  }
  
  /**
   * Handle toggle click (legacy method for backward compatibility)
   * @param {string} settingKey - Setting key to toggle
   * @deprecated Use component-based approach instead
   */
  handleToggle(settingKey) {
    if (!this._settingsManager) return;
    
    const currentValue = this._settingsManager.get(settingKey, false);
    
    // Boolean toggle
    const newValue = !currentValue;
    
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
  
}

// Export for Node.js (tests)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SettingsPanel;
}

// Export for browser
if (typeof window !== 'undefined') {
  window.SettingsPanel = SettingsPanel;
}

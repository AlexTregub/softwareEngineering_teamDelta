/**
 * FileMenuBar - Horizontal menu bar for Level Editor
 * 
 * Provides a VS Code-style menu bar with:
 * - File menu (Save, Load, New, Export)
 * - Edit menu (Undo, Redo)
 * - Dropdown menus
 * - Keyboard shortcuts
 * - Hover effects
 * 
 */

class FileMenuBar {
  /**
   * Create a file menu bar
   * @param {Object} options - Configuration options
   * @param {Object} options.position - Position {x, y}
   * @param {number} options.height - Bar height (default: 40)
   * @param {Array} options.backgroundColor - Background color [r, g, b]
   * @param {Array} options.textColor - Text color [r, g, b]
   * @param {Array} options.hoverColor - Hover color [r, g, b]
   */
  constructor(options = {}) {
    // Position and size
    // Handle both { position: {x, y} } and { x, y } formats
    if (options.x !== undefined || options.y !== undefined) {
      this.position = { x: options.x || 0, y: options.y || 0 };
    } else {
      this.position = options.position ? { ...options.position } : { x: 0, y: 0 };
    }
    this.height = options.height || 40;
    this.width = typeof window !== 'undefined' ? window.width : 800;
    
    // Style
    this.style = {
      backgroundColor: options.backgroundColor || [45, 45, 45],
      textColor: options.textColor || [220, 220, 220],
      hoverColor: options.hoverColor || [70, 70, 70],
      disabledColor: [100, 100, 100],
      dropdownBg: [50, 50, 50],
      itemHeight: 30,
      itemPadding: 10,
      fontSize: 14
    };
    
    // State
    this.openMenuName = null;
    this.hoveredItem = null;
    this.levelEditor = null;
    
    // Brush size menu module
    this.brushSizeModule = null;
    
    // Menu items
    this.menuItems = this._createDefaultMenuItems();
    
    // Menu item positions (calculated on first render)
    this.menuPositions = [];
  }
  
  /**
   * Create default menu structure
   * @returns {Array} Menu items
   * @private
   */
  _createDefaultMenuItems() {
    return [
      {
        label: 'File',
        items: [
          { 
            label: 'New', 
            shortcut: 'Ctrl+N',
            enabled: true,
            action: () => this._handleNew()
          },
          { 
            label: 'Save', 
            shortcut: 'Ctrl+S',
            enabled: true,
            action: () => this._handleSave()
          },
          { 
            label: 'Load', 
            shortcut: 'Ctrl+O',
            enabled: true,
            action: () => this._handleLoad()
          },
          { 
            label: 'Export', 
            shortcut: 'Ctrl+E',
            enabled: true,
            action: () => this._handleExport()
          }
        ]
      },
      {
        label: 'Edit',
        items: [
          { 
            label: 'Undo', 
            shortcut: 'Ctrl+Z',
            enabled: true,
            action: () => this._handleUndo()
          },
          { 
            label: 'Redo', 
            shortcut: 'Ctrl+Y',
            enabled: true,
            action: () => this._handleRedo()
          }
        ]
      },
      {
        label: 'View',
        items: [
          { 
            label: 'Grid Overlay', 
            shortcut: 'Ctrl+G',
            enabled: true,
            checkable: true,
            checked: true,
            action: () => this._handleToggleGrid()
          },
          { 
            label: 'Minimap', 
            shortcut: 'Ctrl+M',
            enabled: true,
            checkable: true,
            checked: true,
            action: () => this._handleToggleMinimap()
          },
          { 
            label: 'Materials Panel', 
            shortcut: 'Ctrl+1',
            enabled: true,
            checkable: true,
            checked: true,
            action: () => this._handleTogglePanel('materials')
          },
          { 
            label: 'Tools Panel', 
            shortcut: 'Ctrl+2',
            enabled: true,
            checkable: true,
            checked: true,
            action: () => this._handleTogglePanel('tools')
          },
          // Brush Panel removed - brush size now controlled via menu bar (Enhancement 9)
          { 
            label: 'Events Panel', 
            shortcut: 'Ctrl+4',
            enabled: true,
            checkable: true,
            checked: true,
            action: () => this._handleTogglePanel('events')
          },
          { 
            label: 'Properties Panel', 
            shortcut: 'Ctrl+5',
            enabled: true,
            checkable: true,
            checked: true,
            action: () => this._handleTogglePanel('properties')
          },
          { 
            label: 'Notifications', 
            shortcut: 'Ctrl+I',
            enabled: true,
            checkable: true,
            checked: true,
            action: () => this._handleToggleNotifications()
          }
        ]
      }
    ];
  }
  
  /**
   * Set level editor instance for integration
   * @param {LevelEditor} levelEditor - Level editor instance
   */
  setLevelEditor(levelEditor) {
    this.levelEditor = levelEditor;
    this.updateMenuStates();
    
    // Initialize brush size module if available
    if (typeof BrushSizeMenuModule !== 'undefined') {
      this.brushSizeModule = new BrushSizeMenuModule({
        x: 0, // Will be calculated during render
        y: this.position.y,
        initialSize: 1,
        onSizeChange: (newSize) => {
          // Update TerrainEditor brush size
          if (this.levelEditor && this.levelEditor.editor && typeof this.levelEditor.editor.setBrushSize === 'function') {
            this.levelEditor.editor.setBrushSize(newSize);
          }
          // Update BrushControl if still present
          if (this.levelEditor && this.levelEditor.brushControl && typeof this.levelEditor.brushControl.setSize === 'function') {
            this.levelEditor.brushControl.setSize(newSize);
          }
        }
      });
      
      // Set initial visibility to false
      this.brushSizeModule.setVisible(false);
    }
  }
  
  /**
   * Update brush size module visibility based on current tool
   * @param {string} currentTool - Currently selected tool ('paint', 'fill', etc.)
   */
  updateBrushSizeVisibility(currentTool) {
    if (this.brushSizeModule) {
      // Show only when paint tool is active
      this.brushSizeModule.setVisible(currentTool === 'paint');
    }
  }
  
  /**
   * Update menu item enabled states based on editor state
   */
  updateMenuStates() {
    if (!this.levelEditor || !this.levelEditor.editor) return;
    
    // Update Undo/Redo states
    this.setMenuItemEnabled('Edit', 'Undo', this.levelEditor.editor.canUndo());
    this.setMenuItemEnabled('Edit', 'Redo', this.levelEditor.editor.canRedo());
  }
  
  /**
   * Get a menu item by label
   * @param {string} label - Menu label
   * @returns {Object|undefined} Menu item
   */
  getMenuItem(label) {
    return this.menuItems.find(item => item.label === label);
  }
  
  /**
   * Add a custom menu item
   * @param {Object} menuItem - Menu item config
   */
  addMenuItem(menuItem) {
    this.menuItems.push(menuItem);
  }
  
  /**
   * Enable/disable a menu item
   * @param {string} menuLabel - Menu label (e.g., 'File')
   * @param {string} itemLabel - Item label (e.g., 'Save')
   * @param {boolean} enabled - Enabled state
   */
  setMenuItemEnabled(menuLabel, itemLabel, enabled) {
    const menu = this.getMenuItem(menuLabel);
    if (!menu) return;
    
    const item = menu.items.find(i => i.label === itemLabel);
    if (item) {
      item.enabled = enabled;
    }
  }
  
  /**
   * Open a dropdown menu
   * @param {string} label - Menu label to open
   */
  openMenu(label) {
    // Calculate positions if not already done
    if (this.menuPositions.length === 0) {
      this._calculateMenuPositions();
    }
    this.openMenuName = label;
    
    // Notify LevelEditor that menu is open
    if (this.levelEditor && typeof this.levelEditor.setMenuOpen === 'function') {
      this.levelEditor.setMenuOpen(true);
    }
  }
  
  /**
   * Close the open dropdown menu
   */
  closeMenu() {
    this.openMenuName = null;
    
    // Notify LevelEditor that menu is closed
    if (this.levelEditor && typeof this.levelEditor.setMenuOpen === 'function') {
      this.levelEditor.setMenuOpen(false);
    }
  }
  
  /**
   * Check if a menu is open
   * @param {string} label - Menu label
   * @returns {boolean} True if open
   */
  isMenuOpen(label) {
    return this.openMenuName === label;
  }
  
  /**
   * Get the currently open menu name
   * @returns {string|null} Open menu name
   */
  getOpenMenu() {
    return this.openMenuName;
  }
  
  /**
   * Check if a point is inside the menu bar or dropdown
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {boolean} True if inside
   */
  containsPoint(x, y) {
    // Check main bar
    if (y >= this.position.y && y <= this.position.y + this.height) {
      return true;
    }
    
    // Check dropdown if open
    if (this.openMenuName) {
      // Calculate positions if not already done
      if (this.menuPositions.length === 0) {
        this._calculateMenuPositions();
      }
      
      const menu = this.getMenuItem(this.openMenuName);
      if (!menu) return false;
      
      const menuPos = this.menuPositions.find(p => p.label === this.openMenuName);
      if (!menuPos) return false;
      
      const dropdownHeight = menu.items.length * this.style.itemHeight;
      const dropdownWidth = 200; // Fixed width for dropdowns
      
      if (x >= menuPos.x && 
          x <= menuPos.x + dropdownWidth &&
          y >= this.position.y + this.height &&
          y <= this.position.y + this.height + dropdownHeight) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Handle click events
   * @param {number} mouseX - Mouse X coordinate
   * @param {number} mouseY - Mouse Y coordinate
   * @returns {boolean} True if click was handled
   */
  handleClick(mouseX, mouseY) {
    // If menu positions haven't been calculated yet, calculate them now
    if (this.menuPositions.length === 0) {
      this._calculateMenuPositions();
    }
    
    // Check if click is on brush size module (if visible)
    if (this.brushSizeModule && this.brushSizeModule.isVisible()) {
      const consumed = this.brushSizeModule.handleClick(mouseX, mouseY);
      if (consumed) {
        return true;
      }
    }
    
    // Check if click is in menu bar
    if (mouseY >= this.position.y && mouseY <= this.position.y + this.height) {
      // Check which menu was clicked
      for (const menuPos of this.menuPositions) {
        if (mouseX >= menuPos.x && mouseX <= menuPos.x + menuPos.width) {
          // Toggle menu
          if (this.openMenuName === menuPos.label) {
            this.closeMenu();
          } else {
            this.openMenu(menuPos.label);
          }
          return true;
        }
      }
    }
    
    // Check if click is in dropdown
    if (this.openMenuName) {
      const menu = this.getMenuItem(this.openMenuName);
      if (!menu) return false;
      
      const menuPos = this.menuPositions.find(p => p.label === this.openMenuName);
      if (!menuPos) return false;
      
      const dropdownY = this.position.y + this.height;
      const dropdownWidth = 200;
      
      // Check each dropdown item
      for (let i = 0; i < menu.items.length; i++) {
        const item = menu.items[i];
        const itemY = dropdownY + (i * this.style.itemHeight);
        
        if (mouseX >= menuPos.x && 
            mouseX <= menuPos.x + dropdownWidth &&
            mouseY >= itemY &&
            mouseY <= itemY + this.style.itemHeight) {
          
          // Execute action if enabled
          if (item.enabled && item.action) {
            item.action();
            this.closeMenu();
            return true;
          }
          
          // Still consumed the click even if disabled
          return true;
        }
      }
    }
    
    // Click outside menu - close dropdown
    if (this.openMenuName && !this.containsPoint(mouseX, mouseY)) {
      this.closeMenu();
      return true; // We handled the click by closing the menu
    }
    
    return false;
  }
  
  /**
   * Calculate menu item positions (called before first interaction)
   * @private
   */
  _calculateMenuPositions() {
    this.menuPositions = [];
    let currentX = this.position.x + 10;
    
    for (const menu of this.menuItems) {
      const menuWidth = this._calculateTextWidth(menu.label) + 20;
      
      this.menuPositions.push({
        label: menu.label,
        x: currentX,
        width: menuWidth
      });
      
      currentX += menuWidth;
    }
  }
  
  /**
   * Handle keyboard shortcuts
   * @param {string} key - Key pressed
   * @param {Object} modifiers - Modifier keys {ctrl, shift, alt}
   * @returns {boolean} True if shortcut was handled
   */
  handleKeyPress(key, modifiers = {}) {
    // Search all menu items for matching shortcut
    for (const menu of this.menuItems) {
      for (const item of menu.items) {
        if (!item.shortcut || !item.enabled) continue;
        
        // Parse shortcut (e.g., "Ctrl+S")
        const parts = item.shortcut.split('+');
        const needsCtrl = parts.includes('Ctrl');
        const needsShift = parts.includes('Shift');
        const needsAlt = parts.includes('Alt');
        const shortcutKey = parts[parts.length - 1].toLowerCase();
        
        // Check if key and modifiers match
        if (key.toLowerCase() === shortcutKey &&
            !!modifiers.ctrl === needsCtrl &&
            !!modifiers.shift === needsShift &&
            !!modifiers.alt === needsAlt) {
          
          if (item.action) {
            item.action();
            return true;
          }
        }
      }
    }
    
    return false;
  }
  
  /**
   * Handle mouse move for hover effects
   * @param {number} mouseX - Mouse X position
   * @param {number} mouseY - Mouse Y position
   */
  handleMouseMove(mouseX, mouseY) {
    // Update brush size module hover state
    if (this.brushSizeModule && this.brushSizeModule.isVisible()) {
      this.brushSizeModule.handleMouseMove(mouseX, mouseY);
    }
  }
  
  /**
   * Render the menu bar
   */
  render() {
    if (typeof push !== 'function') return; // Guard for tests
    
    push();
    
    // Render background
    fill(...this.style.backgroundColor);
    noStroke();
    rect(this.position.x, this.position.y, this.width, this.height);
    
    // Calculate menu positions
    this.menuPositions = [];
    let currentX = this.position.x + 10;
    
    // Render menu items
    textSize(this.style.fontSize);
    textAlign(LEFT, CENTER);
    
    for (const menu of this.menuItems) {
      const menuWidth = this._calculateTextWidth(menu.label) + 20;
      
      // Check if hovered or open
      const isHovered = this._isMenuHovered(currentX, menuWidth);
      const isOpen = this.openMenuName === menu.label;
      
      // Highlight if hovered or open
      if (isHovered || isOpen) {
        fill(...this.style.hoverColor);
        rect(currentX, this.position.y, menuWidth, this.height);
      }
      
      // Render text
      fill(...this.style.textColor);
      text(menu.label, currentX + 10, this.position.y + this.height / 2);
      
      // Store position
      this.menuPositions.push({
        label: menu.label,
        x: currentX,
        width: menuWidth
      });
      
      currentX += menuWidth;
    }
    
    // Render brush size module (inline, after menu items)
    if (this.brushSizeModule && this.brushSizeModule.isVisible()) {
      // Position at the end of menu items with some padding
      this.brushSizeModule.x = currentX + 20;
      this.brushSizeModule.y = this.position.y;
      this.brushSizeModule.render();
    }
    
    // Render dropdown if open
    if (this.openMenuName) {
      this._renderDropdown();
    }
    
    pop();
  }
  
  /**
   * Check if mouse is hovering over a menu item
   * @param {number} x - Menu X position
   * @param {number} width - Menu width
   * @returns {boolean} True if hovered
   * @private
   */
  _isMenuHovered(x, width) {
    if (typeof mouseX === 'undefined' || typeof mouseY === 'undefined') return false;
    
    return mouseX >= x && 
           mouseX <= x + width &&
           mouseY >= this.position.y &&
           mouseY <= this.position.y + this.height;
  }
  
  /**
   * Render dropdown menu
   * @private
   */
  _renderDropdown() {
    const menu = this.getMenuItem(this.openMenuName);
    if (!menu) return;
    
    const menuPos = this.menuPositions.find(p => p.label === this.openMenuName);
    if (!menuPos) return;
    
    const dropdownWidth = 200;
    const dropdownHeight = menu.items.length * this.style.itemHeight;
    const dropdownY = this.position.y + this.height;
    
    // Dropdown background
    fill(...this.style.dropdownBg);
    stroke(100);
    strokeWeight(1);
    rect(menuPos.x, dropdownY, dropdownWidth, dropdownHeight);
    
    // Render items
    textAlign(LEFT, CENTER);
    textSize(this.style.fontSize);
    
    for (let i = 0; i < menu.items.length; i++) {
      const item = menu.items[i];
      const itemY = dropdownY + (i * this.style.itemHeight);
      
      // Check if hovered
      const isHovered = this._isDropdownItemHovered(menuPos.x, itemY, dropdownWidth);
      
      // Highlight if hovered and enabled
      if (isHovered && item.enabled) {
        fill(...this.style.hoverColor);
        noStroke();
        rect(menuPos.x, itemY, dropdownWidth, this.style.itemHeight);
      }
      
      // Render text
      const textColor = item.enabled ? this.style.textColor : this.style.disabledColor;
      fill(...textColor);
      
      // Add checkmark for checkable items
      const textOffset = item.checkable ? 20 : 0;
      if (item.checkable && item.checked) {
        text('✓', menuPos.x + this.style.itemPadding, itemY + this.style.itemHeight / 2);
      }
      
      text(item.label, menuPos.x + this.style.itemPadding + textOffset, itemY + this.style.itemHeight / 2);
      
      // Render shortcut (right-aligned)
      if (item.shortcut) {
        if (typeof textAlign === 'function') {
          const RIGHT_CONST = typeof RIGHT !== 'undefined' ? RIGHT : 'right';
          const CENTER_CONST = typeof CENTER !== 'undefined' ? CENTER : 'center';
          textAlign(RIGHT_CONST, CENTER_CONST);
          text(item.shortcut, menuPos.x + dropdownWidth - this.style.itemPadding, itemY + this.style.itemHeight / 2);
          textAlign(LEFT, CENTER_CONST);
        }
      }
    }
  }
  
  /**
   * Check if mouse is hovering over a dropdown item
   * @param {number} x - Item X position
   * @param {number} y - Item Y position
   * @param {number} width - Item width
   * @returns {boolean} True if hovered
   * @private
   */
  _isDropdownItemHovered(x, y, width) {
    if (typeof mouseX === 'undefined' || typeof mouseY === 'undefined') return false;
    
    return mouseX >= x && 
           mouseX <= x + width &&
           mouseY >= y &&
           mouseY <= y + this.style.itemHeight;
  }
  
  /**
   * Calculate text width (simplified for testing)
   * @param {string} text - Text to measure
   * @returns {number} Width in pixels
   * @private
   */
  _calculateTextWidth(text) {
    // Simple estimation: 8 pixels per character
    // In real p5.js, would use textWidth()
    return text.length * 8;
  }
  
  // Action handlers
  _handleNew() {
    if (this.levelEditor && typeof this.levelEditor.handleFileNew === 'function') {
      this.levelEditor.handleFileNew();
    } else if (this.levelEditor) {
      logNormal('New level (handleFileNew not available)');
    }
  }
  
  _handleSave() {
    if (this.levelEditor && typeof this.levelEditor.handleFileSave === 'function') {
      this.levelEditor.handleFileSave();
    } else if (this.levelEditor && typeof this.levelEditor.save === 'function') {
      this.levelEditor.save();
    }
  }
  
  _handleLoad() {
    if (this.levelEditor && typeof this.levelEditor.load === 'function') {
      this.levelEditor.load();
    }
  }
  
  _handleExport() {
    if (this.levelEditor && typeof this.levelEditor.handleFileExport === 'function') {
      this.levelEditor.handleFileExport();
    } else if (this.levelEditor) {
      logNormal('Export level (handleFileExport not available)');
    }
  }
  
  _handleUndo() {
    if (this.levelEditor && typeof this.levelEditor.undo === 'function') {
      this.levelEditor.undo();
    }
  }
  
  _handleRedo() {
    if (this.levelEditor && typeof this.levelEditor.redo === 'function') {
      this.levelEditor.redo();
    }
  }
  
  _handleToggleGrid() {
    if (this.levelEditor) {
      this.levelEditor.showGrid = !this.levelEditor.showGrid;
      
      // Update checked state
      const viewMenu = this.menuItems.find(m => m.label === 'View');
      const gridItem = viewMenu.items.find(i => i.label === 'Grid Overlay');
      if (gridItem) {
        gridItem.checked = this.levelEditor.showGrid;
      }
    }
  }
  
  _handleToggleMinimap() {
    if (this.levelEditor) {
      this.levelEditor.showMinimap = !this.levelEditor.showMinimap;
      
      // Update checked state
      const viewMenu = this.menuItems.find(m => m.label === 'View');
      const minimapItem = viewMenu.items.find(i => i.label === 'Minimap');
      if (minimapItem) {
        minimapItem.checked = this.levelEditor.showMinimap;
      }
    }
  }
  
  _handleTogglePanel(panelName) {
    // Use global draggablePanelManager with correct panel IDs
    if (typeof draggablePanelManager !== 'undefined' && draggablePanelManager) {
      // Map short names to full panel IDs
      const panelIdMap = {
        'materials': 'level-editor-materials',
        'tools': 'level-editor-tools',
        'brush': 'level-editor-brush',
        'events': 'level-editor-events',
        'properties': 'level-editor-properties'
      };
      
      const panelId = panelIdMap[panelName];
      if (panelId) {
        // togglePanel returns new visibility state
        const newVisibility = draggablePanelManager.togglePanel(panelId);
        
        // Update checked state in menu
        if (newVisibility !== null) {
          const viewMenu = this.menuItems.find(m => m.label === 'View');
          const labelMap = {
            'materials': 'Materials Panel',
            'tools': 'Tools Panel',
            'brush': 'Brush Panel',
            'events': 'Events Panel',
            'properties': 'Properties Panel'
          };
          const menuItem = viewMenu.items.find(i => i.label === labelMap[panelName]);
          if (menuItem) {
            menuItem.checked = newVisibility;
          }
        }
      }
    }
  }
  
  _handleToggleNotifications() {
    if (this.levelEditor && this.levelEditor.notifications) {
      this.levelEditor.notifications.visible = !this.levelEditor.notifications.visible;
      
      // Update checked state
      const viewMenu = this.menuItems.find(m => m.label === 'View');
      const notificationsItem = viewMenu.items.find(i => i.label === 'Notifications');
      if (notificationsItem) {
        notificationsItem.checked = this.levelEditor.notifications.visible;
      }
    }
  }
}

// Export for browser
if (typeof window !== 'undefined') {
  window.FileMenuBar = FileMenuBar;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FileMenuBar;
}

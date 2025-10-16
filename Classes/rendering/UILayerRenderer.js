/**
 * @fileoverview UILayerRenderer - Comprehensive UI layer rendering system
 * @module UILayerRenderer
 * @see {@link docs/api/UILayerRenderer.md} Complete API documentation
 * @see {@link docs/quick-reference.md} UI layer rendering reference
 */

/**
 * Comprehensive UI layer system handling HUD, debug UI, tooltips, and interactions.
 * 
 * **Features**: HUD elements, selection boxes, context menus, debug overlays
 * 
 * @class UILayerRenderer
 * @see {@link docs/api/UILayerRenderer.md} Full documentation and examples
 */
class UILayerRenderer {
  constructor() {
    this.config = {
      enableHUD: true,
      enableDebugUI: true,
      enableTooltips: true,
      enableSelectionBox: true,
      hudOpacity: 0.9,
      debugUIOpacity: 0.8
    };

    this.hudElements = {
      currency: { wood: 0, food: 0, population: 0, pain: 100 },
      toolbar: { activeButton: null, buttons: [] },
      minimap: { enabled: false, size: 120 }
    };

    this.interactionUI = {
      selectionBox: { active: false, start: null, end: null },
      tooltips: { active: null, text: '', position: null },
      contextMenu: { active: false, items: [], position: null }
    };

    this.debugUI = {
      performanceOverlay: { enabled: true },
      entityInspector: { enabled: false, selectedEntity: null },
      debugConsole: { enabled: false, visible: false }
    };

    this.menuSystems = {
      mainMenu: { active: false },
      pauseMenu: { active: false },
      settingsMenu: { active: false },
      gameOverMenu: { active: false }
    };

    this.fonts = {
      hud: null,
      debug: null,
      menu: null
    };

    this.colors = {
      hudBackground: [0, 0, 0, 150],
      hudText: [255, 255, 255],
      debugBackground: [0, 0, 0, 180],
      debugText: [0, 255, 0],
      selectionBox: [255, 255, 0, 100],
      selectionBorder: [255, 255, 0],
      tooltip: [0, 0, 0, 200],
      tooltipText: [255, 255, 255]
    };

    this.stats = {
      lastRenderTime: 0,
      uiElementsRendered: 0
    };
  }

  /**
   * Main render method - renders all UI layers based on game state
   */
  renderUI(gameState) {
    const startTime = performance.now();
    this.stats.uiElementsRendered = 0;

    push();
    
    switch(gameState) {
      case 'PLAYING':
        this.renderInGameUI();
        break;
      case 'PAUSED':
        this.renderInGameUI();
        this.renderPauseMenu();
        break;
      case 'MAIN_MENU':
        this.renderMainMenu();
        break;
      case 'SETTINGS':
        this.renderSettingsMenu();
        break;
      case 'GAME_OVER':
        this.renderGameOverMenu();
        break;
      default:
        // Fallback - render minimal UI
        this.renderInGameUI();
    }
    
    pop();

    this.stats.lastRenderTime = performance.now() - startTime;
  }

  /**
   * Render in-game UI elements
   */
  renderInGameUI() {
    if (this.config.enableHUD) {
      this.renderHUDElements();
    }

    if (this.config.enableSelectionBox && this.interactionUI.selectionBox.active) {
      this.renderSelectionBox();
    }

    if (this.config.enableTooltips && this.interactionUI.tooltips.active) {
      this.renderTooltip();
    }

    if (this.interactionUI.contextMenu.active) {
      this.renderContextMenu();
    }

    if (this.config.enableDebugUI) {
      if (this.debugUI.performanceOverlay.enabled) {
        this.renderPerformanceOverlay();
      }
      
      if (this.debugUI.entityInspector.enabled) {
        this.renderEntityInspector();
      }
    }
  }

  /**
   * HUD Elements - Currency, Toolbar, Minimap
   */
  renderHUDElements() {
    // Currency Display (Top-left)
    this.renderCurrencyDisplay();
    
    // Toolbar (Bottom-center)
    this.renderToolbar();
    
    // Minimap (Top-right)
    if (this.hudElements.minimap.enabled) {
      this.renderMinimap();
    }

    this.stats.uiElementsRendered += 3;
  }

  renderCurrencyDisplay() {
    // Currency display is now rendered by the Draggable Panel System
    // Check if the draggable panel manager is available
    if (window.draggablePanelManager && 
        typeof window.draggablePanelManager.getPanel === 'function') {
      
      const resourcePanel = window.draggablePanelManager.getPanel('resource-display');
      if (!resourcePanel) {
        // Fallback to original currency display if draggable panel system is not active
        this.renderFallbackCurrencyDisplay();
      }
      // Otherwise, the Draggable Panel System handles currency display rendering
    } else {
      // Fallback to original currency display
      this.renderFallbackCurrencyDisplay();
    }
  }

  renderFallbackCurrencyDisplay() {
    push();
    
    // Background
    fill(...this.colors.hudBackground);
    noStroke();
    rect(10, 10, 200, 80, 5);
    
    // Text
    fill(...this.colors.hudText);
    textAlign(LEFT, TOP);
    textSize(16);
    
    // Get current resource values
    const wood = (g_resourceList && g_resourceList.wood) ? g_resourceList.wood.length : 0;
    const food = (g_resourceList && g_resourceList.food) ? g_resourceList.food.length : 0;
    const population = (typeof ants !== 'undefined') ? ants.length : 0;
    
    text(`Wood: ${wood}`, 20, 25);
    text(`Food: ${food}`, 20, 45);
    text(`Population: ${population}`, 20, 65);
    
    pop();
  }

  renderToolbar() {
  }

  renderFallbackToolbar() {
    push();

    const toolbarWidth = 300;
    const toolbarHeight = 60;
    const toolbarX = (width - toolbarWidth) / 2;
    const toolbarY = height - toolbarHeight - 10;

    // Background
    fill(...this.colors.hudBackground);
    noStroke();
    rect(toolbarX, toolbarY, toolbarWidth, toolbarHeight, 5);

    // Buttons layout
    const buttonWidth = 50;
    const buttonHeight = 40;
    const buttonSpacing = 10;
    const startX = toolbarX + 20;
    const startY = toolbarY + 10;

    const labels = ['Build', 'Gather', 'Attack', 'Defend'];

    // Initialize toolbar buttons array if needed
    if (!this.hudElements.toolbar.buttons || this.hudElements.toolbar.buttons.length !== labels.length) {
      this.hudElements.toolbar.buttons = [];
      for (let i = 0; i < labels.length; i++) {
        const bx = startX + i * (buttonWidth + buttonSpacing);
        const btn = new Button(bx, startY, buttonWidth, buttonHeight, labels[i], {
          ...ButtonStyles.TOOLBAR,
          onClick: (b) => { this.hudElements.toolbar.activeButton = i; }
        });
        this.hudElements.toolbar.buttons.push(btn);
      }
    }

    // Render each button
    for (let i = 0; i < labels.length; i++) {
      const btn = this.hudElements.toolbar.buttons[i];

      // Update button input state from p5 globals
      btn.update(mouseX, mouseY, mouseIsPressed);

      // Reflect active state visually
      if (this.hudElements.toolbar.activeButton === i) {
        btn.setBackgroundColor(ButtonStyles.TOOLBAR_ACTIVE.backgroundColor);
      } else {
        btn.setBackgroundColor(ButtonStyles.TOOLBAR.backgroundColor);
      }

      btn.render();
    }

    pop();
  }

  renderMinimap() {
    push();
    
    const size = this.hudElements.minimap.size;
    const minimapX = width - size - 10;
    const minimapY = 10;
    
    // Background
    fill(0, 0, 0, 180);
    stroke(255);
    strokeWeight(2);
    rect(minimapX, minimapY, size, size);
    
    // Simplified world representation
    fill(0, 100, 0); // Terrain
    noStroke();
    rect(minimapX + 2, minimapY + 2, size - 4, size - 4);
    
    // Ant positions (if available)
    if (ants && ants.length > 0) {
      fill(255, 0, 0);
      for (let ant of ants) {
        if (ant && ant.x !== undefined && ant.y !== undefined) {
          // Scale ant position to minimap
          const antX = map(ant.x, 0, width, minimapX + 2, minimapX + size - 2);
          const antY = map(ant.y, 0, height, minimapY + 2, minimapY + size - 2);
          circle(antX, antY, 2);
        }
      }
    }
    
    pop();
  }

  /**
   * Interaction UI - Selection, Tooltips, Context Menu
   */
  renderSelectionBox() {
    if (!this.interactionUI.selectionBox.start || !this.interactionUI.selectionBox.end) return;
    
    push();
    
    const start = this.interactionUI.selectionBox.start;
    const end = this.interactionUI.selectionBox.end;
    
    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    const w = Math.abs(end.x - start.x);
    const h = Math.abs(end.y - start.y);
    
    // Selection box fill
    fill(...this.colors.selectionBox);
    noStroke();
    rect(x, y, w, h);
    
    // Selection box border
    stroke(...this.colors.selectionBorder);
    strokeWeight(2);
    noFill();
    rect(x, y, w, h);
    
    pop();
    
    this.stats.uiElementsRendered++;
  }

  renderTooltip() {
    if (!this.interactionUI.tooltips.text || !this.interactionUI.tooltips.position) return;
    
    push();
    
    const text = this.interactionUI.tooltips.text;
    const pos = this.interactionUI.tooltips.position;
    
    textSize(14);
    const textWidth = textWidth(text);
    const textHeight = 20;
    const padding = 8;
    
    // Tooltip background
    fill(...this.colors.tooltip);
    noStroke();
    rect(pos.x, pos.y - textHeight - padding, textWidth + padding * 2, textHeight + padding, 3);
    
    // Tooltip text
    fill(...this.colors.tooltipText);
    textAlign(LEFT, TOP);
    text(text, pos.x + padding, pos.y - textHeight - padding/2);
    
    pop();
    
    this.stats.uiElementsRendered++;
  }

  renderContextMenu() {
    if (!this.interactionUI.contextMenu.items.length || !this.interactionUI.contextMenu.position) return;
    
    push();
    
    const items = this.interactionUI.contextMenu.items;
    const pos = this.interactionUI.contextMenu.position;
    const itemHeight = 25;
    const menuWidth = 120;
    const menuHeight = items.length * itemHeight;
    
    // Menu background
    fill(40, 40, 40, 230);
    stroke(150);
    strokeWeight(1);
    rect(pos.x, pos.y, menuWidth, menuHeight);
    
    // Menu items
    fill(255);
    textAlign(LEFT, CENTER);
    textSize(12);
    
    for (let i = 0; i < items.length; i++) {
      const itemY = pos.y + i * itemHeight;
      
      // Highlight hovered item
      if (mouseX >= pos.x && mouseX <= pos.x + menuWidth && 
          mouseY >= itemY && mouseY <= itemY + itemHeight) {
        fill(80, 80, 80);
        noStroke();
        rect(pos.x, itemY, menuWidth, itemHeight);
        fill(255);
      }
      
      text(items[i], pos.x + 10, itemY + itemHeight/2);
    }
    
    pop();
    
    this.stats.uiElementsRendered++;
  }

  /**
   * Debug UI - Performance, Entity Inspector, Console
   */
  renderPerformanceOverlay() {
    // Check if draggable panel system is available
    if (window && window.draggablePanelManager) {
      // Draggable panel system is active - don't render static overlay
      return;
    }
    
    // Use existing PerformanceMonitor if available
    const performanceMonitor = (typeof window !== 'undefined') ? window.PerformanceMonitor : 
                              (typeof global !== 'undefined') ? global.PerformanceMonitor : null;
    
    if (performanceMonitor && typeof performanceMonitor.render === 'function') {
      // Use the existing comprehensive PerformanceMonitor
      performanceMonitor.render();
    } else {
      // Fallback to basic performance display
      this.renderBasicPerformanceOverlay();
    }
    
    this.stats.uiElementsRendered++;
  }

  renderBasicPerformanceOverlay() {
    push();
    
    const overlayX = 10;
    const overlayY = 100;
    const overlayWidth = 250;
    const overlayHeight = 180;
    
    // Background
    fill(...this.colors.debugBackground);
    noStroke();
    rect(overlayX, overlayY, overlayWidth, overlayHeight, 5);
    
    // Title
    fill(...this.colors.debugText);
    textAlign(LEFT, TOP);
    textSize(14);
    text('PERFORMANCE MONITOR', overlayX + 10, overlayY + 10);
    
    // Performance data
    textSize(12);
    let yOffset = 35;
    
    // FPS
    const fps = (frameRate() || 0).toFixed(1);
    text(`FPS: ${fps}`, overlayX + 10, overlayY + yOffset);
    yOffset += 20;
    
    // Frame time
    const frameTime = (1000 / (frameRate() || 60)).toFixed(1);
    text(`Frame Time: ${frameTime}ms`, overlayX + 10, overlayY + yOffset);
    yOffset += 20;
    
    // Entity counts
    const entityCount = (typeof ants !== 'undefined') ? ants.length : 0;
    text(`Entities: ${entityCount} total`, overlayX + 10, overlayY + yOffset);
    yOffset += 20;
    
    // UI elements
    text(`UI Elements: ${this.stats.uiElementsRendered}`, overlayX + 10, overlayY + yOffset);
    yOffset += 20;
    
    // Last render time
    text(`UI Render: ${this.stats.lastRenderTime.toFixed(2)}ms`, overlayX + 10, overlayY + yOffset);
    yOffset += 20;
    
    // Memory usage (if available)
    if (performance && performance.memory) {
      const memoryMB = (performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(1);
      text(`Memory: ${memoryMB}MB`, overlayX + 10, overlayY + yOffset);
    }
    
    pop();
  }

  renderEntityInspector() {
    if (!this.debugUI.entityInspector.selectedEntity) return;
    
    push();
    
    const inspectorX = width - 260;
    const inspectorY = 100;
    const inspectorWidth = 250;
    const inspectorHeight = 200;
    
    // Background
    fill(...this.colors.debugBackground);
    noStroke();
    rect(inspectorX, inspectorY, inspectorWidth, inspectorHeight, 5);
    
    // Title
    fill(...this.colors.debugText);
    textAlign(LEFT, TOP);
    textSize(14);
    text('ENTITY INSPECTOR', inspectorX + 10, inspectorY + 10);
    
    // Entity data
    const entity = this.debugUI.entityInspector.selectedEntity;
    textSize(12);
    let yOffset = 35;
    
    text(`ID: ${entity.id || 'N/A'}`, inspectorX + 10, inspectorY + yOffset);
    yOffset += 18;
    
    text(`Type: ${entity.constructor.name || 'Unknown'}`, inspectorX + 10, inspectorY + yOffset);
    yOffset += 18;
    
    if (entity.x !== undefined && entity.y !== undefined) {
      text(`Position: (${entity.x.toFixed(1)}, ${entity.y.toFixed(1)})`, inspectorX + 10, inspectorY + yOffset);
      yOffset += 18;
    }
    
    if (entity.isActive !== undefined) {
      text(`Active: ${entity.isActive}`, inspectorX + 10, inspectorY + yOffset);
      yOffset += 18;
    }
    
    if (entity.currentState) {
      text(`State: ${entity.currentState}`, inspectorX + 10, inspectorY + yOffset);
      yOffset += 18;
    }
    
    pop();
    
    this.stats.uiElementsRendered++;
  }

  renderDebugConsole() {
    push();

    pop();
    
    this.stats.uiElementsRendered++;
  }

  renderPauseMenu() {
    /*
    push();
    pop();
    this.stats.uiElementsRendered += buttons.length + 2;
    */
  }

  renderSettingsMenu() {
    // Placeholder for settings menu implementation
    push();
    
    fill(0, 0, 0, 200);
    noStroke();
    rect(0, 0, width, height);
    
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(24);
    text('Settings Menu', width/2, height/2);
    text('(Implementation pending)', width/2, height/2 + 40);
    
    pop();
    
    this.stats.uiElementsRendered++;
  }

  renderGameOverMenu() {
    // Placeholder for game over menu implementation
    push();
    
    fill(0, 0, 0, 200);
    noStroke();
    rect(0, 0, width, height);
    
    fill(255, 0, 0);
    textAlign(CENTER, CENTER);
    textSize(48);
    text('GAME OVER', width/2, height/2 - 50);
    
    fill(255);
    textSize(24);
    text('Final Score: 0', width/2, height/2 + 20);
    
    pop();
    
    this.stats.uiElementsRendered++;
  }

  /**
   * MISSING API METHODS - Required by test suite
   * These methods provide the specific signatures expected by the comprehensive test system
   */

  /**
   * Render interaction UI elements (selection boxes, tooltips)
   * @param {Object} selection - Active selection with coordinates
   * @param {Object} hoveredEntity - Entity being hovered for tooltips
   */
  renderInteractionUI(selection, hoveredEntity) {
    // Render selection box if active
    if (selection && selection.active) {
      this.renderSelectionBoxFromData(selection);
    }
    
    // Render entity tooltip if hovering
    if (hoveredEntity && hoveredEntity.x !== undefined) {
      const tooltipText = this.generateEntityTooltip(hoveredEntity);
      this.showTooltip(tooltipText, hoveredEntity.x, hoveredEntity.y - 30);
      this.renderTooltip();
    }
    
    // Render context menu if active
    if (this.interactionUI.contextMenu.active) {
      this.renderContextMenu();
    }
  }

  /**
   * Render debug overlays (performance, entity inspector)
   */
  renderDebugOverlay() {
    let elementsRendered = 0;
    
    // Render performance overlay if enabled
    if (this.debugUI.performanceOverlay.enabled) {
      this.renderPerformanceOverlay();
      elementsRendered++;
    }
    
    // Render entity inspector if enabled and has selected entity
    if (this.debugUI.entityInspector.enabled && this.debugUI.entityInspector.selectedEntity) {
      this.renderEntityInspector();
      elementsRendered++;
    }
    
    // Render debug console if visible
    if (this.debugUI.debugConsole.enabled && this.debugUI.debugConsole.visible) {
      this.renderDebugConsole();
      elementsRendered++;
    }
    
    this.stats.uiElementsRendered += elementsRendered;
  }

  /**
   * Render menus based on game state
   * @param {Object} gameState - Current game state with currentState property
   */
  renderMenus(gameState) {
    if (!gameState || !gameState.currentState) return;
    
    switch (gameState.currentState) {
      case 'MENU':
      case 'MAIN_MENU':
        this.renderMainMenu();
        break;
      case 'PAUSED':
        this.renderPauseMenu();
        break;
      case 'SETTINGS':
        this.renderSettingsMenu();
        break;
      case 'GAME_OVER':
        this.renderGameOverMenu();
        break;
      default:
        // No menu for other states
        break;
    }
  }

  /**
   * Set console messages for debug console
   * @param {Array} messages - Array of console message objects
   */
  setConsoleMessages(messages) {
    this.debugConsoleMessages = messages || [];
    
    // Update debug console to show these messages
    if (this.debugUI.debugConsole.enabled) {
      this.debugUI.debugConsole.messages = this.debugConsoleMessages;
    }
  }

  /**
   * Get current configuration
   * @returns {Object} Current UI renderer configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * HELPER METHODS for the new API methods
   */

  renderFallbackHUD() {
    push();
    fill(100, 100, 100, 150);
    noStroke();
    rect(10, 10, 200, 60, 5);
    
    fill(255);
    textAlign(LEFT, TOP);
    textSize(14);
    text('No game state available', 20, 30);
    pop();
    
    this.stats.uiElementsRendered++;
  }

  renderSelectionBoxFromData(selection) {
    if (!selection.startX || !selection.startY || !selection.currentX || !selection.currentY) return;
    
    push();
    
    const x = Math.min(selection.startX, selection.currentX);
    const y = Math.min(selection.startY, selection.currentY);
    const w = Math.abs(selection.currentX - selection.startX);
    const h = Math.abs(selection.currentY - selection.startY);
    
    // Selection box fill
    fill(...this.colors.selectionBox);
    noStroke();
    rect(x, y, w, h);
    
    // Selection box border
    stroke(...this.colors.selectionBorder);
    strokeWeight(2);
    noFill();
    rect(x, y, w, h);
    
    pop();
    
    this.stats.uiElementsRendered++;
  }

  generateEntityTooltip(entity) {
    let tooltip = `Entity: ${entity.constructor?.name || 'Unknown'}`;
    
    if (entity.health !== undefined) {
      tooltip += `\nHealth: ${entity.health}`;
    }
    
    if (entity.currentState) {
      tooltip += `\nState: ${entity.currentState}`;
    }
    
    if (entity.isActive !== undefined) {
      tooltip += `\nActive: ${entity.isActive}`;
    }
    
    return tooltip;
  }

  /**
   * API Methods for controlling UI elements
   */
  
  // Selection Box API
  startSelectionBox(x, y) {
    this.interactionUI.selectionBox.active = true;
    this.interactionUI.selectionBox.start = { x, y };
    this.interactionUI.selectionBox.end = { x, y };
  }

  updateSelectionBox(x, y) {
    if (this.interactionUI.selectionBox.active) {
      this.interactionUI.selectionBox.end = { x, y };
    }
  }

  endSelectionBox() {
    this.interactionUI.selectionBox.active = false;
    this.interactionUI.selectionBox.start = null;
    this.interactionUI.selectionBox.end = null;
  }

  // Tooltip API
  showTooltip(text, x, y) {
    this.interactionUI.tooltips.active = true;
    this.interactionUI.tooltips.text = text;
    this.interactionUI.tooltips.position = { x, y };
  }

  hideTooltip() {
    this.interactionUI.tooltips.active = false;
    this.interactionUI.tooltips.text = '';
    this.interactionUI.tooltips.position = null;
  }

  // Context Menu API
  showContextMenu(items, x, y) {
    this.interactionUI.contextMenu.active = true;
    this.interactionUI.contextMenu.items = items;
    this.interactionUI.contextMenu.position = { x, y };
  }

  hideContextMenu() {
    this.interactionUI.contextMenu.active = false;
    this.interactionUI.contextMenu.items = [];
    this.interactionUI.contextMenu.position = null;
  }

  // Debug UI API
  togglePerformanceOverlay() {
    this.debugUI.performanceOverlay.enabled = !this.debugUI.performanceOverlay.enabled;
  }

  toggleEntityInspector() {
    this.debugUI.entityInspector.enabled = !this.debugUI.entityInspector.enabled;
  }

  selectEntityForInspection(entity) {
    this.debugUI.entityInspector.selectedEntity = entity;
    this.debugUI.entityInspector.enabled = true;
  }

  toggleDebugConsole() {
    toggleDevConsole();
  }

  // Minimap API
  enableMinimap() {
    this.hudElements.minimap.enabled = true;
  }

  disableMinimap() {
    this.hudElements.minimap.enabled = false;
  }

  // Configuration API
  updateConfig(newConfig) {
    Object.assign(this.config, newConfig);
  }

  getStats() {
    return { ...this.stats };
  }
}

// Create global instance for browser use
if (typeof window !== 'undefined') {
  window.UIRenderer = new UILayerRenderer();
} else if (typeof global !== 'undefined') {
  global.UIRenderer = new UILayerRenderer();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UILayerRenderer;
}
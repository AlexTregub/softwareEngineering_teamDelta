/**
 * @fileoverview UILayerRenderer - Comprehensive UI layer rendering system
 */

/**
 * Comprehensive UI layer system handling HUD, debug UI, tooltips, and interactions.
 * 
 * **Features**: HUD elements, selection boxes, context menus, debug overlays
 * 
 * @class UILayerRenderer
 */
class UILayerRenderer {
  constructor() {
    this.config = {
      enableHUD: true,
      enableSelectionBox: true,
      hudOpacity: 0.9,
      debugUIOpacity: 0.8
    };

    this.hudElements = {
      currency: { wood: 0, food: 0, population: 0, pain: 100 },
      toolbar: { activeButton: null, buttons: [] },
    };

    this.interactionUI = {
      selectionBox: { active: false, start: null, end: null },
    };

    this.debugUI = {
    };

    this.menuSystems = {
      mainMenu: { active: false },
      pauseMenu: { active: false },
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
    }
    
    pop();

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

    if (this.config.enableDebugUI) {
      
    }
  }

  /**
   * HUD Elements - Currency, Toolbar, Minimap
   */
  renderHUDElements() {
    // Currency Display (Top-left)
    this.renderCurrencyDisplay();

    this.stats.uiElementsRendered += 3;
  }

  renderCurrencyDisplay() {
    const resourcePanel = window.draggablePanelManager.getPanel('resource-display');
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

  renderDebugConsole() {
    push();

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
    
    pop();
    
    this.stats.uiElementsRendered++;
  }

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
   * Get current configuration
   * @returns {Object} Current UI renderer configuration
   */
  getConfig() {
    return { ...this.config };
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
/**
 * @fileoverview UIDebugIntegration - Integration layer for UIDebugManager
 * @module UIDebugIntegration
 * @author Software Engineering Team Delta - David Willman
 * @version 1.0.0
 * @see {@link docs/api/UIDebugIntegration.md} Complete API documentation
 * @see {@link docs/quick-reference.md} Debug integration reference
 */

/**
 * Integration examples for UIDebugManager with existing UI systems.
 * 
 * **Purpose**: Shows drag-and-drop repositioning integration patterns
 * 
 * @class UILayerRendererDebugIntegration
 * @see {@link docs/api/UIDebugIntegration.md} Full documentation and examples
 */

// Example integration for UILayerRenderer class
class UILayerRendererDebugIntegration {
  constructor() {
    // ... existing constructor code ...
    
    // Initialize debug-aware positions for UI elements
    this.debugPositions = {
      toolbar: { x: 0, y: 0 }, // Will be set by debug system
      hud: { x: 10, y: 10 },
      minimap: { x: 0, y: 0 }, // Calculated based on screen size
      performanceOverlay: { x: 10, y: 100 },
      entityInspector: { x: 0, y: 100 } // Will be set relative to screen
    };
    
    // Register UI elements with debug system when it becomes available
    this.registerWithDebugSystem();
  }

  /**
   * Register all UI elements with the global debug system
   */
  registerWithDebugSystem() {
    // Check if debug system is available
    if (typeof g_uiDebugManager === 'undefined' || !g_uiDebugManager) {
      // Retry after a short delay if debug system isn't ready yet
      setTimeout(() => this.registerWithDebugSystem(), 100);
      return;
    }

    // Register toolbar
    g_uiDebugManager.registerElement(
      'ui_toolbar',
      {
        x: (width - 300) / 2, // Default center position
        y: height - 70,
        width: 300,
        height: 60
      },
      (x, y) => {
        this.debugPositions.toolbar.x = x;
        this.debugPositions.toolbar.y = y;
      },
      {
        label: 'Game Toolbar',
        persistKey: 'toolbar_position',
        constraints: {
          minY: 0,
          maxY: height - 60
        }
      }
    );

    // Register HUD
    g_uiDebugManager.registerElement(
      'ui_hud',
      {
        x: 10,
        y: 10,
        width: 200,
        height: 80
      },
      (x, y) => {
        this.debugPositions.hud.x = x;
        this.debugPositions.hud.y = y;
      },
      {
        label: 'Resource HUD',
        persistKey: 'hud_position'
      }
    );

    // Register minimap
    g_uiDebugManager.registerElement(
      'ui_minimap',
      {
        x: width - 130,
        y: 10,
        width: 120,
        height: 120
      },
      (x, y) => {
        this.debugPositions.minimap.x = x;
        this.debugPositions.minimap.y = y;
      },
      {
        label: 'Minimap',
        persistKey: 'minimap_position',
        constraints: {
          minX: 0,
          minY: 0
        }
      }
    );

    // Register performance overlay
    g_uiDebugManager.registerElement(
      'ui_performance',
      {
        x: 10,
        y: 100,
        width: 250,
        height: 120
      },
      (x, y) => {
        this.debugPositions.performanceOverlay.x = x;
        this.debugPositions.performanceOverlay.y = y;
      },
      {
        label: 'Performance Monitor',
        persistKey: 'performance_position'
      }
    );

    // Register entity inspector
    g_uiDebugManager.registerElement(
      'ui_entity_inspector',
      {
        x: width - 260,
        y: 100,
        width: 250,
        height: 200
      },
      (x, y) => {
        this.debugPositions.entityInspector.x = x;
        this.debugPositions.entityInspector.y = y;
      },
      {
        label: 'Entity Inspector',
        persistKey: 'inspector_position'
      }
    );

    console.log('UILayerRenderer: Registered all UI elements with debug system');
  }

  /**
   * Updated toolbar render method that uses debug-aware positioning
   */
  renderToolbar() {
    push();

    // Use debug position if available, otherwise use calculated position
    const toolbarX = this.debugPositions.toolbar.x || (width - 300) / 2;
    const toolbarY = this.debugPositions.toolbar.y || height - 70;

    // Update debug system with current calculated position if not set
    if (typeof g_uiDebugManager !== 'undefined' && g_uiDebugManager && 
        (this.debugPositions.toolbar.x === 0 && this.debugPositions.toolbar.y === 0)) {
      g_uiDebugManager.updateElementBounds('ui_toolbar', {
        x: toolbarX,
        y: toolbarY,
        width: 300,
        height: 60
      });
    }

    // ... rest of toolbar rendering using toolbarX, toolbarY ...
    
    // Background
    fill(...this.colors.hudBackground);
    noStroke();
    rect(toolbarX, toolbarY, 300, 60, 5);

    // ... button rendering ...

    pop();
  }

  /**
   * Updated HUD render method that uses debug-aware positioning
   */
  renderCurrencyDisplay() {
    push();

    const hudX = this.debugPositions.hud.x || 10;
    const hudY = this.debugPositions.hud.y || 10;

    // Background panel
    fill(...this.colors.hudBackground);
    noStroke();
    rect(hudX, hudY, 200, 80, 5);
    
    // Resource text
    fill(...this.colors.hudText);
    textAlign(LEFT, TOP);
    textSize(14);
    text(`Wood: ${this.hudElements.currency.wood}`, hudX + 10, hudY + 15);
    text(`Food: ${this.hudElements.currency.food}`, hudX + 10, hudY + 35);
    text(`Population: ${this.hudElements.currency.population}`, hudX + 10, hudY + 55);

    pop();
  }

  /**
   * Updated minimap render method that uses debug-aware positioning
   */
  renderMinimap() {
    if (!this.hudElements.minimap.enabled) return;

    push();
    
    const minimapX = this.debugPositions.minimap.x || (width - 130);
    const minimapY = this.debugPositions.minimap.y || 10;
    const size = this.hudElements.minimap.size;
    
    // Background
    fill(0, 0, 0, 180);
    stroke(255);
    strokeWeight(2);
    rect(minimapX, minimapY, size, size);
    
    // ... rest of minimap rendering ...
    
    pop();
  }

  /**
   * Updated performance overlay that uses debug-aware positioning
   */
  renderBasicPerformanceOverlay() {
    const perfX = this.debugPositions.performanceOverlay.x || 10;
    const perfY = this.debugPositions.performanceOverlay.y || 100;

    // Background
    fill(...this.colors.debugBackground);
    noStroke();
    rect(perfX, perfY, 250, 120, 5);
    
    // Performance text
    fill(...this.colors.debugText);
    textAlign(LEFT, TOP);
    textSize(12);
    text('PERFORMANCE', perfX + 10, perfY + 10);
    text(`Frame: ${frameRate().toFixed(1)} FPS`, perfX + 10, perfY + 30);
    text(`Render Time: ${this.stats.lastRenderTime.toFixed(2)}ms`, perfX + 10, perfY + 50);
    
    // ... rest of performance display ...
  }

  /**
   * Updated entity inspector that uses debug-aware positioning  
   */
  renderEntityInspector() {
    if (!this.debugUI.entityInspector.selectedEntity) return;
    
    push();
    
    const inspectorX = this.debugPositions.entityInspector.x || (width - 260);
    const inspectorY = this.debugPositions.entityInspector.y || 100;
    
    // Background
    fill(...this.colors.debugBackground);
    noStroke();
    rect(inspectorX, inspectorY, 250, 200, 5);
    
    // ... rest of entity inspector rendering ...
    
    pop();
  }

  /**
   * Handle window resize - update UI element constraints
   */
  handleResize() {
    if (typeof window.g_uiDebugManager === 'undefined' || !window.g_uiDebugManager) return;

    // Update minimap default position
    const newMinimapX = width - 130;
    window.g_uiDebugManager.updateElementBounds('ui_minimap', {
      x: this.debugPositions.minimap.x || newMinimapX,
      y: this.debugPositions.minimap.y || 10,
      width: 120,
      height: 120
    });

    // Update toolbar default position  
    const newToolbarX = (width - 300) / 2;
    const newToolbarY = height - 70;
    window.g_uiDebugManager.updateElementBounds('ui_toolbar', {
      x: this.debugPositions.toolbar.x || newToolbarX,
      y: this.debugPositions.toolbar.y || newToolbarY,
      width: 300,
      height: 60
    });
  }
}

// Global initialization function to set up the debug system
function initializeUIDebugSystem() {
  // UI Debug Manager creation disabled
  // if (typeof window !== 'undefined') {
  //   window.g_uiDebugManager = new UIDebugManager();
  //   
  //   // Enable/disable based on development mode
  //   if (DEV_MODE) {
  //     window.g_uiDebugManager.enable();
  //   }
  //   
  //   console.log('Global UI Debug System initialized');
  // }
}

// Initialize all UI elements with debug system
function initializeAllUIElements() {
  // Initialize dropoff UI if available
  if (typeof window.initDropoffUI === 'function') {
    window.initDropoffUI();
  }
  
  // Initialize menu debug UI if available  
  if (typeof window.initMenuDebugUI === 'function') {
    window.initMenuDebugUI();
  }
  
  console.log('UI Debug System: All UI elements initialized');
}

// Auto-initialization disabled  
// if (typeof window !== 'undefined') {
//   // Wait for DOM to be ready
//   if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', () => {
//       initializeUIDebugSystem();
//       // Delay UI element registration to ensure all scripts are loaded
//       setTimeout(initializeAllUIElements, 200);
//     });
//   } else {
//     initializeUIDebugSystem();
//     // Delay UI element registration to ensure all scripts are loaded
//     setTimeout(initializeAllUIElements, 200);
//   }
// }

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initializeUIDebugSystem };
}
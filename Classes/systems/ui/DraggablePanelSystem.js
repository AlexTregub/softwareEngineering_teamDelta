/**
 * @fileoverview Draggable Panel System Initialization
 * Sets up draggable panels for UI});
    
    if (typeof globalThis.logVerbose === 'function') {
 * 
 * @author Software Engineering Team Delta - David Willman
 * @version 1.0.0
 */

/**
 * Initialize the Draggable Panel System
 * Call this from your main setup function after the Universal Button System
 */
async function initializeDraggablePanelSystem() {
  try {
    // Check if DraggablePanelManager is available
    if (typeof DraggablePanelManager === 'undefined') {
      console.error('❌ DraggablePanelManager not loaded. Check index.html script tags.');
      return false;
    }

    
    // Create panel manager instance
    window.draggablePanelManager = new DraggablePanelManager();
    window.draggablePanelManager.initialize();

    // Add keyboard shortcuts for toggling panels
    setupPanelKeyboardShortcuts();
    
    // Coordinate with UILayerRenderer to avoid double rendering
    coordinateWithUIRenderer();
    return true;
    
  } catch (error) {
    console.error('❌ Failed to initialize Draggable Panel System:', error);
    return false;
  }
}

/**
 * Set up keyboard shortcuts for panel management
 */
function setupPanelKeyboardShortcuts() {
  // Add to existing keyboard handler or create one
  if (typeof window !== 'undefined') {
    // Store original keyPressed if it exists
    const originalKeyPressed = window.keyPressed;
    
    window.keyPressed = function() {
      // Call original keyPressed first
      if (originalKeyPressed && typeof originalKeyPressed === 'function') {
        originalKeyPressed();
      }
      
      // Handle panel shortcuts
      if (window.draggablePanelManager) {
        // Shift+N: Toggle All UI Panels (handled by UIController now)
        if (keyCode === 78 && keyIsDown(SHIFT) && !keyIsDown(CONTROL)) { // 'N' key
          // Let UIController handle this via g_keyboardController
          return;
        }
        
        // Ctrl+Shift+R: Reset all panels to default positions
        if (keyCode === 82 && keyIsDown(CONTROL) && keyIsDown(SHIFT)) { // 'R' key
          window.draggablePanelManager.resetAllPanels();
        }
      }
    };
  }
}

/**
 * Coordinate with UILayerRenderer to avoid double rendering
 */
function coordinateWithUIRenderer() {
  // Try to access the UILayerRenderer instance and disable static performance overlay
  if (window.uiLayerRenderer) {
    // Disable the static performance overlay since we're using draggable panels
    if (window.uiLayerRenderer.debugUI && window.uiLayerRenderer.debugUI.performanceOverlay) {
      window.uiLayerRenderer.debugUI.performanceOverlay.enabled = false;
    }
  }
  
  // If UILayerRenderer isn't available yet, set up a delayed check
  setTimeout(() => {
    if (window.uiLayerRenderer && 
        window.uiLayerRenderer.debugUI && window.uiLayerRenderer.debugUI.performanceOverlay) {
      window.uiLayerRenderer.debugUI.performanceOverlay.enabled = false;
    }
  }, 1000);
}

/**
 * Update draggable panels (call this from your main draw loop)
 */
function updateDraggablePanels() {
  if (window.draggablePanelManager && mouseX !== undefined && mouseY !== undefined) {
    if (mouseIsPressed || true) {
      RenderManager.startRendererOverwrite(window.draggablePanelManager.update(mouseX, mouseY, mouse),1)
    }
  }
}

/**
 * Render draggable panels (call this from your main draw loop)
 */
function renderDraggablePanels() {
  if (window.draggablePanelManager && window.draggablePanelContentRenderers) {
    window.draggablePanelManager.render(window.draggablePanelContentRenderers);
  }
}

// Export functions for browser environment
if (typeof window !== 'undefined') {
  window.initializeDraggablePanelSystem = initializeDraggablePanelSystem;
  window.updateDraggablePanels = updateDraggablePanels;
  window.renderDraggablePanels = renderDraggablePanels;
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initializeDraggablePanelSystem,
    updateDraggablePanels,
    renderDraggablePanels
  };
}